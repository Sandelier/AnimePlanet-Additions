


/* Initilization */
browser.runtime.onInstalled.addListener(() => {
    const defaultSettings = {
        disallowedTags: ["Sexual Content", "Mature Themes", "Emotional Abuse"],
        pagesToSearch: 1,
    
        contentScripts: {
            "helper-parseTooltips.js": { 
                formattedName: "Tooltip parse",
                enabled: true,
                description: "Helper script to parse tooltips from mangas/animes so we dont need to do expensive calls for each script.",
                allowedUrls: []
            },
            "helper-filter-newTabEntries.js": {
                formattedName: "Easier filter tabs",
                enabled: true,
                description: "Helper script to add new filter methods.",
                allowedUrls: []
            },
            "load-extrapages.js": {
                formattedName: "Extra pages",
                enabled: false,
                description: "Allows you to load more mangas/animes into one page by loading extra pages.",
                allowedUrls: [
                    "https://www.anime-planet.com/manga/all",
                    "https://www.anime-planet.com/anime/all",
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)"
                ],
                changeableData: "pagesToSearch"
            },
            "permanentTagBlocking.js": { 
                formattedName: "Tag blocker",
                enabled: false,
                description: "Removes mangas/animes that contains an tag you dont like.",
                allowedUrls: [],
                changeableData: "disallowedTags"
            },
            "filter-applyBtn-AlwaysOn.js": {
                formattedName: "Apply button shown",
                enabled: false,
                description: "Makes the apply button on filters to be always shown."
            },
            "filter-quick-apply.js": {
                formattedName: "Quick apply",
                enabled: false,
                description: "New button to filter current mangas/animes in the page without loading next page."
            },
            "filter-tags-search.js": {
                formattedName: "Tags search",
                enabled: false,
                description: "Adds an search bar for tags."
            },
            "forum-clickableUsername.js": {
                formattedName: "Clickable usernames",
                enabled: false,
                description: "Makes usernames clickable in forum profile",
                allowedUrls: [
                    "https:\\/\\/www\\.anime-planet\\.com\\/forum\\/members\\/[^\\.]+\\.\\d+\\/"
                ]
            },
            "filter-chapter.js": {
                formattedName: "Chapter filtering",
                enabled: false,
                description: "Adds chapter filtering in current page.",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/manga"
                ]
            },
            "filter-contains.js": {
                formattedName: "Contains filtering",
                enabled: false,
                description: "Filters entries that dont contain any of the tags defined.",
            },
            "wip/list-removeEntry.js": {
                formattedName: "List entry remover",
                enabled: false,
                description: 'Makes it that you can click the list to remove the entry from custom list in "Add to new custom list"',
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ],
                wipText: "Currently the script can only handle lists that dont have extra pages."
            }
        }
    };
    
    Object.keys(defaultSettings).forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(defaultSettings[key]));
        }
    });

    browser.runtime.openOptionsPage();
});




// Filter scripts allowed urls.
const filterScriptsAllowedUrls = [
    "https://www.anime-planet.com/manga/all",
    "https://www.anime-planet.com/anime/all",
    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)"
]

// injectedscripts is for making sure we dont multi inject to same page.
const injectedScripts = new Map();

async function executeContentScript(url, tabId) {
    try {
        const contentScripts = JSON.parse(localStorage.getItem('contentScripts'));

        if (!injectedScripts.has(tabId)) {
            injectedScripts.set(tabId, new Set());
        }

        const tabInjectedScripts = injectedScripts.get(tabId);


        const isFilterAllowed = isScriptTypeAllowed(url, filterScriptsAllowedUrls);


        for (const scriptName in contentScripts) {


            if (scriptName.startsWith('filter-')) {
                if (!isFilterAllowed) {
                    continue
                }
            }

            const script = contentScripts[scriptName];

            if (!tabInjectedScripts.has(scriptName) && script.enabled) {

                // url check 
                if (script.allowedUrls && script.allowedUrls.length > 0) {
                    const allowedUrls = script.allowedUrls;
                    if (!isScriptTypeAllowed(url, allowedUrls)) {
                        continue;
                    }
                }

                // script injection

                await browser.scripting.executeScript({
                    target: {
                        tabId: tabId,
                        allFrames: true,
                    },
                    files: [`contentScripts/${scriptName}`],
                });
                console.log(`Injected script: ${scriptName}`);
                tabInjectedScripts.add(scriptName); 
            }
        }

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
                const value = localStorage.getItem(message.requestType);
                sendResponse({ value });
            } else {
                console.warn('Missing requestType for getLocalStorageValue');
            }
            break;

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