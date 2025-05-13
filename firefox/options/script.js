
const browserType = typeof browser !== "undefined" ? "firefox" : "chrome";
var browser = browser || chrome;

async function requestPermissions(permissions, origins = []) {
    try {
        const granted = await browser.permissions.request({ permissions, origins });
        if (!granted) {
            alert("Permissions are required to enable this feature.");
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error requesting permissions:", error);
        return false;
    }
}

function toggleScript(cardContainer, enabled, scriptName) {
    cardContainer.addEventListener("click", async function(event) {

        if (event.target.classList.contains("card-settings")) return;

        const currentState = cardContainer.dataset.enabled === "true";
        const newState = !currentState;

        cardContainer.dataset.enabled = newState.toString();
        
        if (scriptName === "entry/getMangaupdatesData.js" && newState) {
            const permissions = browserType === "chrome" ? [] : ['webRequest', 'webRequestBlocking'];
            const granted = await requestPermissions(permissions, ['https://api.mangaupdates.com/*']);
            if (!granted) return;
        }
        
        const dependencies = getAllDependencies(scriptName);
        
        if (isMobile() && dependencies.includes("helper/PC-Mode.js")) {

            if (browserType === "firefox") {
                const granted = await requestPermissions(['webRequest', 'webRequestBlocking']);
                if (!granted) return;
            }
            
            browser.runtime.sendMessage({
                action: 'PCMode',
                value: newState
            });
        }
        

        localStorageData.contentScripts[scriptName].enabled = newState;
        browser.storage.local.set({ 'contentScripts': localStorageData.contentScripts });

        cardContainer.classList.toggle('option-card-enabled', newState);

        console.log(`${scriptName} is now ${newState ? 'enabled' : 'disabled'}`);
    });

    cardContainer.dataset.enabled = enabled.toString();
    cardContainer.classList.toggle('option-card-enabled', enabled);
}

// Travels through all dependencies of an script and returns the names of the script
function getAllDependencies(scriptName) {
    const dependencies = new Set();

    function collectDeps(name) {

        if (!localStorageData.contentScripts[name].dependencies) {
            return;
        }

        for (const dep of localStorageData.contentScripts[name].dependencies) {
            if (!dependencies.has(dep)) {
                dependencies.add(dep);
                collectDeps(dep);
            }
        }
    }

    collectDeps(scriptName);
    return Array.from(dependencies);
}



const scriptsContainer = document.getElementById('scripts-container');
function createScriptsPage(contentScripts) {

    const abcOrder = Object.keys(contentScripts).sort();
    const reorderedScripts = [
        ...abcOrder.filter(scriptName => !scriptName.startsWith("helper")),
        ...abcOrder.filter(scriptName => scriptName.startsWith("helper"))
    ];

    for (const scriptName of reorderedScripts) {

        const script = contentScripts[scriptName];

        const cardContainer = document.createElement('div');
        cardContainer.className = 'option-card';

        const category = scriptName.split('/')[0];

        // Set the category attribute
        cardContainer.setAttribute('data-category', category);

        /* Top part */
        const cardName = document.createElement('label');
        cardName.textContent = script.formattedName;


        if (!script.mobile || !script.desktop) {
            cardContainer.classList.add('notSupported');
            if (script.mobile) {
                cardName.textContent += " 📱";
                if (isMobile()) {
                    cardContainer.classList.remove('notSupported');
                }
            }
            
            if (script.desktop) {
                cardName.textContent += " 🖥️";
                if (!isMobile()) {
                    cardContainer.classList.remove('notSupported');
                }
            }
        }

        // Some scripts currently dont work in chrome
        const chromeSupport = browserType === "chrome" && script.chrome === false ? false : true;

        if (chromeSupport === false) {
            cardName.textContent += " Only firefox";
            cardContainer.classList.add('notSupported');
            
        } else if (script.wip) {
            cardContainer.classList.add('featureWIP')
        }

        const cardTop = document.createElement('div');

        cardTop.appendChild(cardName);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('option-card-buttonContainer');

        // User is not meant to close them.
        if (!cardContainer.classList.contains('notSupported')) {
            if (!scriptName.startsWith('helper/')) {
                toggleScript(cardContainer, script.enabled, scriptName);
            } else {
                cardContainer.classList.toggle('option-card-enabled');
                cardContainer.style.setProperty('background-color', '#a1f2fb', 'important');
                cardContainer.style.setProperty('cursor', 'default', 'important');
            }
        }

        cardTop.appendChild(buttonsContainer);

        cardTop.classList.add('option-card-top');

        cardContainer.appendChild(cardTop);


        // Card settings
        if (script.changeableData) {
            const cardSettings = document.createElement('button');
            cardSettings.classList.add('card-settings');

            cardSettings.addEventListener("click", function() {
                document.getElementById('featuresEditPage').scrollIntoView({ behavior: 'smooth' });

                let data = localStorageData[script.changeableData];
                const jsonEditor = document.getElementById('featuresEditor');

                if (typeof data !== "object") {
                    jsonEditor.dataset.key = "";
                    setJsonEditor({ [script.changeableData]: data });
                } else {
                    jsonEditor.dataset.key = [script.changeableData];
                    setJsonEditor(data);
                }
            });

            buttonsContainer.insertBefore(cardSettings, buttonsContainer.firstChild);
        }


        // Card tooltip
        const cardTooltip = document.getElementById('card-tooltip');

        cardContainer.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.option-card');
        
            if (card) {
                const isChild = e.target.closest('.option-card-buttonContainer');
                if (isChild) {
                    cardTooltip.style.visibility = 'hidden';
                    return;
                }
        
                const tooltipText = script.description;
                cardTooltip.textContent = tooltipText;
        
                const tooltipHeight = cardTooltip.offsetHeight;
                const tooltipWidth = cardTooltip.offsetWidth;
        
                let leftPosition = e.pageX;
        
                if (leftPosition + tooltipWidth > window.innerWidth) {
                    leftPosition = e.pageX - tooltipWidth; 
                }
        
                if (leftPosition < 0) {
                    leftPosition = e.pageX;
                }
        
                cardTooltip.style.left = leftPosition + 'px';
                cardTooltip.style.top = (e.pageY - tooltipHeight) + 'px';
                cardTooltip.style.visibility = 'visible';
            } else {
                cardTooltip.style.visibility = 'hidden';
            }
        });

        cardContainer.addEventListener('mouseleave', () => {
            cardTooltip.style.visibility = 'hidden';
        });



        scriptsContainer.appendChild(cardContainer);
    }
}

let localStorageData = {};

browser.storage.local.get(null, (result) => {
    localStorageData = result;

    createScriptsPage(localStorageData.contentScripts);
});










// -------------------------------------------------------------------------

// export

document.getElementById('exportBtn').addEventListener("click", function() {
    exportSettings();
});

function exportSettings() {
    const exportData = { ...localStorageData };
  
    delete exportData["stats-manga"];
    delete exportData["stats-anime"];

    const modifiedContentScripts = {};
    for (const script in exportData.contentScripts) {
        if (exportData.contentScripts.hasOwnProperty(script)) {
            modifiedContentScripts[script] = { enabled: exportData.contentScripts[script].enabled };
        }
    }
    exportData.contentScripts = modifiedContentScripts;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = "animeplanet-additions-export.json";
    link.href = url;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// import

document.getElementById('importBtn').addEventListener("click", function() {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener("change", function(event) {
    const file = event.target.files[0]; 

    if (file && file.type === "application/json") {
        const reader = new FileReader();

        reader.onload = function(e) {
            const content = e.target.result;
            try {
                importSettings(JSON.parse(content));
            } catch (err) {
                console.error("Error parsing JSON:", err);
            }
        };

        reader.readAsText(file);
    } else {
        console.error("Please select a valid JSON file.");
        alert("Please select a valid JSON file.");
    }
});

function importSettings(content) {
    try {
      for (let key in content) {
        if (content.hasOwnProperty(key)) {
            if (key === "contentScripts" && localStorageData.hasOwnProperty("contentScripts")) {
                browser.storage.local.get(["contentScripts"], (result) => {
                    for (let script in content.contentScripts) {
                        if (content.contentScripts.hasOwnProperty(script) && localStorageData.contentScripts.hasOwnProperty(script)) {
                            localStorageData.contentScripts[script].enabled = content.contentScripts[script].enabled;
                        }
                    }
                    browser.storage.local.set({ "contentScripts": localStorageData.contentScripts });
                });
            } else if (localStorageData.hasOwnProperty(key)) {
                localStorageData[key] = content[key];
                browser.storage.local.set({ [key]: content[key] });
            }
        }
      }
  
      console.log("Settings imported successfully", localStorageData);
      alert("Settings imported successfully");
      location.reload();
    } catch (err) {
      console.log("Encountered an error while trying to import settings", err);
      alert("Encountered an error while trying to import settings");
    }
}

// Reset localstorage

document.getElementById('resetBtn').addEventListener("click", async function() {

    if (!confirm("Are you sure you want to reset the settings?")) return;
    let reseted = await resetLocalStorage();

    if (reseted) {
        location.reload();
    } else {
        alert("Was unable to reset settings.")
    }
});

async function resetLocalStorage() {
    try {
        let response = await browser.runtime.sendMessage("resetLocalStorage");
        return response === true;
    } catch (error) {
        console.error("Error resetting local storage:", error);
        return false;
    }
}