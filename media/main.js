(function () {
    const vscode = acquireVsCodeApi();
    const audioPlayer = document.getElementById('quran');
    const playButton = document.getElementById('play');
    const pauseButton = document.getElementById('pause');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const quranListTable = document.getElementById('quranListTable');

    let playlist = [];
    let currentIndex = 0;

    function updateSongList() {
        quranListTable.innerHTML = '';
        playlist.forEach((song, index) => {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = song.surah;
            if (index === currentIndex) {
                cell.style.fontWeight = 'bold';
            }
            row.addEventListener('click', () => {
                currentIndex = index;
                playCurrentSong();
            });
            row.appendChild(cell);
            quranListTable.appendChild(row);
        });
    }

    function playCurrentSong() {
        const currentSong = playlist[currentIndex];
        if (currentSong) {
            audioPlayer.src = currentSong.url;
            audioPlayer.play();
            vscode.postMessage({ command: 'play', link: currentSong.url });
            updateSongList();
        }
    }

    function playPause() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playButton.style.display = 'none';
            pauseButton.style.display = 'inline';
        } else {
            audioPlayer.pause();
            playButton.style.display = 'inline';
            pauseButton.style.display = 'none';
        }
    }

    playButton.addEventListener('click', playPause);
    pauseButton.addEventListener('click', playPause);

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        playCurrentSong();
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % playlist.length;
        playCurrentSong();
    });

    window.addEventListener('message', event => {
        const message = event.data;
        if (message.link) {
            audioPlayer.src = message.link;
            audioPlayer.play();
        } else if (message.command === 'updatePlaylist') {
            playlist = message.playlist;
            currentIndex = 0;
            updateSongList();
            playCurrentSong();
        }
    });
}());
