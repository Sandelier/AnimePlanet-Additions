

(function() {
    injectedScripts.push("helper-browserSpecifics.js");
})();

async function requestFirefox(action, type, value) {
    try {
        const response = await browser.runtime.sendMessage({ action: action, requestType: type, value: value });
        if (response && response.value) {
            return response;
        } else {
            throw new Error('Response did not contain a valid value');
        }
    } catch (error) {
        throw new Error(`Failed to get value for ${type}: ${error}`);
    }
}

function requestChromium(action, type, value) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: action, requestType: type, value: value }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(`Failed to get value for ${type}: ${chrome.runtime.lastError.message}`));
            } else if (response && response.value) {
                resolve(response);
            } else {
                reject(new Error('Response did not contain a valid value'));
            }
        });
    });
}

let browserType = 'firefox';

async function setBrowserType() {
    try {
        await getValueFirefox("Test");
    } catch (error) {
        if (error instanceof ReferenceError) {
            browserType = 'chromium';
            await getValueChromium("Test");
        }
    }
}

setBrowserType();

async function requestFromLocal(action, type, value) { 
    if (browserType === "firefox") {
        return await requestFirefox(action, type, value);
    } else if (browserType === "chromium") {
        return await requestChromium(action, type, value);
    }
}