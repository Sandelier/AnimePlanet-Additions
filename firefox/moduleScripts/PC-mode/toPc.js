// PC mode script

let isPcModeEnabled = false;
    
// Firefox
let onBeforeSendHeadersListener = function(details) {
    if (details.url.includes("anime-planet.com")) {
        for (let i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name.toLowerCase() === "user-agent") {
                details.requestHeaders[i].value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0"; 
                break;
            }
        }
    }
    return { requestHeaders: details.requestHeaders };
};

function isMobile() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

export function changeToPcMode(enable) {

    if (!isMobile()) return;

    console.log(`Set PC mode to ${enable}`);
    // Chrome
    if (chrome.declarativeNetRequest !== undefined) {
        if (enable) {
            chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [{
                    id: 2,
                    priority: 1,
                    action: {
                        type: "modifyHeaders",
                        requestHeaders: [{
                            header: "User-Agent",
                            operation: "set",
                            value: "'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'"
                        }]
                    },
                    condition: {
                        urlFilter: "anime-planet.com",
                        resourceTypes: ["main_frame", "sub_frame"]
                    }
                }],
                removeRuleIds: [2]
            });
            isPcModeEnabled = true;
        } else {
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [2]
            });
            isPcModeEnabled = false;
        }

    // Firefox
    } else {
        if (enable) {
            browser.webRequest.onBeforeSendHeaders.addListener(
                onBeforeSendHeadersListener,
                { urls: ["<all_urls>"] },
                ["blocking", "requestHeaders"]
            );
            isPcModeEnabled = true;
        } else {
            browser.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersListener);
            isPcModeEnabled = false;
        }
    }
}

export function pcModeState() {
    return isPcModeEnabled;
}