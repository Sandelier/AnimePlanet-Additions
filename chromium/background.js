
import './ini.js';
import { getMangaInfo } from './moduleScripts/contentScripts/Mangaupdates/searchManga.js';
import { startScraping } from './moduleScripts/StatsScraper/scrapingMain.js';
import { changeToPcMode } from "./moduleScripts/PC-mode/toPc.js";


var browser = browser || chrome;


// Filter scripts allowed urls.
const filterScriptsAllowedUrls = [
    "https://www.anime-planet.com/manga/all",
    "https://www.anime-planet.com/anime/all",
    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)"
]

// injectedscripts is for making sure we dont multi inject to same page.
const injectedScripts = new Map();

async function executeContentScript(url, tabId) {

    if (url.includes('dontInjectScripts') || url.includes('.com/search.php')) {
        return;
    }

    try {

        // If injected scripts is empty it might mean that background script has went idle so we need to retrieve the injected scripts.
        if (!injectedScripts.has(tabId)) {
            try {
                const results = await browser.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => {
                        const apfeaturesEle = document.getElementById('apfeatures-injectedScripts');
                        return apfeaturesEle ? apfeaturesEle.dataset.currentScripts : null;
                    },
                });

                if (results && results[0] && results[0].result) {
                    const scripts = JSON.parse(results[0].result);
                    injectedScripts.set(tabId, new Set(scripts));
                }

            } catch (error) {
                console.log(`Error occured while trying to retrieve injected scripts: ${error}`)
            }
        }

        const result = await new Promise((resolve, reject) => {
            browser.storage.local.get(['contentScripts'], (result) => {
                if (browser.runtime.lastError) {
                    reject(browser.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        });
    
        const contentScripts = result.contentScripts;

        if (!injectedScripts.has(tabId)) {
            injectedScripts.set(tabId, new Set());
        }

        const tabInjectedScripts = injectedScripts.get(tabId);


        const isFilterAllowed = isScriptTypeAllowed(url, filterScriptsAllowedUrls);


        // Script injection checks + adding dependencies
        const validScripts = new Set();

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

        function enableDependencies(scriptName, visited = new Set()) {
            if (visited.has(scriptName)) return;
            visited.add(scriptName);
        
            const script = contentScripts[scriptName];
            if (!script || script.enabled) return;
        
            if (script.mobile && !isMobile() && !script.desktop) return;
            if (script.desktop && isMobile() && !script.mobile) return;

            script.enabled = true;
            validScripts.add(scriptName);
        
            if (script.dependencies) {
                for (const dependency of script.dependencies) {
                    enableDependencies(dependency, visited);
                }
            }
        }

        for (const [scriptName, script] of Object.entries(contentScripts)) {
            if (!script.enabled) continue;

            if (script.mobile && !isMobile() && !script.desktop) continue;
            if (script.desktop && isMobile() && !script.mobile) continue;


            const { allowedUrls } = script;
        
            if (scriptName.startsWith("filter/") && !isFilterAllowed) continue;
            if (tabInjectedScripts.has(scriptName)) continue;
            if (allowedUrls && allowedUrls.length > 0 && !isScriptTypeAllowed(url, allowedUrls)) continue;
        
            validScripts.add(scriptName);
            if (script.dependencies) {
                for (const dependency of script.dependencies) {
                    enableDependencies(dependency);
                }
            }
        }

        const sortedScripts = Object.entries(contentScripts)
            .filter(([scriptName, script]) => validScripts.has(scriptName) && script.enabled)
            .map(([scriptName, script]) => ({ scriptName, ...script }))
            .sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));

        const prioritizedScripts = sortedScripts.filter(({ priority }) => priority !== undefined);
        const nonPrioritizedScripts = sortedScripts.filter(({ priority }) => priority === undefined);

        // Injecting priority scripts
        const injectionStartTime = performance.now();
        for (const { scriptName, priority } of prioritizedScripts) {
            try {
                await Promise.race([
                    browser.scripting.executeScript({
                        target: { tabId, allFrames: true },
                        files: [`contentScripts/${scriptName}`],
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout injecting: ${scriptName}`)), 1000))
                ]);
                console.log(`Injected script: ${scriptName} (Priority: ${priority ?? 'N/A'})`);
                tabInjectedScripts.add(scriptName);
            } catch (error) {
                console.warn("Error occured but the script might have been injected:", error);
            }
        }

        // Injecting scripts with no priority
        const nonPrioritizedPromises = nonPrioritizedScripts.map(({ scriptName }) =>
            Promise.race([
                browser.scripting.executeScript({
                    target: { tabId, allFrames: true },
                    files: [`contentScripts/${scriptName}`],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout injecting: ${scriptName}`)), 1000))
            ])
        );

        const results = await Promise.allSettled(nonPrioritizedPromises);

        results.forEach((result, index) => {
            const { scriptName } = nonPrioritizedScripts[index];
            if (result.status === 'fulfilled') {
                console.log(`Injected script: ${scriptName} (No Priority)`);
                tabInjectedScripts.add(scriptName);
            } else {
                console.warn(`Error injecting script: ${scriptName}`, result.reason);
            }
        });

        console.log(`Total injection time: ${(performance.now() - injectionStartTime).toFixed(2)}ms`);

    } catch (error) {
        console.error('Failed to execute content script:', error);
    }
}

function isScriptTypeAllowed(url, allowedArray) {
    for (const allowedUrl of allowedArray) {
        // string check
        if (!allowedUrl.includes('\/')) {
            console.log("string", allowedUrl)
            if (url.startsWith(allowedUrl)) {
                return true;            
            }
        // regex
        } else {
            const pattern = new RegExp(allowedUrl);
            if (pattern.test(url)) {
                return true;
            }
        }
    }
    return false;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {

        case 'getLocalStorageValue':
            if (message.requestType) {
                browser.storage.local.get([message.requestType], (result) => {
                    const value = result[message.requestType];
                    sendResponse({ value });
                });
            } else {
                console.warn('Missing requestType for getLocalStorageValue');
            }
            break;
        case 'setLocalStorageValue':
            // We can add some error handling to this later like maybe sending an response back if it was successful or not so we can tell the user.
            if (message.requestType && message.value) {
                browser.storage.local.set({ [message.requestType]: message.value }, () => {});
            } else {
                console.warn('Missing requestType for setLocalStorageValue');
            }
            break;
        case 'getMangaInfo':
            if (message.value) {
                (async () => {
                    try {
                        const mangaInfo = await getMangaInfo(message.value);
                        sendResponse({ value: mangaInfo });
                    } catch (error) {
                        console.error('Error fetching manga info:', error);
                        sendResponse({ error: 'Failed to fetch manga info' });
                    }
                })();
            } else {
                console.warn('Missing manga name for getMangaInfo');
            }
            break;
        case 'scrapeUser':
            startScraping(message.value);
            break;
        case 'PCMode':
            changeToPcMode(message.value);
        default:
            console.warn('Unknown action:', message.action);
            break;
    }

    return true;
});



function checkTabUrl(url, tabId) {
    if (url.startsWith('https://www.anime-planet.com/')) {
        executeContentScript(url, tabId);
    }
}




// When site is updated (called earlier than onupdated)

browser.webNavigation.onCommitted.addListener((details) => {
    if (details.url.startsWith('https://www.anime-planet.com')) {

        injectedScripts.delete(details.tabId);
		checkTabUrl(details.url, details.tabId);
    }
});

// When different tab is clicked
function getCurrentTab() {
	return browser.tabs.query({ active: true, currentWindow: true });
}

const onActivatedHandler = (activeInfo) => {
	getCurrentTab().then((tabs) => {
		const currentTab = tabs[0];
        
		if (currentTab.status === "complete" && currentTab.url) {
			checkTabUrl(currentTab.url, currentTab.id);
		}
	});
};
  

browser.tabs.onActivated.addListener(onActivatedHandler);