
const browserType = typeof browser !== "undefined" ? "firefox" : "chrome";
var browser = browser || chrome;

/* Initilization */

// Priority 0: Tracking scripts
// Priority 1: Helper scripts without dependencies
// Priority 2: Helper scripts with helper dependencies
// Afterwards all priority is basically dependency with an dependency and repeat
// No priority: Last to be injected

browser.runtime.onInstalled.addListener(() => {
    const defaultSettings = {
        
        customTags: {},

        entries: {
            manga: {},
            anime: {}
        },

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
    
        contentScripts: {
            "helper/trackScripts.js": { 
                formattedName: "Track scripts",
                enabled: true,
                description: "Helper script to keep track of current scripts in the page.",
                mobile: true,
                desktop: true,
                priority: 0
            },
            "helper/browserSpecifics.js": { 
                formattedName: "Browser specifics",
                enabled: false,
                description: "Helper script to make content scripts work for chromium and firefox.",
                mobile: true,
                desktop: true,
                priority: 1
            },
            "other/scriptsLoaded.js": { 
                formattedName: "Scripts Loaded",
                enabled: false,
                description: "Adds an element to menu to show what scripts are loaded in current page. (excludes helper scripts)",
                mobile: true,
                desktop: true,
                priority: 4,
                dependencies: ['helper/browserSpecifics.js']
                
            },
            "helper/parseTooltips.js": { 
                formattedName: "Tooltip parse",
                enabled: false,
                description: "Helper script to parse tooltips from mangas/animes so we dont need to do expensive calls for each script.",
                mobile: true,
                desktop: true,
                priority: 3,
                dependencies: ['helper/PC-Mode.js']
            },
            "helper/filter-newTabEntries.js": {
                formattedName: "Easier filter tabs",
                enabled: false,
                description: "Helper script to add new filter methods.",
                mobile: true,
                desktop: true,
                priority: 1
            },
            "helper/interceptFetch.js": { 
                formattedName: "Intercept fetch",
                enabled: false,
                description: "Intercepts fetch calls that animeplanet makes. Currently used for custom lists. Dosen't work on chromium yet",
                mobile: true,
                desktop: true,
                chrome: false,
                priority: 1
            },
            "helper/updateEntryData.js": { 
                formattedName: "Update entry data",
                enabled: false,
                description: "Makes and updates the custom data needed for notes, custom titles and custom tags",
                mobile: true,
                desktop: true,
                priority: 2,
                dependencies: ['helper/browserSpecifics.js']
                
            },

            "helper/PC-Mode.js": {
                formattedName: "PC mode",
                enabled: false,
                description: "Modifies the user agent to be desktop for mobiles. Otherwise animeplanet does not send tooltips",
                allowedUrls: [],
                mobile: true,
                desktop: false,
                priority: 2,
            },

            "other/load-extrapages.js": {
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
                desktop: true,
                dependencies: ['helper/browserSpecifics.js', 'helper/parseTooltips.js']
            },
            "filter/applyBtn-AlwaysOn.js": {
                formattedName: "Apply button shown",
                enabled: false,
                description: "Makes the apply button on filters to be always shown.",
                mobile: true,
                desktop: true
            },
            "filter/quick-apply.js": {
                formattedName: "Quick apply",
                enabled: false,
                description: "New button to filter current mangas/animes in the page without loading next page.",
                mobile: true,
                desktop: true,
                dependencies: ['helper/parseTooltips.js']
            },
            "filter/tags-search.js": {
                formattedName: "Tags search",
                enabled: false,
                description: "Adds an search bar for tags.",
                mobile: true,
                desktop: true
            },
            "forum/clickableUsername.js": {
                formattedName: "Clickable usernames",
                enabled: false,
                description: "Makes usernames clickable in forum profile",
                allowedUrls: [
                    "https:\\/\\/www\\.anime-planet\\.com\\/forum\\/members\\/[^\\.]+\\.\\d+\\/"
                ],
                mobile: true,
                desktop: true
            },
            "filter/chapter.js": {
                formattedName: "Chapter filtering",
                enabled: false,
                description: "Adds chapter filtering in current page.",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/manga"
                ],
                mobile: true,
                desktop: true,
                dependencies: ['filter/quick-apply.js']
            },
            "filter/contains.js": {
                formattedName: "Contains filtering",
                enabled: false,
                description: "Filters entries that dont contain any of the tags defined in current page.",
                mobile: true,
                desktop: true,
                dependencies: ['filter/quick-apply.js']
            },
            "list/removeEntry.js": {
                formattedName: "List entry remover",
                enabled: false,
                description: 'Makes it that you can click the list to remove the entry from custom list in "Add to new custom list"',
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ],
                wip: true,
                mobile: true,
                desktop: true,
                chrome: false,
                dependencies: ['helper/interceptFetch.js']
            },
            "filter/autoFilter.js": { 
                formattedName: "Auto filters",
                enabled: false,
                description: "Adds filters automatically",
                changeableData: "autoFilters",
                mobile: true,
                desktop: true,
                dependencies: ['helper/browserSpecifics.js']
            },
            "entry/getMangaupdatesData.js": { 
                formattedName: "Extra manga data",
                enabled: false,
                description: "Adds an button to fetch mangaupdate's data and add it to the manga page.",
                allowedUrls: [
                    "^https:\/\/www\.anime-planet\.com\/manga\/[^\/]+$"
                ],
                mobile: true,
                desktop: true,
                dependencies: ['helper/browserSpecifics.js', 'helper/updateEntryData.js']           
            },
            "entry/add-EntryNotes.js": { 
                formattedName: "Notes",
                enabled: false,
                description: "Allows you to add notes to any manga/anime",
                mobile: true,
                desktop: true,
                dependencies: ['helper/browserSpecifics.js', 'helper/updateEntryData.js', 'helper/parseTooltips.js'] 
            },
            "entry/customTags.js": { 
                formattedName: "Custom tags",
                enabled: false,
                description: "Allows creating and adding of custom tags to entries",
                mobile: true,
                desktop: true,
                dependencies: ['helper/browserSpecifics.js', 'helper/updateEntryData.js', 'helper/parseTooltips.js']
            },
            "entry/stillLeft.js": { 
                formattedName: "Still left",
                enabled: false,
                description: "Shows episodes or chapters still left on entry.",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)"
                ],
                mobile: true,
                desktop: true,
                dependencies: ['helper/parseTooltips.js'] 
            },
            "filter/showFiltering.js": { 
                formattedName: "Shows filter options",
                enabled: false,
                description: "Shows filter options for screens that are smaller than 768px wide",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)"
                ],
                mobile: true,
                desktop: true
            },
            "list/multiselect.js": {
                formattedName: "List multiselect",
                enabled: false,
                description: 'Allows you to select multiple custom lists that you want to add the entry to',
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ],
                mobile: true,
                desktop: true,
                chrome: false,
                dependencies: ['helper/interceptFetch.js']
            },
            "entry/customTitleName.js": {
                formattedName: "Custom entry title",
                enabled: false,
                description: 'Allows you to set the title of an entry.',
                mobile: true,
                desktop: true,
                dependencies: ['helper/browserSpecifics.js', 'helper/updateEntryData.js', 'helper/parseTooltips.js'] 
            },
            "entry/cleanerAltTitles.js": {
                formattedName: "Cleaner alt titles",
                enabled: false,
                description: "Splits alt titles from commas into blocks",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ],
                mobile: true,
                desktop: true
            },
            "entry/characterGrid.js": {
                formattedName: "Character grid",
                enabled: false,
                description: "Makes character tab into an grid",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\/]+\/characters$"
                ],
                mobile: true,
                desktop: true
            },
            "other/sortRandom.js": {
                formattedName: "Sort by random",
                enabled: false,
                description: "Adds an random button on the dropdown menu of sorting",
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(?:manga|anime)"
                ],
                mobile: true,
                desktop: true
            },
            "entry/showHiddenTags.js": {
                formattedName: "Show hidden tags",
                enabled: false,
                description: 'Shows the content warning tags that are hidden in the overview page of an entry.',
                allowedUrls: [
                    "https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$"
                ],
                mobile: true,
                desktop: true,
            }
        }
    };

    function resetLocalStorage() {
        browser.storage.local.clear(() => {
            Object.keys(defaultSettings).forEach(key => {
                browser.storage.local.set({ [key]: defaultSettings[key] });
            });
        });
    }

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message === "resetLocalStorage") {
            resetLocalStorage();
            sendResponse(true);
        }
    });
    
    
    Object.keys(defaultSettings).forEach(key => {
        browser.storage.local.get([key], (result) => {
            let storedValue = result[key];
    
            if (!storedValue) {
                storedValue = defaultSettings[key];
            } else if (key === 'contentScripts') {
                storedValue = { ...defaultSettings.contentScripts, ...storedValue };
            }
    
            if (key === 'contentScripts') {
    
                Object.keys(storedValue).forEach(scriptKey => {
                    const script = storedValue[scriptKey];

                    const chromeSupport = browserType === "chrome" && script.chrome === false ? false : true;
                    if (!chromeSupport) {
                        script.enabled = false;
                    }
                });
            }
    
            browser.storage.local.set({ [key]: storedValue });
        });
    });

    browser.runtime.openOptionsPage();
});