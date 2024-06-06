import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { MusicPlayer } from './quranPlayer'; 

export type SurahRecord = {
    id: string;
    surah: string;
    ayah: string;
    reciter: string;
    url: string;
};

export type Surah = {
    number: number;
    name: {
        transliteration: {
            en: string;
        };
    };
};

export class SurahListProvider implements vscode.TreeDataProvider<RecitationTreeItem> {
    private recitationList: SurahRecord[];
    private musicPlayerProvider: MusicPlayer;

    private _onDidChangeTreeData: vscode.EventEmitter<RecitationTreeItem | undefined | void> = new vscode.EventEmitter<RecitationTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<RecitationTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(musicPlayerProvider: MusicPlayer) {
        this.recitationList = [];
        this.musicPlayerProvider = musicPlayerProvider;
        this.fetchRecitationList();
    }

    private async fetchRecitationList(): Promise<void> {
        try {
            console.log('Fetching Surah list...');
            const surahResponse: AxiosResponse<{ code: number; status: string; data: Surah[] }> = await axios.get('https://api.quran.gading.dev/surah', { responseType: 'json' });
            console.log('Fetched surah data:', surahResponse.data);

            const recitations: SurahRecord[] = [];
            const audioUrls = await this.scrapeAudioUrls();

            for (const surah of surahResponse.data.data) {
                const audioUrl = audioUrls[surah.number.toString()];
                if (audioUrl) {
                    recitations.push({
                        id: surah.number.toString(),
                        surah: surah.name.transliteration.en,
                        ayah: "1",
                        reciter: "Mishary Rashid Alafasy",
                        url: audioUrl
                    });
                }
            }

            const jsonFilePath = path.resolve(__dirname, 'Surahs.json');
            fs.writeFileSync(jsonFilePath, JSON.stringify(recitations, null, 2));
            this.recitationList = recitations;
            this._onDidChangeTreeData.fire();
            vscode.window.showInformationMessage('Quran recitation list downloaded successfully!');
            
            this.musicPlayerProvider.updatePlaylist(recitations);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                vscode.window.showErrorMessage(`Error fetching recitation list: ${error.message}`);
            } else {
                vscode.window.showErrorMessage(`Unknown error: ${error}`);
            }
        }
    }

    private async scrapeAudioUrls(): Promise<{ [key: string]: string }> {
        const response: AxiosResponse<string> = await axios.get('https://islamdownload.net/124158-murottal-misyari-rasyid-mishary-rashid.html');
        const $ = cheerio.load(response.data);
        const audioUrls: { [key: string]: string } = {};

        $('table tbody tr').each((index: any, element: any) => {
            const link = $(element).find('a').attr('href');
            const surahNumberMatch = link?.match(/\/(\d+)_/);
            if (link && surahNumberMatch) {
                const surahNumber = parseInt(surahNumberMatch[1], 10).toString();
                audioUrls[surahNumber] = link;
            }
        });

        return audioUrls;
    }

    private readRecitationList(): SurahRecord[] {
        const jsonFilePath = path.resolve(__dirname, 'Surahs.json');
        if (fs.existsSync(jsonFilePath)) {
            const fileContent = fs.readFileSync(jsonFilePath, { encoding: 'utf-8' });
            this.recitationList = JSON.parse(fileContent);
        }
        return this.recitationList;
    }

    public getRecitationList(): SurahRecord[] {
        return this.recitationList;
    }

    getTreeItem(element: RecitationTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: RecitationTreeItem): Thenable<RecitationTreeItem[]> {
        if (this.recitationList.length === 0) {
            this.readRecitationList();
        }
        return Promise.resolve(this.recitationList.map(recitation => new RecitationTreeItem(`${recitation.surah}`, recitation.url, recitation.reciter, vscode.TreeItemCollapsibleState.None)));
    }

    public refresh(): void {
        this.fetchRecitationList();
    }
}

export class RecitationTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private url: string,
        private reciter: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label} - ${this.reciter}`;
        this.description = this.tooltip;
        this.contextValue = 'recitation';
        this.command = {
            arguments: [url],
            command: 'quran-recitation.playRecitation',
            title: 'Play Recitation',
            tooltip: 'Play this recitation'
        };
    }
}
