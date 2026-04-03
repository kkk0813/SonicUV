const player = document.getElementById('player');
let songDatabase = [];
let currentIndex = -1;
let isRandom = false;

// fetch the song from docker container
async function initializePlaylist() {
    try {
        const response = await fetch('http://localhost:8000/api/songs');
        const data = await response.json();
        songDatabase = data.songs;
    } catch (err) {
        console.error("SonicUV is offline or Docker is not running.");
    }
}

// playback engine
function playSong(index) {
    if (songDatabase.length === 0) return;

    currentIndex = index;
    const song = songDatabase[currentIndex];

    // stream directly from fastapi backend
    player.src = `http://localhost:8000/api/play/${song.id}`;
    player.play();

    // broadcast to the popup UI that the song changed
    broadcastState();
}

// Helper function to broadcast the current state
function broadcastState() {
    if (currentIndex === -1) return;
    const song = songDatabase[currentIndex];
    
    const stateData = {
        action: 'updateUI',
        title: song.title,
        artist: song.artist,
        isPlaying: !player.paused,
        imageId: song.id, 
        isRandom: isRandom,
        isLooping: player.loop
    };

    // Broadcast to the Extension Popup
    chrome.runtime.sendMessage({ target: 'popup', ...stateData });
    // Broadcast to the Webpage (via the content.js bridge)
    chrome.runtime.sendMessage({ target: 'page', ...stateData })
}

// listen for command from the popup buttons
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Only listen to commands targeted at the offscreen audio engine
    if (message.target !== 'offscreen') return;

    // popup is asking for the current state
    if (message.action === 'requestState') {
        broadcastState();
    }

    if (message.action === 'playPause') {
        if (player.src === "") {
            playSong(isRandom ? Math.floor(Math.random() * songDatabase.length) : 0); 
        } else if (player.paused) {
            player.play();
        } else {
            player.pause();
        }
        broadcastState();
    }

    if (message.action === 'next') {
        let nextIndex = isRandom ? Math.floor(Math.random() * songDatabase.length) : (currentIndex + 1) % songDatabase.length;
        playSong(nextIndex);
    }

    if (message.action === 'previous') {
        if (player.currentTime > 3) {
            player.currentTime = 0;
        } else {
            let prevIndex = (currentIndex - 1 + songDatabase.length) % songDatabase.length;
            playSong(prevIndex);
        }
    }

    if (message.action === 'toggleRandom') {
        isRandom = !isRandom;
        if (isRandom) player.loop = false;
        broadcastState();
    }

    if (message.action === 'toggleLoop') {
        player.loop = !player.loop;
        if (player.loop) isRandom = false;
        broadcastState();
    }

    // Handle user dragging the progress bar in the popup
    if (message.action === 'seek') {
        player.currentTime = message.time;
    }

    if (message.action === 'setVolume') {
        player.volume = message.volume;
    }

    if (message.action === 'playSpecific') {
        // Find the exact index of the song ID requested by the webpage
        const targetIndex = songDatabase.findIndex(song => song.id === message.id);
        if (targetIndex !== -1) {
            playSong(targetIndex);
        }
    }
});

// Broadcast the time every second so the popup slider moves
player.addEventListener('timeupdate', () => {
    const timeData = {
        action: 'timeUpdate',
        currentTime: player.currentTime,
        duration: player.duration
    };

    chrome.runtime.sendMessage({ target: 'popup', ...timeData });
    chrome.runtime.sendMessage({ target: 'page', ...timeData });
});

// Auto-play the next song when one ends
player.addEventListener('ended', () => {
    let nextIndex = isRandom ? Math.floor(Math.random() * songDatabase.length) : (currentIndex + 1) % songDatabase.length;
    playSong(nextIndex);
});

// Boot it up!
initializePlaylist();