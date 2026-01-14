
var browser = browser || chrome;

import { changeToPcMode, pcModeState } from "../PC-mode/toPc.js";
import { processData } from "./processScrapedData.js";


async function executeContentScript(url, tabId) {

    if (!doneScraping) {

        if (url.startsWith('https://www.anime-planet.com/search.php?')) {

            browser.runtime.sendMessage({ action: "unknownUsername"});

            doneScraping = true;
            rawDataSelected = false;

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

let scrapedData = [];
let doneScraping = false;
let pageOpenedId;

let backupFetchPromise = null;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action === "bootstrap" && message.scraper === true) {
        executeContentScript(message.value, sender.tab.id);

    } else if (message.action === "userToken") {
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
            processData(scrapedData, backupData || undefined, rawDataSelected || false);
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
let rawDataSelected = false;
export function startScraping(value) {
    doneScraping = false;
    scrapedData = [];
    rawDataSelected = false;

    rawDataSelected = value.rawDataSelected;

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