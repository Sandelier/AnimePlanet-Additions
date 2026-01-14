



(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "filter/autoFilter.js" } }));


    const tagsContainer = document.getElementById("multipletags");
    const otherContainer = document.querySelector('#showonly > .af-filters');
    const mylistContainer = document.querySelector('#userstatus > .af-filters');


    // filters is an array.
    function applyOthers(container, filters) {
        if (container && filters) {
            const filterElements = container.querySelectorAll('li.filter.n > a');
            
            filters = filters.map(filter => filter.toLowerCase());
            
            filterElements.forEach(filterEle => {
                if (filters.includes(filterEle.textContent.toLowerCase())) {
                    filterEle.click();
                }
            });
        }
    }

    // tagFilters is an json object.
    function applyTags(tagFilters) {
        if (tagsContainer && tagFilters) {
            const tags = tagsContainer.querySelectorAll('li.filter.n > a');
            
            const tagFiltersLower = Object.keys(tagFilters).reduce((acc, key) => {
                acc[key.toLowerCase()] = tagFilters[key];
                return acc;
            }, {});
            
            tags.forEach(tag => {
                const tagName = tag.textContent.trim().toLowerCase();
                
                if (tagFiltersLower.hasOwnProperty(tagName)) {                
                    const activationBtnSelector = (tagFiltersLower[tagName] === "-") ? 'i.fa-minus' : 'i.fa-plus';
                    
                    const tagParent = tag.parentElement;
                    const activationBtn = tagParent.querySelector(activationBtnSelector);
                    
                    activationBtn.click();
                }
            });
        }
    }


    // Listeners for tags get added late in the dom so we cant listen for a specific element to be added so have to do it like this
    function createCheckerElement() {
        const tag = document.createElement('li');
        tag.className = 'filter ternary n';
        tag.style.display = "none";

        const tagText = document.createElement('a');
        tagText.textContent = 'Checker';

        tag.appendChild(tagText);
        tagsContainer.querySelector('ul').appendChild(tag);

        return tagText;
    }

    function checkerPillExists() {
        const pills = document.querySelectorAll('div.pillFilters div.pillBottle a.pill');
        for (const pill of pills) {
            if (pill.textContent.trim() === "Checker") {
                pill.remove();
                return true;
            }
        }
        return false;
    }

    async function waitForCheckerPill() {
        return new Promise(resolve => {
            const checker = createCheckerElement();
            if (!checker) {
                console.error("Failed to create checker element");
                resolve(false);
                return;
            }

            function check() {
                if (checkerPillExists()) {
                    resolve(true);
                    return;
                }

                checker.click();

                setTimeout(check, 20);
            };

            check();
        });
    }

    (async () => {
        try {

            if (document.querySelectorAll('div.pillFilters div.pillBottle a.pill').length > 0) {
                return;
            }

            const response = await callRequestFromLocal('getLocalStorageValue', 'autoFilters');

            if (response && response.value) {

                let pageType = null;
                const url = window.location.href;

                if (url.startsWith('https://www.anime-planet.com/manga/all')) {
                    pageType = 'manga';
                } else if (url.startsWith('https://www.anime-planet.com/anime/all')) {
                    pageType = 'anime';
                } else {
                    const match = url.match(/^https:\/\/www\.anime-planet\.com\/users\/[^\/]+\/(manga|anime)\b/);
                    if (match) {
                        pageType = match[1];
                    }
                }

                const autoFilters = response.value[pageType];

                await waitForCheckerPill();

                applyOthers(otherContainer, autoFilters["other"]);
                applyOthers(mylistContainer, autoFilters["mylist"]);
                applyTags(autoFilters["tags"]);
            } else {
                console.log('Failed to retrieve autofilters');
            }

        } catch (error) {
            console.error('Error fetching autofilters:', error);
        }
    })();

    // Function to get data from local
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
})();