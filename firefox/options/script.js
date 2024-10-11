

function createSwitchElement(enabled, scriptName) {
    const label = document.createElement("label");
    label.classList.add("switch");
  
    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    if (enabled) {
        input.setAttribute("checked", "checked");
    }
  
    const span = document.createElement("span");
    span.classList.add("slider");
  
    label.appendChild(input);
    label.appendChild(span);

    input.addEventListener("change", function() {
        localStorageData.contentScripts[scriptName].enabled = input.checked;
        localStorage.setItem('contentScripts', JSON.stringify(localStorageData.contentScripts));

    });
  
    return label;
}

const scriptsContainer = document.getElementById('scripts-container');
function createScriptsPage(contentScripts) {

    for (const scriptName in contentScripts) {

        const script = contentScripts[scriptName];

        const cardContainer = document.createElement('div');
        cardContainer.className = 'option-card';


        let category;
        if (scriptName.startsWith('filter-')) {
            category = 'filters';
        } else if (scriptName.startsWith('forum-')) {
            category = 'forums';
        } else if (scriptName.startsWith('helper-')) {
            category = 'helpers';
        } else {
            category = 'other';
        }

        // Set the category attribute
        cardContainer.setAttribute('data-category', category);

        /* Top part */
        const cardName = document.createElement('label');
        cardName.textContent = script.formattedName;

        const cardTop = document.createElement('div');

        cardTop.appendChild(cardName);

        // User is not meant to close them.
        if (!scriptName.startsWith('helper-')) {
            cardTop.appendChild(createSwitchElement(script.enabled, scriptName));
        }

        cardTop.classList.add('option-card-top');

        /* Middle */
        const cardDescription = document.createElement('p');
        cardDescription.textContent = script.description;


        cardContainer.appendChild(cardTop);
        cardContainer.appendChild(cardDescription);

        /* Bottom */

        if (scriptName.startsWith('wip/')) {
            const cardWip = document.createElement('button');
            cardWip.classList.add('card-wip');

            const cardWipText = document.createElement('p');

            cardWipText.textContent = script.wipText;
            cardWipText.classList.add('card-wip-tooltip');

            cardWip.appendChild(cardWipText);
            cardContainer.appendChild(cardWip);
        }


        if (script.changeableData) {
            const cardSettings = document.createElement('button');
            cardSettings.classList.add('card-settings');

            cardSettings.addEventListener("click", function() {
                document.getElementById("overlay-header-scriptname").textContent = script.formattedName;
                overlay.style.display = "flex";

                document.getElementById('overlay-content-dataName').textContent = script.changeableData;


                const textarea = document.getElementById('overlay-content-cards-textarea');

                const data = localStorageData[script.changeableData];

                if (Array.isArray(data)) {
                    textarea.setAttribute('dataType', 'array');
                    textarea.value = data.join('\n');
                } else if (typeof data === 'object') {
                    textarea.setAttribute('dataType', 'object');
                    textarea.value = JSON.stringify(data, null, 2);
                } else {
                    textarea.setAttribute('dataType', 'int');
                    textarea.value = data;
                }
            });

            cardContainer.appendChild(cardSettings);
        }

        scriptsContainer.appendChild(cardContainer);
    }
}

const localStorageData = {};

for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = JSON.parse(localStorage.getItem(key));
    localStorageData[key] = value;
}

createScriptsPage(localStorageData.contentScripts);


// Scripts page filter buttons.
document.getElementById('button-sidebar').addEventListener('click', function(event) {
    if (event.target.tagName === 'BUTTON') {

        const buttons = document.querySelectorAll('#button-sidebar button');
        buttons.forEach(button => {
            button.classList.remove('btn-active');
        });

        event.target.classList.add('btn-active');

        const category = event.target.textContent.toLowerCase();
        filterCards(category);
    }
});

function filterCards(category) {
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Overlay

const overlay = document.getElementById('overlay');
document.getElementById('overlay-close').addEventListener("click", function() {
    overlay.style.display = "none";

    const dataName = document.getElementById('overlay-content-dataName').textContent;
    const textarea = document.getElementById('overlay-content-cards-textarea');
    const dataType = textarea.getAttribute('dataType');
    const textareaContent = textarea.value;

    if (dataType === 'array') {
        const cardsArray = textareaContent.split('\n');
        localStorageData[dataName] = cardsArray;
        localStorage.setItem(dataName, JSON.stringify(localStorageData[dataName]));

    } else if (dataType === 'int') {
        const intValue = parseInt(textareaContent, 10);

        if (intValue > 0) {
            localStorageData[dataName] = intValue;
            localStorage.setItem(dataName, JSON.stringify(localStorageData[dataName]));
        }
    } else if (dataType === "object") {
        try {
            const jsonObject = JSON.parse(textareaContent);
            localStorageData[dataName] = jsonObject;
            localStorage.setItem(dataName, JSON.stringify(localStorageData[dataName]));
        } catch (e) {
            console.error("Invalid JSON data:", e);
        }
    }
});










// -------------------------------------------------------------------------

// export

document.getElementById('exportBtn').addEventListener("click", function() {
    exportSettings();
});

function exportSettings() {


    const blob = new Blob([JSON.stringify(localStorageData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = 'animeplanet-additions-export.json';
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
                if (localStorageData.hasOwnProperty(key)) {
                    localStorageData[key] = content[key];
                    localStorage.setItem(key, JSON.stringify(content[key]));
                }
            }
        }

        console.log("Settings imported successfully", localStorageData);
        alert("Settings imported successfully");
    } catch (err) {
        console.log("Encountered an error while trying to import settings", err);
        alert("Encountered an error while trying to import settings");
    }
}