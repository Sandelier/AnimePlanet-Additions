


/* Initilization */
browser.runtime.onInstalled.addListener(() => {
    const defaultSettings = {
        pagesToSearch: 1,

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
                allowedUrls: []
            },
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
            "helper-interceptFetch.js": { 
                formattedName: "Intercept fetch",
                enabled: true,
                description: "Intercepts fetch calls that animeplanet makes. Currently used for custom lists",
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
            },
            "list-multiselect.js": {
                formattedName: "List multi select",
                enabled: false,
                description: 'Allows you to select multiple custom lists that you want to add the entry to',
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ]
            },
            "filter-autoFilter.js": { 
                formattedName: "Auto filters",
                enabled: false,
                description: "Adds filters automatically",
                allowedUrls: [],
                changeableData: "autoFilters"
            },
            "getMangaupdatesData.js": { 
                formattedName: "Extra manga data",
                enabled: false,
                description: "Adds an button to fetch mangaupdate's data and add it to the manga page.",
                allowedUrls: [
                    "https://www.anime-planet.com/manga/"
                ]
            },
            "add-EntryNotes.js": { 
                formattedName: "Notes",
                enabled: false,
                description: "Allows you to add notes to any manga/anime",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ]
            }
        }
    };

    function resetLocalStorage() {
        Object.keys(defaultSettings).forEach(key => {
          localStorage.setItem(key, JSON.stringify(defaultSettings[key]));
        });
    }
    
    window.resetLocalStorage = resetLocalStorage;
    
    
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


        // If injected scripts is empty it might mean that background script has went idle so we have to ask the trackscripts helper if there are content scripts in the page
        if (!injectedScripts.has(tabId)) {
            try {
                const response = await browser.tabs.sendMessage(tabId, { action: 'getInjectedScripts'})
                if (response && response.scripts) {
                    injectedScripts.set(tabId, new Set(response.scripts));
                    console.log(injectedScripts.get(tabId));
                }
            } catch (error) {
                console.error('Error retrieving injected scripts.', error);
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
        case 'setLocalStorageValue':
            // We can add some error handling to this later like maybe sending an response back if it was successful or not so we can tell the user.
            if (message.requestType && message.value) {
                localStorage.setItem(message.requestType, JSON.stringify(message.value));
            } else {
                console.warn('Missing requestType for setLocalStorageValue');
            }
            break;
        case 'getMangaInfo':
            if (message.mangaName) {
                (async () => {
                    try {
                        const mangaInfo = await getMangaInfo(message.mangaName);
                        sendResponse({ mangaInfo });
                    } catch (error) {
                        console.error('Error fetching manga info:', error);
                        sendResponse({ error: 'Failed to fetch manga info' });
                    }
                })();
            } else {
                console.warn('Missing manga name for getMangaInfo');
            }

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









// Mangaupdates api calls. Used for "getAllNames.js"
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