

(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "helper/browserSpecifics.js" } }));

    // Returns an value

    async function requestFirefox(action, type, value) {
        try {
            const response = await browser.runtime.sendMessage({ action: action, requestType: type, value: value });
            if (response && response.value) {

                console.log(type, response.value);

                return response;
            } else {
                throw new Error('Response did not contain a valid value');
            }
        } catch (error) {
            throw new Error(`Failed to get value for ${type}: ${error}`);
        }
    }

    async function requestChromium(action, type, value) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action, requestType: type, value }, (response) => {
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

    const browserType = (typeof browser !== "undefined") ? "firefox" : "chromium";

    async function requestFromLocal(action, type, value) { 
        if (browserType === "firefox") {
            return await requestFirefox(action, type, value);
        } else if (browserType === "chromium") {
            return await requestChromium(action, type, value);
        }
    }

    document.addEventListener("requestFromLocal", async (event) => {
        const { action, type, value, requestId } = event.detail;
        const response = await requestFromLocal(action, type, value);

        const responseEvent = new CustomEvent(`responseFromLocal_${type}${requestId}`, {
            detail: response
        });

        document.dispatchEvent(responseEvent);
    });


    // Does not return anything

    function sendToLocal(action, type, value) {
        if (browserType === "firefox") {
            browser.runtime.sendMessage({ action, requestType: type, value }).catch(() => {});
        } else if (browserType === "chromium") {
            chrome.runtime.sendMessage({ action, requestType: type, value }, () => {});
        }
    }

    document.addEventListener("sendToLocal", (event) => {
        const { action, type, value } = event.detail;
        sendToLocal(action, type, value);
    });

})();