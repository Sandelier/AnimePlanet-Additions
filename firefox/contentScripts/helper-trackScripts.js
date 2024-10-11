

const injectedScripts = ["helper-trackScripts.js"];

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getInjectedScripts") {
        sendResponse({ scripts: injectedScripts});
    }
});