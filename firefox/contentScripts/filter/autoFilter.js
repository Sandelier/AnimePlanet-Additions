



(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "filter/autoFilter.js" } }));


    const tagsContainer = document.getElementById("multipletags");
    const otherContainer = document.querySelector('#showonly > .af-filters');
    const mylistContainer = document.querySelector('#userstatus > .af-filters');


    // filters is an array.
    function applyOthers(container, filters) {
        if (container) {
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
        if (tagsContainer) {
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


    (async () => {
        try {
            const response = await callRequestFromLocal('getLocalStorageValue', 'autoFilters');
            if (response && response.value) {
                const autoFilters = response.value;

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