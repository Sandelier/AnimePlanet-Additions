

(function() {

    injectedScripts.push("filter-tags-search.js");

    function createSearchElement() {
        const searchElement = document.createElement("input");

        searchElement.id = "formTags";
        searchElement.type = "text";
        searchElement.name = "tags";
        searchElement.value = "";
        searchElement.placeholder = "search tag";
        searchElement.className = "ui-autocomplete-input";
        searchElement.autocomplete = "off";

        return searchElement;
    }

    // There were multiple things i could have used to make this but just went with map for no particular reason.
    function createTagMap(tags) {
        const tagMap = new Map();

        tags.forEach(tag => {
            const tagName = tag.querySelector('a').textContent.toLowerCase();
            tagMap.set(tagName, tag);
        });

        return tagMap;
    }

    function debounce(func, delay) {
        let debounceTimer;
        return function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, arguments), delay);
        }
    }

    const showMoreTagsEle = document.querySelector('#advanced_filter_tags');
    const moreTagsEle = document.querySelector('#advanced_more_tags');

    function searchFunctionality(searchElement, tags, tagMap) {
        searchElement.addEventListener('input', debounce((e) => {
            const query = e.target.value.toLowerCase().trim();
            tags.forEach(tag => tag.style.display = 'none');
            tagMap.forEach((tag, tagName) => {
                if (tagName.includes(query)) {
                    tag.style.display = 'inline-block';
                }
            });

            showMoreTagsEle.style.display = "none";
            moreTagsEle.style.display = "block";

            if (query.length <= 0) {
                showMoreTagsEle.style.display = "";
                moreTagsEle.style.display = "";
            }

        }, 300));
    }

    function mainSearchbar() {
        const searchTagElement = createSearchElement();
        const tags = document.querySelectorAll('li[data-class="filter-tooltip"]');
        const tagMap = createTagMap(tags);

        const tagsField = document.getElementById("multipletags");

        // Looks better in my opinion with 1em since its the same padding as the other filters.
        tagsField.style.setProperty('padding-top', '1em', 'important');
        tagsField.style.setProperty('padding-bottom', '1em', 'important');

        tagsField.insertBefore(searchTagElement, tagsField.firstChild);

        searchFunctionality(searchTagElement, tags, tagMap);
    }

    mainSearchbar();
    
})();