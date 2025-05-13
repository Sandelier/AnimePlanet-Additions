
var browser = browser || chrome;

import { changeToPcMode, pcModeState } from "../PC-mode/toPc.js";


async function executeContentScript(url, tabId) {

    if (!doneScraping) {

        if (url.startsWith('https://www.anime-planet.com/search.php?')) {

            browser.runtime.sendMessage({ action: "unknownUsername"});

            doneScraping = true;

            if (pageOpenedId) {
                if (isMobile()) {
                    browser.tabs.remove(pageOpenedId);
                } else {
                    browser.windows.remove(pageOpenedId)
                }
                pageOpenedId = "";
            }
            changeToPcMode(PCModeOrginalState);
            return;
        }

        try {
            await browser.scripting.executeScript({
                target: {
                    tabId: tabId,
                    allFrames: true,
                },
                files: ['./moduleScripts/StatsScraper/scrapeData.js'],
            });
        } catch (error) {
            console.error("Failed to inject content script:", error);
        }
    }
} 

function checkTabUrl(url, tabId) {
    if (url.startsWith('https://www.anime-planet.com/') && pageOpenedId) {
        executeContentScript(url, tabId);
    }
}

browser.webNavigation.onCommitted.addListener((details) => {
    if (details.url.startsWith('https://www.anime-planet.com')) {
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



let scrapedData = [];
let doneScraping = false;
let pageOpenedId;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message, scrapedData);
    if (message.action === "sendData") {
        scrapedData.push(...message.data);
        sendResponse({ action: "nextPage"});
        
    } else if (message.action === "stop") {
        console.log("Final page reached");
        doneScraping = true;

        if (pageOpenedId) {

            if (isMobile()) {
                browser.tabs.remove(pageOpenedId);
            } else {
                browser.windows.remove(pageOpenedId)
            }
            pageOpenedId = "";
        }
        changeToPcMode(PCModeOrginalState);
        console.log("sending scrapeddata");
        browser.runtime.sendMessage({ action: "scrapedData", data: processData(scrapedData)});
        
    }
    
    return true;
});

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

let PCModeOrginalState = false;
export function startScraping(value) {
    doneScraping = false;
    scrapedData = [];

    //different logic for mobile since well you cant open popups or like detached panels for phones
    if (isMobile()) {

        PCModeOrginalState = pcModeState();
        (async () => {
            try {
                changeToPcMode(true);
            } catch (error) {
                console.error('Error loading scraper module:', error);
            }
        })();

        browser.tabs.create({
            url: `https://www.anime-planet.com/users/${value.username}/${value.dataType}?per_page=560&dontInjectScripts`
        })
        .then((tab) => {
            pageOpenedId = tab.id;
        })
        .catch((error) => {
            console.error(`Error opening tab: ${error}`);
        });
    } else {
        browser.windows.create({
            url: `https://www.anime-planet.com/users/${value.username}/${value.dataType}?per_page=560&dontInjectScripts`,
            type: "popup",
            width: 800,
            height: 600
        })
        .then((window) => {
            pageOpenedId = window.id;
        })
        .catch((error) => {
            console.error(`Error creating window: ${error}`);
        });
    }
}






// Makes the data easily readable.

function processData(jsonData) {
	try {
		let chapterCount = 0;
		let volumeCount = 0;
		const totalEntries = jsonData.length;
		let tagCounts = {};
		let yearCounts = {};
		let serializerCount = {};
		let statusCounts = {};
		let sources = {};
		let accountJoinDate;
		let dataType;
        let username;
        let userImg;

		let timeTaken = 0;

		let types = {
			"Light Novels": 0,
			"Web Novels": 0,
			"Manhua": 0,
			"Manhwa": 0,
			"Manga": 0,
			"Chinese Novels": 0,
			"Korean Novels": 0,
			"Novels": 0
		};

		jsonData.forEach(entry => {
            try {
                if (entry.joinedDate) {
                    accountJoinDate = parseDate(entry.joinedDate);
                    dataType = entry.dataType;
                    username = entry.username;
                    userImg = entry.userImg;
    
                    if (dataType === "anime") {
                        types = {};
                    }
    
                    return;
                }
    
                // Chapters
                if (entry.isChapter === true) {
                    chapterCount += parseInt(entry.installment);
                } else {
                    volumeCount += parseInt(entry.installment);
                }
    
                // Tags
                const tags = entry.tags;
    
                let isBasedOnSomething = false;
                let isTypeFound = false;
    
                tags.forEach(tag => {
                    if (!tagCounts[tag]) {
                        tagCounts[tag] = {
                            installment: 0,
                            count: 0
                        };
                    }
    
                    tagCounts[tag].installment += parseInt(entry.installment);
                    tagCounts[tag].count++;
    
                    // Sources
                    if (tag.startsWith("Based on a")) {
                        isBasedOnSomething = true;
                        const cleanTag = tag.replace("Based on a", "").trim();
                        if (!sources[cleanTag]) {
                            sources[cleanTag] = 0;
                        }
                        sources[cleanTag]++;
    
                        delete tagCounts[tag];
                    }
    
                    // Types
                    if (dataType === "manga" && tag in types) {
                        types[tag]++;
                        isTypeFound = true;
    
                        delete tagCounts[tag];
                    }
                });
    
                // If not based on something, count it as original
                if (!isBasedOnSomething) {
                    if (!sources["Original"]) {
                        sources["Original"] = 0;
                    }
                    sources["Original"]++;
                }
    
                // If no type found, count it as manga
                if (!isTypeFound && dataType === "manga") {
                    types["Manga"]++;
                }
    
                // Year
                const year = entry.year;
                if (year) {
                    if (!yearCounts[year]) {
                        yearCounts[year] = 0;
                    }
                    yearCounts[year]++;
                }
    
                // Serializer
                const serializer = entry.serializer;
                if (serializer) {
                    if (!serializerCount[serializer]) {
                        serializerCount[serializer] = 0;
                    }
                    serializerCount[serializer]++;
                }
    
                // Status
                const status = entry.status;
                if (status) {
                    if (!statusCounts[status]) {
                        statusCounts[status] = 0;
                    }
                    statusCounts[status]++;
                }
    
                // Anime type
                const type = entry.type;
                if (type) {
                    if (!types[type]) {
                        types[type] = 0;
                    }
                    types[type]++;
                }
            } catch (error) {
                console.log(error);
            }

		});

		// Tag, year, and serializer rearrangement
		const tagCountsArray = Object.entries(tagCounts).map(([tag, data]) => ({
			tag,
			installment: data.installment,
			occurrences: data.count
		}));
		tagCountsArray.sort((a, b) => b.occurrences - a.occurrences);

		const yearCountsArray = processCounts(yearCounts);
		const serializerCountsArray = processCounts(serializerCount);
		const typesCountArray = processCounts(types);

		const statusPercentages = calculateCountsAndPercentages(statusCounts, totalEntries, "status");
		const sourcePercentages = calculateCountsAndPercentages(sources, totalEntries, "source");

		// Average chapters per day
		const currentDate = new Date();
		const daysElapsed = differenceInDays(accountJoinDate, currentDate);
		const averageChaptersPerDay = (chapterCount / daysElapsed).toFixed(2);

		if (dataType === "manga") {
			// Time taken to read (assume 1.2 minutes per chapter)
			const minutesPerChapter = 1.2;
			const timeTakenForChapters = chapterCount * minutesPerChapter;
			timeTaken = timeTakenForChapters;
		}

		const statsData = {
            username: username,
            userImg: userImg,
			totalEntries: totalEntries,
			chapterCount: chapterCount,
			volumeCount: volumeCount,
			dataType: dataType,
			tags: tagCountsArray,
			years: yearCountsArray,
			serializers: serializerCountsArray,
			types: typesCountArray,
			statuses: statusPercentages,
			sources: sourcePercentages,
			averageChaptersPerDay: averageChaptersPerDay,
			timeTaken: {
				minutes: timeTaken
			},
            dataDate: currentDate 
		};

		return statsData;

	} catch (error) {
		console.error('Error processing data:', error);
	}
}

function processCounts(counts) {
	return Object.entries(counts)
		.map(([key, value]) => ({
			[key]: value
		}))
		.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]);
}

function calculateCountsAndPercentages(data, totalObjects, name) {
	const limit = 7;

	const keys = Object.keys(data);
	const sortedKeys = keys.sort((a, b) => data[b] - data[a]);

	const sortedData = [];
	let otherData = {};

	sortedKeys.forEach((key, index) => {
		if (index < limit) {
			const count = data[key];
			const percentage = (count / totalObjects) * 100;
			sortedData.push({
				[name]: key,
				count,
				percentage: percentage.toFixed(2)
			});
		} else {
			otherData[key] = data[key];
		}
	});

	const otherKeys = Object.keys(otherData).sort((a, b) => otherData[b] - otherData[a]);

	let otherCount = 0;
	otherKeys.forEach(key => {
		otherCount += otherData[key];
	});

	if (otherCount > 0) {
		sortedData.push({
			[name]: "Other",
			count: otherCount,
			percentage: ((otherCount / totalObjects) * 100).toFixed(2)
		});
	}

	sortedData.sort((a, b) => b.count - a.count);

	return sortedData;
}

function differenceInDays(date1, date2) {
	const diffInTime = date2.getTime() - date1.getTime();
	const diffInDays = diffInTime / (1000 * 3600 * 24);
	return Math.round(diffInDays);
}

function parseDate(dateString) {
	const monthAbbreviations = [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
	];

	const parts = dateString.split(' ');
	const month = parts[0];
	const day = parseInt(parts[1].replace(',', ''));
	const year = parseInt(parts[2]);
	return new Date(year, monthAbbreviations.indexOf(month), day);
}