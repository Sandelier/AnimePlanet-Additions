
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
                    tabId: tabId
                },
                files: ['./moduleScripts/StatsScraper/scrapeData.js'],
            });
        } catch (error) {
            console.error("Failed to inject content script:", error);
        }
    }
} 


browser.webNavigation.onCommitted.addListener((details) => {
    if (details.url.startsWith('https://www.anime-planet.com')) {
        executeContentScript(details.url, details.tabId);
    }
});


let scrapedData = [];
let doneScraping = false;
let pageOpenedId;

let backupFetchPromise = null;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message, scrapedData);
    if (message.action === "userToken") {

        backupFetchPromise = fetch(`https://www.anime-planet.com/api/export/${message.type}/${message.token}?`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .catch(error => {
                console.error('Backup Fetch error', error);
                return null;
            });


    } else if (message.action === "sendData") {
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

        function continueProcessing(backupData) {
            processData(scrapedData, backupData || undefined);
            backupFetchPromise = null;
        };

        if (backupFetchPromise) {
            backupFetchPromise.then(data => continueProcessing(data));
        } else {
            continueProcessing();
        }
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

function processData(jsonData, backupData = null) {
	try {

        // Making the backup lookup faster so we dont need to loop through the entire backupdata everytime in jsondata
        if (backupData?.entries) {
            const tempObject = {};
            backupData.entries.forEach(entry => {
              const { name, ...rest } = entry;
              tempObject[name] = rest;
            });

            backupData.entries = tempObject;
        }

		let chapterCount = 0;
		let volumeCount = 0;
		let totalEntries = 0;
		let tagCounts = {};
		let yearCounts = {};
		let serializerCount = {};
		let statusCounts = {};
		let sources = {};
        let ratings = {
            user: {},
            userbase: {}
        };
		let accountJoinDate = null;
		let dataType;
        let username;
        let userImg;

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

        // default time calc
        let timeCalcMap = {
            "anime": {
                "Music Video": 3,
                "Movie": 90,
                "Other": 24
            },
            "manga": {
                "Manhwa": 2,
                "Manga": 3,
                "Manhua": 2,
                "Novel Ch": 3,
                "Other": 60
            }
        };

        browser.storage.local.get("timeCalcMap")
            .then((result) => {
              timeCalcMap = result.timeCalcMap || timeCalcMap;
            })
            .catch((error) => {
              console.error("Error retrieving timeCalcMap:", error);
            })
            .finally(() => {
                let cleanedBackupData = {};
                let firstUpdateDate = null;
                let noNDInstallments = null;

                let totalTime = 0;

                console.log(jsonData);

	            jsonData.forEach(entry => {
                    try {
                        if (entry.joinedDate) {
                            if (accountJoinDate === null) { // each part of of scraped data has its own joineddate
                                accountJoinDate = parseDate(entry.joinedDate);
                                dataType = entry.dataType;
                                username = entry.username;
                                userImg = entry.userImg;
    
                                if (dataType === "anime") {
                                    types = {};
                                }
                            }
                            return;
                        }

                        totalEntries++;

                        // Time calculation
                        if (entry.type == undefined && dataType == "manga") {
                            entry.type = "Manga";
                            for (let tag of entry.tags) {
                              if (types.hasOwnProperty(tag)) {
                                entry.type = tag;
                                break;
                              }
                            }
                        }

                        const typeTimeMap = timeCalcMap[dataType];
                        let minutesPerUnit;
                        if (dataType === "manga" && entry.type.includes("Novel") && entry.isChapter) {
                            // Since sometimes novels dont have volumes in ap or user has only updated chapters and not volumes
                            minutesPerUnit = typeTimeMap["Novel Ch"];
                        } else {
                            minutesPerUnit = typeTimeMap[entry.type] ?? typeTimeMap["Other"];
                        }
                        const thisEntryTime = minutesPerUnit * entry.installment / 60;
                        totalTime += thisEntryTime;


                        // Backup 
                        const matchingBackup = backupData?.entries?.[entry.entryName] ?? null;

                        if (matchingBackup) {
                            const count = matchingBackup.eps ?? matchingBackup.ch;

                            if (matchingBackup.started && typeof count === "number") {
                                const date = new Date(matchingBackup.completed ?? matchingBackup.started);

                                if (!firstUpdateDate || date < firstUpdateDate) {
                                    firstUpdateDate = date;
                                }

                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');

                                if (!cleanedBackupData[year]) {
                                    cleanedBackupData[year] = {};
                                }

                                if (!cleanedBackupData[year][month]) {
                                    cleanedBackupData[year][month] = { installments: 0, entries: 0, time: 0 };
                                }

                                cleanedBackupData[year][month].entries += 1;
                                cleanedBackupData[year][month].time += thisEntryTime;

                                if (dataType === "manga" && entry.type.includes("Novel") && !entry.isChapter) {
                                    if (!cleanedBackupData[year][month].hasOwnProperty("volumeCount")) {
                                        cleanedBackupData[year][month].volumeCount = 0;
                                    }

                                    cleanedBackupData[year][month].volumeCount += parseInt(entry.installment);
                                } else {
                                    cleanedBackupData[year][month].installments += parseInt(entry.installment);
                                    noNDInstallments += entry.installments;
                                }

                            } else {
                                if (!cleanedBackupData["ND"]) {
                                    cleanedBackupData["ND"] = { entries: 0, installments: 0, time: 0 };
                                }
                                cleanedBackupData["ND"].entries += 1;

                                if (typeof count === "number") {
                                    cleanedBackupData["ND"].time += thisEntryTime;

                                    if (dataType === "manga" && entry.type.includes("Novel") && !entry.isChapter) {
                                        if (!cleanedBackupData["ND"].hasOwnProperty("volumeCount")) {
                                            cleanedBackupData["ND"].volumeCount = 0;
                                        }

                                        cleanedBackupData["ND"].volumeCount += parseInt(entry.installment);
                                    } else {
                                        cleanedBackupData["ND"].installments += parseInt(entry.installment);
                                    }
                                }
                            }
                        }

                        // Rating

                        function roundToHalf(num) { // since user ratings are by like 4.5 and etc instead of 4.3
                            return Math.round(num * 2) / 2;
                        }

                        function cleanLabel(num) {
                            const str = num.toFixed(1);
                            return str.endsWith('.0') ? str.slice(0, -2) : str;
                        }

                        if (entry.userRating && entry.rating) {
                            const roundedUser = cleanLabel(roundToHalf(parseFloat(entry.userRating)));
                            const roundedBase = cleanLabel(roundToHalf(parseFloat(entry.rating)));

                            ratings.user[roundedUser] = (ratings.user[roundedUser] || 0) + 1;
                            ratings.userbase[roundedBase] = (ratings.userbase[roundedBase] || 0) + 1;
                        }

                        // Chapters
                        if (entry.isChapter === true) {
                            chapterCount += parseInt(entry.installment);
                        } else if (entry.type.includes("Novel")) {
                            volumeCount += parseInt(entry.installment);
                        }


                        let isBasedOnSomething = false;
                        let isTypeFound = false;


                        // Tags
                        if (entry.tags) {
                            const tags = entry.tags;
                            tags.forEach(tag => {
                                if (!tagCounts[tag]) {
                                    tagCounts[tag] = {
                                        installment: 0,
                                        count: 0,
                                        time: 0
                                    };
                                }

                                tagCounts[tag].count++;
                                tagCounts[tag].time += thisEntryTime;

                                if (dataType === "manga" && entry.type.includes("Novel") && !entry.isChapter) {
                                    if (!tagCounts[tag].hasOwnProperty("volumeCount")) {
                                        tagCounts[tag].volumeCount = 0;
                                    }

                                    tagCounts[tag].volumeCount += parseInt(entry.installment);
                                } else {
                                    tagCounts[tag].installment += parseInt(entry.installment);
                                }

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
                        }

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
                                yearCounts[year] = {
                                    year: year,
                                    installment: 0,
                                    count: 0,
                                    time: 0
                                };
                            }

                            if (dataType === "manga" && entry.type.includes("Novel") && !entry.isChapter) {
                                if (!yearCounts[year].hasOwnProperty("volumeCount")) {
                                    yearCounts[year].volumeCount = 0;
                                }

                                yearCounts[year].volumeCount += parseInt(entry.installment);
                            } else {
                                yearCounts[year].installment += parseInt(entry.installment);
                            }

                            yearCounts[year].count++;
                            yearCounts[year].time += thisEntryTime;
                        }

                        // Serializer
                        const serializer = entry.serializer;
                        if (serializer) {
                            if (!serializerCount[serializer]) {
                                serializerCount[serializer] = {
                                    serializer: serializer,
                                    installment: 0,
                                    count: 0,
                                    time: 0
                                };
                            }
                            
                            if (dataType === "manga" && entry.type.includes("Novel") && !entry.isChapter) {
                                if (!serializerCount[serializer].hasOwnProperty("volumeCount")) {
                                    serializerCount[serializer].volumeCount = 0;
                                }

                                serializerCount[serializer].volumeCount += parseInt(entry.installment);
                            } else {
                                serializerCount[serializer].installment += parseInt(entry.installment);
                            }
                            
                            serializerCount[serializer].count++;
                            serializerCount[serializer].time += thisEntryTime;
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
                        if (type && dataType == "anime") {
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
                const tagCountsArray = processMany(tagCounts, "tag", dataType);
	            const yearCountsArray = processMany(yearCounts, "year", dataType);
	            const serializerCountsArray = processMany(serializerCount, "serializer", dataType);

	            const typesCountArray = processCounts(types);

	            const statusPercentages = calculateCountsAndPercentages(statusCounts, totalEntries, "status");
	            const sourcePercentages = calculateCountsAndPercentages(sources, totalEntries, "source");

                // Since we want only one decimal
                for (const yearOrND in cleanedBackupData) {
                    if (yearOrND === "ND") {
                        cleanedBackupData[yearOrND].time = Math.round(cleanedBackupData[yearOrND].time * 10) / 10;
                    } else {
                        const months = cleanedBackupData[yearOrND];
                        for (const month in months) {
                            months[month].time = Math.round(months[month].time * 10) / 10;
                        }
                    }
                }

	            // Average chapters per day
	            const currentDate = new Date();
	            const daysElapsed = firstUpdateDate ? differenceInDays(firstUpdateDate, currentDate) : differenceInDays(accountJoinDate, currentDate);

                const averageChaptersPerDay = noNDInstallments ? (noNDInstallments / daysElapsed).toFixed(2) : (chapterCount / daysElapsed).toFixed(2)

	            const statsData = {
                    username: username,
                    userImg: userImg,
                    totalTime: parseFloat(totalTime.toFixed(1)),
                    firstUpdateDate: firstUpdateDate,
                    accountJoinDate: accountJoinDate,
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
                    ratings: ratings,
                    dataDate: currentDate,
                    consumptionByMonth: cleanedBackupData
	            };

                browser.runtime.sendMessage({ action: "scrapedData", data: statsData });
            });
	} catch (error) {
		console.error('Error processing data:', error);
	}
}

function processMany(counts, keyName, dataType) {
	return Object.entries(counts)
		.map(([key, value]) => {
			const result = {
				[keyName]: key,
				[dataType === "anime" ? "Episodes" : "Chapters"]: value.installment,
				Entries: value.count,
				time: parseFloat(value.time.toFixed(1)),
			};

			if ("volumeCount" in value) {
				result.volumes = value.volumeCount;
			}

			return result;
		})
		.sort((a, b) => b.Entries - a.Entries);
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