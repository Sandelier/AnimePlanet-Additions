



(function() {

    window.postMessage({ action: "injectedScript", name: "filter-autoFilter.js" });

    const tagsContainer = document.getElementById("multipletags");
    const otherContainer = document.querySelector('#showonly > .af-filters');
    const mylistContainer = document.querySelector('#userstatus > .af-filters');


    // filters is an array.
    function applyOthers(container, filters) {
        if (container) {
            const filterElements = container.querySelectorAll('li.filter.n > a');

            filterElements.forEach(filterEle => {
                if (filters.includes(filterEle.textContent)) {
                    filterEle.click();
                }
            });
        }
    }


    // tagFilters is an json object.
    function applyTags(tagFilters) {

        if (tagsContainer) {
            const tags = tagsContainer.querySelectorAll('li.filter.n > a');

            tags.forEach(tag => {
                const tagName = tag.textContent.trim();

                if (tagFilters.hasOwnProperty(tagName)) {                
                    activationBtnSelector = (tagFilters[tagName] === "-") ? 'i.fa-minus' : 'i.fa-plus';

                    const tagParent = tag.parentElement;
                    const activationBtn = tagParent.querySelector(activationBtnSelector);

                    activationBtn.click();
                }
            });
        }
    }


    (async () => {
        try {
            const response = await requestFromLocal('getLocalStorageValue', 'autoFilters');
            if (response && response.value) {
                const autoFilters = JSON.parse(response.value);

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

})();