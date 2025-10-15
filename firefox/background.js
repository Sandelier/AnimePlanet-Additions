


var browser = browser || chrome;


// Filter scripts allowed urls.
const filterScriptsAllowedUrls = [
    "https://www.anime-planet.com/manga/all",
    "https://www.anime-planet.com/anime/all",
    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)"
]

// Have to make an function since theres just too many similar urls so we cant just do an one regex
function isTooltipPage(url) {
    const u = new URL(url);
    const path = u.pathname + u.search;
    const allowed = [
        /^\/$/, // homepage
        /^\/(manga|anime)\/[^/]+$/, 
        /^\/(manga|anime)\/$/,
        /^\/(manga|anime)\/all(?:[#?].*)?$/,
        /^\/(manga|anime)\/top-(manga|anime)(?:\/(today|week))?$/,
        /^\/users\/recent_recommendations\.php.*$/,
        /^\/users\/[^/]+\/recommendations$/,
        /^\/users\/[^/]+\/(manga|anime).*$/,
        /^\/users\/[^/]+\/lists\/[^/]+$/,
        /^\/characters\/[^/]+$/,
        /^\/(manga|anime)\/tags\/[^/?]+$/,
        // manga only
        /^\/manga\/(magazines|publishers)\/[^/?]+$/,
        /^\/manga\/(recommendations|read-online|webtoons|light-novels)\//,
        // anime only
        /^\/anime\/studios\/[^/?]+$/,
        /^\/anime\/seasons\/[^/]+$/
    ];
    const disallowed = [/^\/(manga|anime)\/(magazines|publishers|tags)(\?.*)?$/];
    if (disallowed.some(re => re.test(path))) return false;
    return allowed.some(re => re.test(path));
}

// Have to make an function since theres just too many similar urls so we cant just do an one regex
function isEntryPage(url) {
    const u = new URL(url);
    const path = u.pathname;
    
    const reserved = [
      "all",
      "top-manga",
      "top-anime",
      "tags",
      "magazines",
      "publishers",
      "studios",
      "seasons",
      "recommendations",
      "characters",
      "staff",
      "reviews",
      "lists"
    ];
    const reservedPattern = reserved.join("|");

    //const entryPage = new RegExp(`^/(manga|anime)/(?!(${reservedPattern})$)[^/]+$`);

    // if at some point we need to use recommendations/characters/staff/reviews/lists tab but for now we can't use them for any of the scripts other then cleanerAltTitles
    const entryPage = [ 
        new RegExp(`^/(manga|anime)/(?!(${reservedPattern})$)[^/]+$`),
        /^\/(manga|anime)\/[^/]+\/(recommendations|characters|staff|reviews|lists)$/ 
    ];
    return entryPage.some(re => re.test(path));

    //return entryPage.test(path);
}

// injectedscripts is for making sure we dont multi inject to same page.
const injectedScripts = new Map();

// sendResponse will not be null if its the first injection time (bootstrap activation)
async function executeContentScript(url, tabId, sendResponse = null, loadedDom = true) {

    if (url.includes('dontInjectScripts') || url.includes('.com/search.php')) {
        return;
    }
    
    console.clear();
    console.log(`url: ${url}, tabId: ${tabId}`)

    console.log("isTooltipPage: ", isTooltipPage(url));
    console.log("IsEntryPage: ", isEntryPage(url));

    try {

        // If injected scripts is empty it might mean that background script has went idle so we need to retrieve the injected scripts.
        if (!injectedScripts.has(tabId) && loadedDom === true) {
            console.log("Retrieving tab injected scripts");
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

            if (script.tooltipPage || script.entryPage) {
                const tooltipOk = script.tooltipPage ? isTooltipPage(url) : false;
                const entryOk = script.entryPage ? isEntryPage(url) : false;
                if (!(tooltipOk || entryOk)) return;
            }

            if (tabInjectedScripts.has(scriptName)) return;

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


            const { allowedUrls, tooltipPage, entryPage } = script;

            if (tooltipPage || entryPage) {
                const tooltipOk = tooltipPage ? isTooltipPage(url) : false;
                const entryOk = entryPage ? isEntryPage(url) : false;
                if (!(tooltipOk || entryOk)) continue;
            }
        
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

        // Sending scripts with no priority and no dependencies to bootstrap immediately since otherwise we would run into navigator readiness issue again

        if (sendResponse != null && loadedDom === false) {
            const bootstrapScripts = [
                { action: "instant", scripts: [] },
                { action: "priority", scripts: [] },
                { action: "dependent", scripts: [] }
            ];
        
            // ---- Instant (no priority, no dependencies)
            const instantInjects = sortedScripts.filter(
                ({ priority, dependencies }) => priority === undefined && dependencies === undefined
            );
            instantInjects.forEach(script => tabInjectedScripts.add(script.scriptName));
            bootstrapScripts.find(b => b.action === "instant").scripts.push(...instantInjects);
        
            // Priority (scripts with a priority)
            const priorityInjects = sortedScripts.filter(({ priority }) => priority !== undefined);
            priorityInjects.forEach(script => tabInjectedScripts.add(script.scriptName));
            bootstrapScripts.find(b => b.action === "priority").scripts.push(...priorityInjects);
        
            // Dependent (dependencies but no priority)
            const dependentInjects = sortedScripts.filter(
                ({ dependencies, priority }) => dependencies !== undefined && priority === undefined
            );
            dependentInjects.forEach(script => tabInjectedScripts.add(script.scriptName));
            bootstrapScripts.find(b => b.action === "dependent").scripts.push(...dependentInjects);
        
            sendResponse(bootstrapScripts);
        
        // Injects new scripts that were added later on when the page had already loaded
        } else {
            // Injecting priority scripts
            const prioritizedScripts = sortedScripts.filter(({ priority }) => priority !== undefined);

            for (const { scriptName, priority } of prioritizedScripts) {
            try {
                await Promise.race([
                    browser.scripting.executeScript({
                        target: { tabId },
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

            // Injecting scripts with no priority but has dependencies
            const noPriorityScripts = sortedScripts.filter(({ priority }) => priority === undefined);
            const nonPrioritizedPromises = noPriorityScripts.map(({ scriptName }) =>
            Promise.race([
                browser.scripting.executeScript({
                    target: { tabId },
                    files: [`contentScripts/${scriptName}`],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout injecting: ${scriptName}`)), 1000))
            ])
            );

            const results = await Promise.allSettled(nonPrioritizedPromises);

            results.forEach((result, index) => {
            const { scriptName } = noPriorityScripts[index];
            if (result.status === 'fulfilled') {
                console.log(`Injected script: ${scriptName} (No Priority)`);
                tabInjectedScripts.add(scriptName);
            } else {
                console.warn(`Error injecting script: ${scriptName}`, result.reason);
            }
            });

        }


        // We need to make this into an content script since currently its possible for this o not get inejcted ta all
        // Makes it so we can run executeContentScript again when the tab comes into view
        // Workaround so we dont need to have tabs permission. I know there are some problems with this but it's good enough
        // We want to execute this last since executeScript waits for the navigator readiness
        await browser.scripting.executeScript({
            target: { tabId },
                func: (tabId => {
                    (function() {
                        const injectedScripts = document.getElementById("apfeatures-injectedScripts");

                        if (injectedScripts) {
                        	const data = injectedScripts.getAttribute("data-current-scripts");
                        	try {
                        		const scripts = JSON.parse(data);
                            
                        		if (scripts.includes("helper/VisibilityChecker")) {
                        			return;
                        		}
                        	} catch (e) {
                        		console.error("Failed to parse injected scripts", e);
                        	}
                        }

                        document.dispatchEvent(new CustomEvent("injectedScript", {detail: { name: "helper/VisibilityChecker" }}));

                        function notifyIfVisible() {
                        	if (document.visibilityState === "visible" && document.hasFocus()) {
                        		browser.runtime.sendMessage({
                        			action: "tabVisibility",
                        			value: {
                        				tabId,
                        				url: window.location.href
                        			}
                        		});
                        	}
                        }

                        document.addEventListener("visibilitychange", notifyIfVisible);
                        window.addEventListener("focus", notifyIfVisible);
                    })();
                }),
            args: [tabId]
        });

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
                        const { getMangaInfo } = await import("./moduleScripts/contentScripts/Mangaupdates/searchManga.js");
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
            (async () => {
                try {
                    const { startScraping } = await import("./moduleScripts/StatsScraper/scrapingMain.js");
                    startScraping(message.value);
                } catch (error) {
                    console.error('Error loading scraper module:', error);
                }
            })();

            break;
        case 'PCMode':

            (async () => {
                try {
                    const { changeToPcMode } = await import("./moduleScripts/PC-mode/toPc.js");
                    changeToPcMode(message.value);
                } catch (error) {
                    console.error('Error loading scraper module:', error);
                }
            })();
            break;
        case `tabVisibility`:
            executeContentScript(message.value.url, message.value.tabId);
            break;
        case 'bootstrap':
            if (message.scraper === false) {
                injectedScripts.delete(sender.tab.id);
                executeContentScript(message.value, sender.tab.id, sendResponse, message.loadedDom);
            }
            break;
        default:
            console.warn('Unknown action:', message.action);
            break;
    }

    return true;
});