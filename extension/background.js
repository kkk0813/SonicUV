// function to safely boot up the invisible speaker
async function setupOffscreenDocument(path) {
    // check if offscreen document already exists
    if (await chrome.offscreen.hasDocument()) return;

    // if not, create a new one
    await chrome.offscreen.createDocument({
        url: path,
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Playing SonicUV music in the background'
    });
}

// boot the audio engine at the moment the extension loads
chrome.runtime.onStartup.addListener(() => {
    setupOffscreenDocument('offscreen.html');
});

// if the popup sends a message, make sure the offscreen document is awake to receive it
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Wake up the offscreen engine if a command comes in
    if (message.target === 'offscreen') {
        setupOffscreenDocument('offscreen.html');
    }

    // THE ROUTER: If the offscreen brain wants to talk to the webpage, forward it!
    if (message.target === 'page') {
        // Find all tabs open to SonicUV and send the message directly to them
        chrome.tabs.query({ url: ["http://localhost:8000/*", "http://127.0.0.1:8000/*"] }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, message);
            });
        });
    }
});