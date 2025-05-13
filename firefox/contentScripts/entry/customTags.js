


// After coming back to this code holy fuck its confusing. I really have to at some point redo or atleast comment on this shit

(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "entry/customTags.js" } }));

    const styleElement = document.createElement('style');

    styleElement.textContent = `
    .customTagInEntry {
        color: #c6ff73;
        user-select: none;
        transition: opacity 0.3s;
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


    // Allowing talking between browserSpecifics.js
    async function callRequestFromLocal(action, type, value) {
        const requestId = Math.random().toString(36).substr(2, 9);
        const responseEventName = `responseFromLocal_${type}${requestId}`;

        return new Promise((resolve) => {
            function onResponse(event) {
                document.removeEventListener(responseEventName, onResponse);
                resolve(event.detail);
            }

            document.addEventListener(responseEventName, onResponse);

            const requestEvent = new CustomEvent("requestFromLocal", {
                detail: { action, type, value, requestId }
            });

            document.dispatchEvent(requestEvent);
        });
    }


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

                handleCustomTagInLocal(newTag, "removeEntry")

                const tagsSection = document.querySelector("#entry > div > div > div > div.tags > ul");
                newTagItem.addEventListener("click", function() {
                    handleTagAction(newTagItem, tagsSection);
                });
            }
        
            newTagInput.value = '';
        }
    });
    }

    function handleCustomTagInLocal(tag, action) {
        const { id, type } = getEntryInfo();
        const entryKey = `${type}${id}`;

        if (action === 'save') {
            if (!customTags[tag]) {
                customTags[tag] = [];
            }

            if (!customTags[tag].includes(entryKey)) {
                customTags[tag].push(entryKey);
            }

        } else if (action === 'removeEntry') {
            if (customTags[tag]) {
                customTags[tag] = customTags[tag].filter(entry => entry !== entryKey);

                if (customTags[tag].length === 0) {
                    delete customTags[tag];
                }
            }

            console.log("Tag removed from entry:", customTags);
        } else if (action === 'removeTag') {
            if (customTags[tag]) {
                delete customTags[tag];
                console.log("Tag removed:", customTags);
            }
        }

        (async () => {
            try {
                console.log(customTags);
                const response = await callRequestFromLocal('setLocalStorageValue', 'customTags', customTags);
                if (response && response.value) {
                    console.log("Local storage updated successfully.");
                } else {
                    console.log("Failed to update local storage");
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
            handleCustomTagInLocal(tag.textContent, "removeTag") 

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
            handleCustomTagInLocal(tag.textContent, "removeEntry")

            const entryTags = document.querySelectorAll('.customTagInEntry');
            entryTags.forEach(entryTag => {
                if (entryTag.textContent === tag.textContent) {

                    entryTag.style.opacity = '0';

                    setTimeout(() => {
                        entryTag.remove();
                    }, 300);
                }
            });

        } else {
            tag.classList.add('customTagSelected');
            handleCustomTagInLocal(tag.textContent, "save")
            addCustomTagToEntry(tag, tagsSection);
        }
    }
    }

    let customTags = {};

    // Function to show tags in custom tag section + tooltips when going to an entry page
    (async function() {
        const response = await callRequestFromLocal('getLocalStorageValue', 'customTags');

        if (response && response.value) {

            customTags = response.value;

            // Adding custom tags to the custom tag section
            const currentUrl = window.location.href;
            const urlRegex = /https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$/;
            const tagsContainer = document.querySelector('.customTagsContainer .tagsList');

            if (urlRegex.test(currentUrl)) {

                Object.keys(customTags).forEach(tagName => {
                    let tagCreated = false;
                    const { id, type } = getEntryInfo();
                    const entryKey = `${type}${id}`;

                    if (customTags.manga || customTags.anime) {
                        console.error("vittu tuli taas väärä perkele");
                    }

                    console.log(customTags);
                    console.log(entryKey);

                    if (customTags[tagName].includes(entryKey)) {
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
            const tooltipData = window.tooltipData;
            if (tooltipData.length > 0) {
                tooltipData.forEach(data => {
                    const tooltipCard = data.tooltip.parentElement;
                    const id = tooltipCard.getAttribute('data-id');
                    const type = tooltipCard.getAttribute('data-type');
                    const parsedTitleTags = data.parsedTitle.querySelector('.tags ul');
                    const entryKey = `${type}${id}`;
                
                    Object.keys(customTags).forEach(tagName => {
                        if (customTags[tagName].includes(entryKey)) {


                            const li = document.createElement('li');
                            li.textContent = tagName;
                            li.classList.add('customTagInEntry');
                        
                            parsedTitleTags.appendChild(li);
                        }
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
    })();


    function addCustomTagToEntry(tag, container) {
        const customTag = document.createElement('li');
        customTag.classList.add('customTagInEntry');
        customTag.textContent = tag.textContent;
    
        customTag.style.opacity = '0';

        const lastTag = container.lastElementChild;
        container.insertBefore(customTag, lastTag);
    
        setTimeout(() => {
            customTag.style.opacity = '1';
        }, 10);
    }


    //---------------------------------------------------------
    // 
    //  Filter to show entries with custom tag. 
    //




    function addCustomTagsFilter() {
        document.addEventListener("responseAddEntryToFilterTab", (event) => {
            const { newFilterTab, advancedFilter } = event.detail;

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
            
                // Filter only entries that match the current type
                const filteredEntries = tagEntries.filter(entryId => entryId.startsWith(type));
            
                if (filteredEntries.length > 0 && !addedTags.has(tagName)) {
                    const tagTooltip = document.createElement('li');
                    tagTooltip.classList.add('filter', 'ternary', 'n');
                    tagTooltip.style.userSelect = "none";
                
                    const tagEle = document.createElement('a');
                    tagEle.textContent = `${tagName} (${filteredEntries.length})`;
                
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

        document.dispatchEvent(new CustomEvent("addEntryToFilterTab", {
            detail: {
                filterTab,
                filterTabPanel
            }
        }));
    }


    async function showCustomTagEntries(tagName, type) {

        const response = await callRequestFromLocal('getLocalStorageValue', 'entries');
        const entries = response.value;

        const cardDeckElement = document.querySelector('ul.cardDeck');
        const existingCardElements = cardDeckElement.querySelectorAll('li');
        let hasNewCards = false;
        const processedEntries = new Set();

        // Access only the entries for the given tag name
        if (customTags[tagName]) {
            customTags[tagName].forEach(entryKey => {
                if (entryKey.startsWith(type)) {
                    if (!processedEntries.has(entryKey)) {

                        const match = entryKey.match(/^(anime|manga)(\d+)$/);
                        const [, type, id] = match;

                        const entryInfo = entries[type][id].entryInfo;

                        hasNewCards = true;
                        processedEntries.add(entryKey);
                    
                        const cardItem = document.createElement('li');
                        cardItem.classList.add('card', 'customTagCard');
                    
                        const linkElement = document.createElement('a');
                        linkElement.classList.add('tooltip');
                        linkElement.href = `https://www.anime-planet.com/manga/${entryInfo.url}`;
                    
                        const imageContainer = document.createElement('div');
                        imageContainer.classList.add('crop');
                    
                        const imageElement = document.createElement('img');
                        imageElement.src = `https://cdn.anime-planet.com/manga/primary/${entryInfo.imageUrl}`
                    
                        const titleElement = document.createElement('h3');
                        titleElement.classList.add('cardName');
                        titleElement.textContent = entryInfo.name;
                    
                        imageContainer.appendChild(imageElement);
                        linkElement.appendChild(imageContainer);
                        cardItem.appendChild(linkElement);
                        cardItem.appendChild(titleElement);
                        cardDeckElement.appendChild(cardItem);
                    }
                }
            });
        };

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
})();