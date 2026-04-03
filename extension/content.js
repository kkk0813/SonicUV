// listen for commands from the webpage, send them to the extension
window.addEventListener("message", (event) => {
    // security check: ignore messages that aren't from SonicUV website
    const validOrigins = ["http://localhost:8000", "http://127.0.0.1:8000"];
    if (event.source !== window || !validOrigins.includes(event.origin)) return;

    // if the webpage specifically flag the message for the extension, forward it
    if (event.data.direction === "from-page-to-extension") {
        chrome.runtime.sendMessage(event.data.message);
    }
});

// listen for state updates from the extension, send them to the webpage
chrome.runtime.onMessage.addListener((message, sender, sendRespose) => {
    // only forward messages specifically targeted at the webpage UI
    if (message.target === 'page') {
        window.postMessage({
            direction: "from-extension-to-page",
            message: message
        }, window.origin);
    }
});

// fix when the webpage is refreshed, it creates a race condition where index.html try to ask for song stats before the bridge is 
// built
// Announce to the webpage that the Chrome Extension bridge is officially connected
window.postMessage({ direction: "bridge-ready" }, window.origin);