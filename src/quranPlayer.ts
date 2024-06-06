import * as vscode from 'vscode';

export class MusicPlayer implements vscode.WebviewViewProvider {
    public static readonly viewType = 'quran-recitation.musicPlayer';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public async sendMusicInformToPlayer(link: string) {
        if (this._view) {
            this._view.webview.postMessage({ link });
        }
    }

    public async updatePlaylist(playlist: { surah: string, url: string }[]) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'updatePlaylist', playlist });
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const playUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'play.png'));
        const pauseUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'pause.png'));
        const prevUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'prev.png'));
        const nextUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'next.png'));
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="${cssUri}">
            <title>Quran Recitation Player</title>
        </head>
        <body>
            <div id="player-container">
                <audio id="quran" controls>
                    <source src="" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <div id="control">
                    <center>
                        <button id="prev"><img src="${prevUri}" width="30" height="30"></button>
                        <button id="play"><img src="${playUri}" width="30" height="30"></button>
                        <button id="pause" style="display:none;"><img src="${pauseUri}" width="30" height="30"></button>
                        <button id="next"><img src="${nextUri}" width="30" height="30"></button>
                    </center>
                </div>
                <h4>Current Playlist</h4>
                <table id="quranListTable"></table>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    }
}
