



(function() {
    window.postMessage({ action: "injectedScript", name: "customTags.js" });
})();

const styleElement = document.createElement('style');

styleElement.textContent = `
    .customTagInEntry {
        color: #c6ff73;
        user-select: none;
    }

    .addCustomTagBtn {
        color: #ffe300;
        cursor: pointer;
        user-select: none;
    }

    .customTagsContainer {
        height: 100%;
        display: none;
        position: relative;
    }

    .customTagsContainer > .customTagsTitleContainer > h3 {
        flex: 1;
        text-align: center;
        margin: 0;
    }

    .customTagsContainer > .customTagsTitleContainer > button {
        position: absolute;
        right: 0;
        cursor: pointer;
        color: #FF6961;
        background-color: #2e2e2e;
    }
    
    .customTagsContainer > .customTagsTitleContainer {
        display: flex;
    }

    

    .customTagsContainer > .tagsList {
        width: 100%;
        height: 250px;
        overflow-y: scroll;
        overflow-x: hidden;
    }

    .customTagsContainer > .tagsList > li {
        display: inline-block;
        margin: 0 5px 5px 0;
        padding: 5px 9px;
        background: var(--color-tags-background);
        border-radius: var(--ap-border-radius);
        color: #6C9717;
        cursor: pointer;
        user-select: none;
    }

    .customTagSelected {
        color: #ff9f96 !important;
    }

    #createTagContainer {
        display: flex;
        position: absolute;
        bottom: 0;
        width: 100%;
    }

    #createTagContainer > input {
        flex: 2
    }

    #createTagContainer > button {
        flex: 1
    }

    .tag-tooltip-active > a {
        color: #6C9717 !important;
    }
`;

document.head.appendChild(styleElement);


// Might wanna add this to helper function since currently this and entrynotes uses this and maybe more in future
function getEntryInfo() {

    const formElement = document.querySelector('.md-3-5 > form');
    const dataId = formElement.getAttribute('data-id');
    const dataMode = formElement.getAttribute('data-mode');

    return { id: parseInt(dataId), type: dataMode};
}


function createCustomTag() {
    const addTagButton = document.getElementById('createTagBtn');
    addTagButton.addEventListener('click', function() {
        const newTagInput = document.getElementById('newTagInput');
        const newTag = newTagInput.value.trim();
        const tagList = document.querySelector('.tagsList');
        if (newTag) {
            const existingTags = tagList.querySelectorAll('li');
            let tagExists = false;
        
            existingTags.forEach(tagItem => {
                if (tagItem.textContent.toLowerCase() === newTag.toLowerCase()) {
                    tagExists = true;
                }
            });

        
            if (!tagExists) {
                const newTagItem = document.createElement('li');
                newTagItem.textContent = newTag;
                tagList.appendChild(newTagItem);

                handleCustomTagInLocal(newTag, "save", false)

                const tagsSection = document.querySelector("#entry > div > div > div > div.tags > ul");
                newTagItem.addEventListener("click", function() {
                    handleTagAction(newTagItem, tagsSection);
                });
            }
        
            newTagInput.value = '';
        }
    });
}

function handleCustomTagInLocal(tag, action, state) {
    const { id, type } = getEntryInfo();

    if (action === 'save') {
        if (customTags[tag] && customTags[tag][id]) {

            // its night so imma work on this later

            if (state === false) {
                delete customTags[tag][id];
            } else {
                customTags[tag][id].state = state;
            }

        } else {
            let name = document.querySelector('h1.long')?.textContent;
            if (!name) {
                name = document.querySelector('h1[itemprop="name"]').textContent;
            }
        
            const imageUrl = document.querySelector('div.mainEntry > img.screenshots').src;
        
            const newEntry = {
                type: type,
                state: state,
                entryInfo: {
                    name: name,
                    url: currentUrl,
                    imageUrl: imageUrl
                }
            };
        
            if (!customTags[tag]) {
                customTags[tag] = {};
            }
        
            customTags[tag][id] = newEntry;
        }

        console.log("Tag saved or updated:", customTags);

    } else if (action === 'remove') {
        if (customTags[tag]) {
            delete customTags[tag];
        }
    }

    (async () => {
        try {
            const response = await requestFromLocal('setLocalStorageValue', 'customTags', customTags);
            if (response && response.value) {
                console.log("Local storage updated successfully.");

            } else {
                console.log('ailed to update local storage');
            }
        } catch (error) {
            console.error("Error occurred while updating local storage:", error);
        }
    })();
}


const currentUrl = window.location.href;
const urlRegex = /https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$/;
let deleteTagLock = false;
if (urlRegex.test(currentUrl)) {

    // Showing the user stats again when clicking anywhere else when you have clicked customtags

    const userStatsSection = document.querySelector("#entry > div.md-1-3");
    let addCustomTagBtn;
    let addCustomTagContainer;

    document.addEventListener('click', function(event) {
        if (event.target != addCustomTagBtn && !event.target.closest('.customTagsContainer')) {
            Array.from(userStatsSection.children).forEach(child => {
                if (!child.classList.contains('customTagsContainer')) {
                    child.style.display = "block";
                } else {
                    child.style.display = "none";
                }
            });
        }
    });

    function main() {

        // Adds plus sign button to tags section
        const tagsSection = document.querySelector('#entry > div > div > div > div.tags > ul');
        addCustomTagBtn = document.createElement('li');
        addCustomTagBtn.classList.add('addCustomTagBtn');
        addCustomTagBtn.textContent = "+";

        addCustomTagBtn.addEventListener("click", function() {
            Array.from(userStatsSection.children).forEach(child => {
                if (!child.classList.contains('customTagsContainer')) {
                    child.style.display = "none"; 
                } else {
                    child.style.display = "block";
                }
            });
        });

        tagsSection.appendChild(addCustomTagBtn);
        

        //

        addCustomTagContainer = document.createElement('div');
        addCustomTagContainer.classList.add('customTagsContainer');

        const customTagContent = `
            <div class="customTagsTitleContainer">
                <h3>Custom Tags</h3>
                <button id="deleteTagBtn">🗑</button>
            </div>
            
            <ul class="tagsList">

            </ul>

            <div id="createTagContainer">
                <input type="text" placeholder="Create tag" id="newTagInput">
                <button id="createTagBtn">Create tag</button>
            </div>
        `;

        addCustomTagContainer.innerHTML = customTagContent;

        userStatsSection.appendChild(addCustomTagContainer);

        createCustomTag();
        
        const deleteTagBtn = document.getElementById('deleteTagBtn');
        deleteTagBtn.addEventListener('click', function() {
            deleteTagLock = !deleteTagLock;

            if (deleteTagLock) {
                deleteTagBtn.style.backgroundColor = "#FF6961";
                deleteTagBtn.style.color = "#2e2e2e";
            } else {
                deleteTagBtn.style.backgroundColor = "#2e2e2e";
                deleteTagBtn.style.color = "#FF6961";
            }
        });
    }

    main();

}

function handleTagAction(tag, tagsSection) {
    // Deleting tag logic
    if (deleteTagLock) {
        const userConfirmed = window.confirm(`Are you sure you want to remove the tag "${tag.textContent}"?`);

        if (userConfirmed) {
            handleCustomTagInLocal(tag.textContent, "remove") 

            tagsSection.querySelectorAll('.customTagInEntry').forEach(tagElement => {
                if (tagElement.textContent === tag.textContent) {
                    tagElement.remove();
                }
            });

            tag.remove();
        }

    // Adding tag logic
    } else {
        if (tag.classList.contains('customTagSelected')) {
            tag.classList.remove('customTagSelected');
            handleCustomTagInLocal(tag.textContent, "save", false)

            const entryTags = document.querySelectorAll('.customTagInEntry');
            entryTags.forEach(entryTag => {
                if (entryTag.textContent === tag.textContent) {
                    entryTag.remove();
                }
            });

        } else {
            tag.classList.add('customTagSelected');
            handleCustomTagInLocal(tag.textContent, "save", true)
            addCustomTagToEntry(tag, tagsSection);
        }
    }
}

let customTags = {};

browser.runtime.sendMessage({ action: 'getLocalStorageValue', requestType: 'customTags' }).then((response) => {
    if (response && response.value) {

        customTags = JSON.parse(response.value);

        // Adding custom tags to the custom tag section
        const currentUrl = window.location.href;
        const urlRegex = /https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$/;
        const tagsContainer = document.querySelector('.customTagsContainer .tagsList');

        if (urlRegex.test(currentUrl)) {
            Object.keys(customTags).forEach(tagName => {
                let tagCreated = false;
        
                Object.keys(customTags[tagName]).forEach(entryId => {
                    let entryData = customTags[tagName][entryId];
                    const { id, type } = getEntryInfo();
        
                    if (entryData.state === true && entryId == id && entryData.type == type) {
                        if (!tagCreated) {
                            const tag = document.createElement('li');
                            const tagsSection = document.querySelector("#entry > div > div > div > div.tags > ul");
        
                            tag.textContent = tagName;
                            tag.addEventListener("click", function() {
                                handleTagAction(tag, tagsSection);
                            });
        
                            tag.classList.add('customTagSelected');
                            addCustomTagToEntry(tag, tagsSection);
                            tagsContainer.appendChild(tag);
        
                            tagCreated = true;
                        }
                        return;
                    }
                });
        
                if (!tagCreated) {
                    const tag = document.createElement('li');
                    const tagsSection = document.querySelector("#entry > div > div > div > div.tags > ul");
        
                    tag.textContent = tagName;
                    tag.addEventListener("click", function() {
                        handleTagAction(tag, tagsSection);
                    });
        
                    tagsContainer.appendChild(tag);
                }
            });
        }
        
        // Adds custom tags to tooltips
        if (tooltipData.length > 0) {
            tooltipData.forEach(data => {
                const tooltipCard = data.tooltip.parentElement;
                const id = tooltipCard.getAttribute('data-id');
                const type = tooltipCard.getAttribute('data-type');
                const parsedTitleTags = data.parsedTitle.querySelector('.tags ul');
        
                Object.keys(customTags).forEach(tagName => {
                    Object.keys(customTags[tagName]).forEach(entryId => {
                        let entryData = customTags[tagName][entryId];
                        if (entryId == id && entryData.type == type && entryData.state === true) {
                            const li = document.createElement('li');
                            li.textContent = tagName;
                            li.classList.add('customTagInEntry');
        
                            parsedTitleTags.appendChild(li);
                        }
                    });
                });
        
                data.tooltip.setAttribute('title', data.parsedTitle.innerHTML);
            });
        }

    } else {
        console.log('Failed to retrieve custom tags data');
    }

    const regex = /^https:\/\/www\.anime\-planet\.com\/users\/[^\/]+\/(manga|anime)(\/.*)?(\?.*)?$/;
    if (regex.test(currentUrl)) {
        addCustomTagsFilter()
    }

}).catch(error => {
    console.error('Error retrieving custom tags data:', error);
});

function addCustomTagToEntry(tag, container) {
    const customTag = document.createElement('li');
    customTag.classList.add('customTagInEntry');
    customTag.textContent = tag.textContent;

    const lastTag = container.lastElementChild;
    container.insertBefore(customTag, lastTag);
}


//---------------------------------------------------------
// 
//  Filter to show entries with custom tag. 
//


function addCustomTagsFilter() {
    const filterTab = `
    <li id="tab-customTags" role="tab" tabindex="-1" class="ui-tabs-tab ui-corner-top ui-state-default ui-tab" aria-controls="customTags" aria-labelledby="ui-id-11" aria-selected="false" aria-expanded="false">
      <a href="#customTags" tabindex="-1" class="ui-tabs-anchor" id="ui-id-customTags">Custom Tags</a>
    </li>
    `;
    
    const filterTabPanel = `
    <div class="tab filterTags filterArea filterTagList ui-tabs-panel ui-corner-bottom ui-widget-content" id="customTags" aria-labelledby="ui-id-customTags" role="tabpanel" style="display: none;" aria-hidden="false">
        <ul>

        </ul>
    </div>
    `;
    
    const {newFilterTab, advancedFilter} = addEntryToFilterTab(filterTab, filterTabPanel);
    const tagList = advancedFilter.querySelector('div#customTags > ul');

    const addedTags = new Set();


    const regex = /https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/([^\/]+)(?:\/|\?|$)/;
    const match = currentUrl.match(regex);
    let type;
    if (match) {
        type = match[1].split('?')[0];
    }

    Object.keys(customTags).forEach(tagName => {
        const tagEntries = customTags[tagName];
    
        Object.keys(tagEntries).forEach(entryId => {
            const tag = tagEntries[entryId];
    
            if (!addedTags.has(tagName) && tag.state === true && type === tag.type) {
                const tagTooltip = document.createElement('li');
                tagTooltip.classList.add('filter', 'ternary', 'n');
                tagTooltip.style.userSelect = "none";
    
                const tagEle = document.createElement('a');
                const tagCount = Object.values(customTags[tagName]).filter(t => t.type === tag.type && t.state === true).length;
                tagEle.textContent = `${tagName} (${tagCount})`;
    
                tagTooltip.appendChild(tagEle);
                tagList.appendChild(tagTooltip);
                addedTags.add(tagName);
    
                tagEle.addEventListener('click', () => {
                    if (tagTooltip.classList.contains('tag-tooltip-active')) {
                        tagTooltip.classList.remove('tag-tooltip-active');
                        hideCustomTagEntries();
                    } else {
                        document.querySelectorAll('.tag-tooltip-active').forEach(item => {
                            item.classList.remove('tag-tooltip-active');
                        });
    
                        tagTooltip.classList.add('tag-tooltip-active');
    
                        showCustomTagEntries(tagName, type);
                    }
                });
            }
        });
    });
}


function showCustomTagEntries(tagName, type) {

    
    const cardDeckElement = document.querySelector('ul.cardDeck');
    const existingCardElements = cardDeckElement.querySelectorAll('li');
    let hasNewCards = false;
    const processedTags = new Set();

    Object.keys(customTags).forEach(customTag => {
        Object.keys(customTags[customTag]).forEach(tagId => {
            const tag = customTags[customTag][tagId];
    
            if (tag.type === type && tag.state === true && customTag === tagName) {
    
                const tagKey = `${tagId}-${tag.type}-${tagName}`;
    
                if (!processedTags.has(tagKey)) {
                    hasNewCards = true;
                    processedTags.add(tagKey);
    
                    const cardItem = document.createElement('li');
                    cardItem.classList.add('card', 'customTagCard');
    
                    const linkElement = document.createElement('a');
                    linkElement.classList.add('tooltip');
                    linkElement.href = tag.entryInfo.url;
    
                    const imageContainer = document.createElement('div');
                    imageContainer.classList.add('crop');
    
                    const imageElement = document.createElement('img');
                    imageElement.src = tag.entryInfo.imageUrl;
    
                    const titleElement = document.createElement('h3');
                    titleElement.classList.add('cardName');
                    titleElement.textContent = tag.entryInfo.name;
    
                    imageContainer.appendChild(imageElement);
                    linkElement.appendChild(imageContainer);
                    cardItem.appendChild(linkElement);
                    cardItem.appendChild(titleElement);
                    cardDeckElement.appendChild(cardItem);
                }
            }
        });
    });

    if (hasNewCards) {
        existingCardElements.forEach(card => card.style.display = "none");
    }
}

function hideCustomTagEntries() {
    const cardDeckElement = document.querySelector('ul.cardDeck');
    const existingCardElements = cardDeckElement.querySelectorAll('li');

    existingCardElements.forEach(card => card.style.display = "block");
    cardDeckElement.querySelectorAll('.customTagCard').forEach(customCard => customCard.remove());
}