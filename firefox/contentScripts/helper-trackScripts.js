

const injectedScripts = ["helper-trackScripts.js"];

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`test ${message}`);
    if (message.action === "getInjectedScripts") {
        sendResponse({ scripts: injectedScripts});
    }
});