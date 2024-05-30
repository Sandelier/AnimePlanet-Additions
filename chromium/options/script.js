


// Made the whole options page very hastly so gonna basically remake it someday.

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
        chrome.storage.local.set({'contentScripts': localStorageData.contentScripts});

    });
  
    return label;
}

const scriptsContainer = document.getElementById('scripts-container');
function createScriptsPage(contentScripts) {

    console.log(contentScripts);

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

let localStorageData = {};

chrome.storage.local.get(null, (items) => {
    localStorageData = items;

    createScriptsPage(localStorageData.contentScripts);
});


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
        chrome.storage.local.set({[dataName]: cardsArray});

    } else if (dataType === 'int') {
        const intValue = parseInt(textareaContent, 10);

        if (intValue > 0) {
            localStorageData[dataName] = intValue;
            console.log(localStorageData[dataName]);
            chrome.storage.local.set({[dataName]: intValue});

        }
    }
});