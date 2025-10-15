// Initial injection at the start of an page so we dont need any webnavigation/tab permissions

browser.runtime.sendMessage({
    action: "bootstrap",
    value: window.location.href,
    scraper: window.location.href.includes("dontInjectScript"),
    loadedDom: !!document.querySelector('#siteFooter')
}, response => {
    if (!response) return;
    console.log(response);

    // We importing them instead of using executeScript so we can avoid navigator readiness check for scripts that dont have any dependencies or priorities


    (async () => {
        for (const { action, scripts } of response) {
            if (!scripts.length) continue;

            switch (action) {
                // Parallel import
                case "instant": 
                case "dependent": {
                    const tasks = scripts.map(async ({ scriptName, elementDependency }) => {
                        const scriptUrl = browser.runtime.getURL(`contentScripts/${scriptName}`);
                        try {
                            if (elementDependency) {
                                await waitForElement(elementDependency);
                            }
                            await import(scriptUrl);
                            console.log(`Imported ${scriptUrl}`);
                        } catch (err) {
                            console.error(`Failed to import ${scriptUrl}:`, err);
                        }
                    });
                    await Promise.allSettled(tasks);
                    break;
                }

                // Sequential import
                case "priority": {
                    for (const { scriptName, elementDependency } of scripts) {
                        const scriptUrl = browser.runtime.getURL(`contentScripts/${scriptName}`);
                        try {
                            if (elementDependency) {
                                await waitForElement(elementDependency);
                            }
                            await import(scriptUrl);
                            console.log(`Imported ${scriptUrl}`);
                        } catch (err) {
                            console.error(`Failed to import ${scriptUrl}:`, err);
                        }
                    }
                    break;
                }

                default:
                    console.warn(`Unknown action: ${action}`);
            }
        }
    })();
});


function waitForElement(selector) {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            const footer = document.querySelector("#siteFooter");

            if (el) {
                observer.disconnect();
                resolve(el);
            } else if (footer) {
                observer.disconnect();
                reject(new Error(`${selector} was not found`));
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    });
}