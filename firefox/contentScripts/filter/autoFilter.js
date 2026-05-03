



(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "filter/autoFilter.js" } }));


    const tagsContainer = document.getElementById("multipletags");
    const otherContainer = document.querySelector('#showonly > .af-filters');
    const mylistContainer = document.querySelector('#userstatus > .af-filters');


    // filters is an array.
    function applyOthers(container, filters) {
        if (container && filters) {
            const filterElements = container.querySelectorAll('li.filter > a');
            
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


    function checkerPillExists() {
        const pills = document.querySelectorAll('div.pillFilters div.pillBottle a.pill');
        for (const pill of pills) {
            if (pill.textContent.trim() === "Zoo") {
                pill.remove();
                return true;
            }
        }
        return false;
    }

    async function waitForZooTag() {
        return new Promise(resolve => {
            const moreTagsCont = tagsContainer.querySelector("#advanced_more_tags");

            function check() {

                const tags = moreTagsCont.querySelectorAll("a");

                for (const tag of tags) {
                    if (tag.textContent.trim() === "Zoo") {

                        if (checkerPillExists()) {
                            tag.previousElementSibling.click();
                            resolve(true);
                            return;
                        }

                        tag.previousElementSibling.click();
                        break;
                    }
                }

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
                checkerPillExists()
                await waitForZooTag();

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