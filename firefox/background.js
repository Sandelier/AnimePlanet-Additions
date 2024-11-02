


/* Initilization */
browser.runtime.onInstalled.addListener(() => {
    const defaultSettings = {
        pagesToSearch: 1,

        customTitles: {},
        customTags: {},

        autoFilters: {
            "tags": {
              "Sexual Content": "-",
              "Mature Themes": "+",
              "Emotional Abuse": "-"
            },
            "other": ["Completed"],
            "mylist": ["Read", "Reading"]
        },

        notes: [],
    
        contentScripts: {
            "helper-trackScripts.js": { 
                formattedName: "Track scripts",
                enabled: true,
                description: "Helper script to keep track of current scripts in the page.",
                allowedUrls: [],
                mobile: true,
                desktop: true
            },
            "helper-browserSpecifics.js": { 
                formattedName: "Browser specifics",
                enabled: true,
                description: "Helper script to make content scripts work for chromium and firefox.",
                allowedUrls: [],
                mobile: true,
                desktop: true
            },
            "helper-parseTooltips.js": { 
                formattedName: "Tooltip parse",
                enabled: true,
                description: "Helper script to parse tooltips from mangas/animes so we dont need to do expensive calls for each script.",
                allowedUrls: [],
                mobile: false,
                desktop: true
            },
            "helper-filter-newTabEntries.js": {
                formattedName: "Easier filter tabs",
                enabled: true,
                description: "Helper script to add new filter methods.",
                allowedUrls: [],
                mobile: true,
                desktop: true
            },
            "helper-interceptFetch.js": { 
                formattedName: "Intercept fetch",
                enabled: true,
                description: "Intercepts fetch calls that animeplanet makes. Currently used for custom lists",
                allowedUrls: [],
                mobile: true,
                desktop: true
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
                changeableData: "pagesToSearch",
                mobile: true,
                desktop: true
            },
            "filter-applyBtn-AlwaysOn.js": {
                formattedName: "Apply button shown",
                enabled: false,
                description: "Makes the apply button on filters to be always shown.",
                mobile: true,
                desktop: true
            },
            "filter-quick-apply.js": {
                formattedName: "Quick apply",
                enabled: false,
                description: "New button to filter current mangas/animes in the page without loading next page.",
                mobile: false,
                desktop: true
            },
            "filter-tags-search.js": {
                formattedName: "Tags search",
                enabled: false,
                description: "Adds an search bar for tags.",
                mobile: true,
                desktop: true
            },
            "forum-clickableUsername.js": {
                formattedName: "Clickable usernames",
                enabled: false,
                description: "Makes usernames clickable in forum profile",
                allowedUrls: [
                    "https:\\/\\/www\\.anime-planet\\.com\\/forum\\/members\\/[^\\.]+\\.\\d+\\/"
                ],
                mobile: true,
                desktop: true
            },
            "filter-chapter.js": {
                formattedName: "Chapter filtering",
                enabled: false,
                description: "Adds chapter filtering in current page.",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/manga"
                ],
                mobile: false,
                desktop: true
            },
            "filter-contains.js": {
                formattedName: "Contains filtering",
                enabled: false,
                description: "Filters entries that dont contain any of the tags defined in current page.",
                mobile: false,
                desktop: true
            },
            "wip/list-removeEntry.js": {
                formattedName: "List entry remover",
                enabled: false,
                description: 'Makes it that you can click the list to remove the entry from custom list in "Add to new custom list"',
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ],
                wip: true,
                mobile: true,
                desktop: true
            },
            "filter-autoFilter.js": { 
                formattedName: "Auto filters",
                enabled: false,
                description: "Adds filters automatically",
                allowedUrls: [],
                changeableData: "autoFilters",
                mobile: true,
                desktop: true
            },
            "getMangaupdatesData.js": { 
                formattedName: "Extra manga data",
                enabled: false,
                description: "Adds an button to fetch mangaupdate's data and add it to the manga page.",
                allowedUrls: [
                    "https://www.anime-planet.com/manga/"
                ],
                mobile: true,
                wip: true,
                desktop: true
            },
            "add-EntryNotes.js": { 
                formattedName: "Notes",
                enabled: false,
                description: "Allows you to add notes to any manga/anime",
                allowedUrls: [],
                mobile: true,
                desktop: true
            },
            "customTags.js": { 
                formattedName: "Custom tags",
                enabled: false,
                description: "Allows creating and adding of custom tags to entries",
                allowedUrls: [],
                mobile: true,
                desktop: true
            },
            "stillLeft.js": { 
                formattedName: "Still left",
                enabled: false,
                description: "Shows episodes or chapters still left on entry.",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)\/(?:dropped|reading|watching|stalled)"
                ],
                mobile: false,
                desktop: true
            },
            "mobile/showFiltering.js": { 
                formattedName: "Shows filter options",
                enabled: false,
                description: "Shows filter options for screens that are smaller than 768px wide",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)"
                ],
                mobile: true,
                desktop: true
            },
            "list-multiselect.js": {
                formattedName: "List multiselect",
                enabled: false,
                description: 'Allows you to select multiple custom lists that you want to add the entry to',
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ],
                mobile: true,
                desktop: true
            },
            "customTitleName.js": {
                formattedName: "Custom entry title",
                enabled: false,
                description: 'Allows you to set the title of an entry. Press enter to toggle between custom and orginal title.',
                allowedUrls: [],
                mobile: true,
                desktop: true
            },
            "cleanerAltTitles.js": {
                formattedName: "Cleaner alt titles",
                enabled: false,
                description: "Splits alt titles from commas into blocks",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ],
                mobile: true,
                desktop: true
            },
        }
    };

    function resetLocalStorage() {
        Object.keys(defaultSettings).forEach(key => {
          localStorage.setItem(key, JSON.stringify(defaultSettings[key]));
        });
    }
    
    window.resetLocalStorage = resetLocalStorage;
    
    
    Object.keys(defaultSettings).forEach(key => {
        let storedValue = JSON.parse(localStorage.getItem(key));
        if (!storedValue) {
            localStorage.setItem(key, JSON.stringify(defaultSettings[key]));
        } else if (key === 'contentScripts') {
            const mergedScripts = { ...defaultSettings.contentScripts, ...storedValue };
            localStorage.setItem(key, JSON.stringify(mergedScripts));
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

    if (url.includes('dontInjectScripts')) {
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
                try {
                    await browser.scripting.executeScript({
                        target: {
                            tabId: tabId,
                            allFrames: true,
                        },
                        files: [`contentScripts/${scriptName}`],
                    });
                    console.log(`Injected script: ${scriptName}`);
                    tabInjectedScripts.add(scriptName); 
                } catch (error) {
                    console.error("Failed to inject content script:", error);
                }
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

let moduleLoaded = false;

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
        case 'setLocalStorageValue':
            // We can add some error handling to this later like maybe sending an response back if it was successful or not so we can tell the user.
            if (message.requestType && message.value) {
                localStorage.setItem(message.requestType, JSON.stringify(message.value));
            } else {
                console.warn('Missing requestType for setLocalStorageValue');
            }
            break;
        case 'getMangaInfo':
            if (message.value) {
                (async () => {
                    try {
                        const mangaInfo = await getMangaInfo(message.value);
                        sendResponse({ mangaInfo });
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

            if (!moduleLoaded) {
                import('./moduleScripts/StatsScraper/background.js')
                    .then((module) => {
                        moduleLoaded = true;
                        if (typeof module.main === 'function') {
                            module.main(message.value);
                        }
                    })
                    .catch((error) => console.error("Error loading extra script:", error));
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









// Mangaupdates api calls. Used for "getMangaupdatesData.js"
// The background script can call the api without worrying about cors unlike if you were to do it in content script.


// Search manga using id.
// We need to fetch again using the id we get from fetchmangabyname because the received data dosent contain like associations.
async function fetchMangaById(id) {
    const url = `https://api.mangaupdates.com/v1/series/${id}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  }

// Search manga using name.

async function fetchMangaByName(name) {
  const url = "https://api.mangaupdates.com/v1/series/search";
  const payload = {
    "search": name,
    "per_page": 2,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}




let lastCallTime = 0;

async function getMangaInfo(searchName) {
  const now = Date.now();
  
  // just an simple rate limit of 10s.
  if (now - lastCallTime < 10000) { 
    return JSON.stringify({ status: "rateLimit" });
  }
  
  lastCallTime = now;

  try {
    const searchData = await fetchMangaByName(searchName);

    if (!searchData) {
      console.log("Failed to fetch manga by name. Exiting...");
      return JSON.stringify({ status: "error" });
    }

    const firstMangaId = searchData.results[0]?.record.series_id;

    if (!firstMangaId) {
      console.log("No manga found with the given name.");
      return JSON.stringify({ status: "error" });
    }

    const mangaByIdData = await fetchMangaById(firstMangaId);

    console.log(mangaByIdData);

    return JSON.stringify({ status: "ok", data: mangaByIdData });

  } catch (error) {
    console.error('An error occurred:', error);
    return JSON.stringify({ status: "error" });
  }
}