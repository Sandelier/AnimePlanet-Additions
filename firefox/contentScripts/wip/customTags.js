



(function() {
    injectedScripts.push("wip/customTags.js");
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

    .customTagsContainer > h3 {
        text-align: center;
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

                saveCustomTagToLocal(newTag, false);

                const tagsSection = document.querySelector("#entry > div > div > div > div.tags > ul");
                newTagItem.addEventListener("click", function() {
                    if (newTagItem.classList.contains('customTagSelected')) {
                        newTagItem.classList.remove('customTagSelected');
                        saveCustomTagToLocal(newTagItem.textContent, false);

                        const entryTags = document.querySelectorAll('.customTagInEntry');
                
                        entryTags.forEach(entryTag => {
                            if (entryTag.textContent === newTagItem.textContent) {
                                entryTag.remove();
                            }
                        });
                    } else {
                        newTagItem.classList.add('customTagSelected');
                        saveCustomTagToLocal(newTagItem.textContent, true);
                        addCustomTagToEntry(newTagItem, tagsSection);
                    }
                });
            }
        
            newTagInput.value = '';
        }
    });
}

function saveCustomTagToLocal(tag, state) {
    const { id, type } = getEntryInfo();

    const existingTagIndex = customTags.findIndex(tagObj => 
        tagObj.tag === tag && tagObj.id === id && tagObj.type === type
    );

    if (existingTagIndex !== -1) {
        customTags[existingTagIndex].state = state;
    } else {

        let name = document.querySelector('h1.long')?.textContent;
        if (!name) {
          name = document.querySelector('h1[itemprop="name"]').textContent;
        }

        const imageUrl = document.querySelector('div.mainEntry > img.screenshots').src;

        const customTagObj = {
            tag: tag,
            id: id,
            type: type,
            state: state,
            entryInfo: {
                name: name,
                url: currentUrl,
                imageUrl: imageUrl
            }
        };
        customTags.push(customTagObj);
    }

    const message = {
        action: "setLocalStorageValue",
        requestType: 'customTags',
        value: customTags
    };

    browser.runtime.sendMessage(message)
        .then(response => {
            console.log("Tag saved or updated:", customTags);
        })
        .catch(error => {
            console.error("Error occurred while updating tags:", error);
        });
}


const currentUrl = window.location.href;
const urlRegex = /https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$/;
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
            <h3>Custom Tags</h3>

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
    }

    main();

}

let customTags = [];

browser.runtime.sendMessage({ action: 'getLocalStorageValue', requestType: 'customTags' }).then((response) => {
    if (response && response.value) {

        customTags = JSON.parse(response.value);
        console.log(customTags);

        // Adding custom tags to the custom tag section
        const currentUrl = window.location.href;
        const urlRegex = /https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$/;
        const tagsContainer = document.querySelector('.customTagsContainer .tagsList');

        if (urlRegex.test(currentUrl)) {
            customTags.forEach(tagObj => {
                const tag = document.createElement('li');
                const tagsSection = document.querySelector("#entry > div > div > div > div.tags > ul");

                tag.addEventListener("click", function() {
                    if (tag.classList.contains('customTagSelected')) {
                        tag.classList.remove('customTagSelected');
                        saveCustomTagToLocal(tag.textContent, false);

                        const entryTags = document.querySelectorAll('.customTagInEntry');
                
                        entryTags.forEach(entryTag => {
                            if (entryTag.textContent === tag.textContent) {
                                entryTag.remove();
                            }
                        });
                    } else {
                        tag.classList.add('customTagSelected');
                        saveCustomTagToLocal(tag.textContent, true);
                        addCustomTagToEntry(tag, tagsSection);
                    }
                });

                tag.textContent = tagObj.tag;
                const { id, type } = getEntryInfo();
                if (tagObj.state === true && tagObj.id == id && tagObj.type == type) {
                    tag.classList.add('customTagSelected');
                    addCustomTagToEntry(tag, tagsSection);
                }

                tagsContainer.appendChild(tag);
            });
        }

        // Adds custom tags to tooltips
        if (tooltipData.length > 0) {

            tooltipData.forEach(data => {
                const tooltipCard = data.tooltip.parentElement;
                const id = tooltipCard.getAttribute('data-id');
                const type = tooltipCard.getAttribute('data-type');
                const parsedTitleTags = data.parsedTitle.querySelector('.tags ul');
                
                customTags.forEach(tag => {
                    if (tag.id == id && tag.type == type && tag.state === true) {
                        const li = document.createElement('li');
                        li.textContent = tag.tag;
                        li.classList.add('customTagInEntry');

                        parsedTitleTags.appendChild(li);
                    }
                });

                data.tooltip.setAttribute('title', data.parsedTitle.innerHTML);;
            });
        }

    } else {
        console.log('Failed to retrieve custom tags data');
    }

    const regex = /^https:\/\/www\.anime\-planet\.com\/users\/[^\/]+\/(manga|anime)(\/.*)?$/;
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


    const regex = /https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/([^\/]+)(?:\/|$)/;
    const match = currentUrl.match(regex);
    let type;
    if (match) {
        type = match[1];
    }

    customTags.forEach(tag => {
        if (!addedTags.has(tag.tag) && tag.state === true && type === tag.type) {
            const tagTooltip = document.createElement('li');
            tagTooltip.classList.add('filter', 'ternary', 'n');
            tagTooltip.style.userSelect = "none";
    
            const tagEle = document.createElement('a');
            const tagCount = customTags.filter(t => t.tag === tag.tag && t.type === tag.type && t.state === true).length;
            tagEle.textContent = `${tag.tag} (${tagCount})`;
    
            tagTooltip.appendChild(tagEle);
    
            tagList.appendChild(tagTooltip);
    
            addedTags.add(tag.tag);
    
            tagEle.addEventListener('click', () => {
                if (tagTooltip.classList.contains('tag-tooltip-active')) {
                    tagTooltip.classList.remove('tag-tooltip-active');
                    hideCustomTagEntries();
                } else {
                    document.querySelectorAll('.tag-tooltip-active').forEach(item => {
                        item.classList.remove('tag-tooltip-active');
                    });
    
                    tagTooltip.classList.add('tag-tooltip-active');
    
                    showCustomTagEntries(tag.tag, type);
                }
            });
        }
    });
}


function showCustomTagEntries(customTag, type) {

    
    const cardDeckElement = document.querySelector('ul.cardDeck');
    const existingCardElements = cardDeckElement.querySelectorAll('li');
    let hasNewCards = false;
    const processedTags = new Set();

    customTags.forEach(tag => {
        if (tag.type === type && tag.state === true && tag.tag == customTag) {

            const tagKey = `${tag.id}-${tag.type}-${customTag}`;

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