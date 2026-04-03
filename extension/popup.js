const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const randomBtn = document.getElementById('randomBtn');
const loopBtn = document.getElementById('loopBtn');
const openWebBtn = document.getElementById('openWebBtn');

const songTitleText = document.getElementById('songTitle');
const songArtistText = document.getElementById('songArtist');
const blurBg = document.getElementById('blurBg');

const progressBar = document.getElementById('progressBar');
const currentTimeText = document.getElementById('currentTime');
const totalTimeText = document.getElementById('totalTime');

// Ask the offscreen document what is currently playing the second this popup opens!
chrome.runtime.sendMessage({ target: 'offscreen', action: 'requestState' });

// --- BUTTON LISTENERS ---
playPauseBtn.addEventListener('click', () => chrome.runtime.sendMessage({ target: 'offscreen', action: 'playPause'}));
nextBtn.addEventListener('click', () => chrome.runtime.sendMessage({ target: 'offscreen', action: 'next' }));
prevBtn.addEventListener('click', () => chrome.runtime.sendMessage({ target: 'offscreen', action: 'previous' }));
randomBtn.addEventListener('click', () => chrome.runtime.sendMessage({ target: 'offscreen', action: 'toggleRandom' }));
loopBtn.addEventListener('click', () => chrome.runtime.sendMessage({ target: 'offscreen', action: 'toggleLoop' }));

// --- QUICK LAUNCH BUTTON ---
openWebBtn.addEventListener('click', () => {
    // Tells Chrome to open a new tab pointing to the music server
    chrome.tabs.create({ url: 'http://localhost:8000' });
});

// Handle user dragging the timeline
progressBar.addEventListener('input', () => {
    chrome.runtime.sendMessage({ target: 'offscreen', action: 'seek', time: progressBar.value });
});

// Helper function to format seconds (e.g., 125 -> "2:05")
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// --- RECEIVE MESSAGES FROM OFFSCREEN ---
chrome.runtime.onMessage.addListener((message) => {
    if (message.target !== 'popup') return;

    // The giant state update
    if (message.action === 'updateUI') {
        songTitleText.innerText = message.title;
        songArtistText.innerText = message.artist;
        playPauseBtn.innerHTML = message.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
        
        // Update the background image!
        blurBg.style.backgroundImage = `url('http://localhost:8000/api/image/${message.imageId}')`;
        
        // Toggle the green active state for random/loop buttons
        randomBtn.classList.toggle('active-btn', message.isRandom);
        loopBtn.classList.toggle('active-btn', message.isLooping);
    }
    
    // The constant ticking clock update
    if (message.action === 'timeUpdate') {
        progressBar.max = message.duration;
        progressBar.value = message.currentTime;
        currentTimeText.innerText = formatTime(message.currentTime);
        totalTimeText.innerText = formatTime(message.duration);
    }
});