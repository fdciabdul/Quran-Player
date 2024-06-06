import * as vscode from 'vscode';
import { SurahListProvider } from './quranRecitationListProvider'; 
import { MusicPlayer } from './quranPlayer'; 

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Thanks for installing this extension, hope you like it!');

    const musicPlayerProvider = new MusicPlayer(context.extensionUri);
    vscode.window.registerWebviewViewProvider(MusicPlayer.viewType, musicPlayerProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    });

    const quranRecitationListProvider = new SurahListProvider(musicPlayerProvider);
    vscode.window.registerTreeDataProvider('quranRecitations', quranRecitationListProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('quran-recitation.playRecitation', (link: string) => {
            vscode.window.showInformationMessage(`Playing recitation from: ${link}`);
            musicPlayerProvider.sendMusicInformToPlayer(link);
        })
    );
}

export function deactivate() {}
