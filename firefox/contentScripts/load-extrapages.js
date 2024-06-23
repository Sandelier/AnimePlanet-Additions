



(function() {

    injectedScripts.push("load-extrapages.js");

    function getNextPageBtn() {

        const selectedPage = document.querySelector('.nav li.selected');

        const nextPage = selectedPage.nextElementSibling;

        // We know the nextpageBtn will never have any classes.
        if (nextPage && nextPage.classList.length === 0) {
            return nextPage;
        }

        return null;
    }

    async function main(pagesToFetch) {
        if (!document.querySelector('.nav li.selected')) { return; }
    
        // dont want the user to go too overboard with this :p
        pagesToFetch = Math.min(pagesToFetch, 3);
    
        let nextPageBtn = getNextPageBtn();
        let fetchPromises = [];
    
        for (let i = 0; i < pagesToFetch && nextPageBtn != null; i++) {
            if (nextPageBtn.classList.length === 0) {
                const nextPageUrl = nextPageBtn.querySelector('a').href;
                fetchPromises.push(fetchNextPageData(nextPageUrl, nextPageBtn));
                nextPageBtn = nextPageBtn.nextElementSibling;
            }
        }
    
        try {
            await Promise.all(fetchPromises);
            // Since new tooltips have been added
            parseTooltips(true);
        } catch (error) {
            console.error('Error fetching pages:', error);
        }
    }
    
    // Getting + parsing New entries
    async function fetchNextPageData(url, nextPageBtn) {
        const startTime = performance.now(); 
        try {
            const response = await fetch(url);
            const data = await response.text();
            const endTime = performance.now();
            const elapsedTime = endTime - startTime;
            console.log(`Fetching took ${elapsedTime} milliseconds`);
    
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            appendNewEntries(doc);
    
            nextPageBtn.remove();
        } catch (error) {
            console.error('Error fetching next page:', error);
            throw error;
        }
    }


    /* Gonna add the code below to an helper function if i ever need to do something else with tooltips on different script. */

    function appendNewEntries(doc) {
        const nextPageItems = doc.querySelectorAll('ul.cardDeck.cardGrid > li');

        const currentPageDeck = document.querySelector('ul.cardDeck.cardGrid');


        nextPageItems.forEach(item => {
            // images wont load otherwise since we didint let them load when we retrieved them.
            const img = item.querySelector('div.crop > img');
            const dataSrc = img.getAttribute('data-src');
            img.setAttribute('src', dataSrc);

            const clonedItem = item.cloneNode(true);
            currentPageDeck.appendChild(clonedItem);

            clonedItem.addEventListener('mouseover', handleTooltipMouseOver);
            clonedItem.addEventListener('mouseout', handleTooltipMouseOut);
        });
    }

    // Tooltips need to be made also since copying removes all the listeners :/

    function handleTooltipMouseOver(event) {
        const card = event.currentTarget;
        const childElement = card.querySelector('a'); 

        const title = childElement.getAttribute('title');

        const parser = new DOMParser();
        const parsedTitle = parser.parseFromString(title, 'text/html');

        const tooltipEle = createTooltipDivs();

        const tooltipContent = tooltipEle.querySelector('.ui-tooltip-content');

        tooltipContent.innerHTML = '';
        parsedTitle.body.childNodes.forEach(node => {
            tooltipContent.appendChild(node.cloneNode(true));
        });

        // Positioning the right side of the tooltip to the left side of the card

        let cardRect = card.getBoundingClientRect();

        tooltipEle.style.position = "absolute";
        tooltipEle.style.top = (cardRect.top + window.scrollY + 20) + "px";

        // Just setting it to the middle first so we can get the width without it being overflown.
        tooltipEle.style.left = "50vh";

        document.body.appendChild(tooltipEle); // have to update so we get the offsetwidth.

        let offsetWidth = tooltipEle.offsetWidth;

        tooltipEle.style.left = (cardRect.left + window.scrollX + cardRect.width + 10) + "px";

        const tooltipRect = tooltipEle.getBoundingClientRect();
        const viewportWidth = window.innerWidth;


        if (tooltipRect.right > viewportWidth) {

            tooltipEle.style.left = (cardRect.left + window.scrollX - 10 - offsetWidth) + "px";
            document.body.appendChild(tooltipEle);
        }

    }

    function createTooltipDivs() {
        const outerDiv = document.createElement('div');
        outerDiv.setAttribute('role', 'tooltip');
        outerDiv.setAttribute('id', 'ui-id-61');
        outerDiv.classList.add('ui-tooltip', 'ui-corner-all', 'ui-widget-shadow', 'ui-widget', 'ui-widget-content', 'right');

        const innerDiv = document.createElement('div');
        innerDiv.classList.add('ui-tooltip-content');

        outerDiv.appendChild(innerDiv);

        return outerDiv;
    }

    function handleTooltipMouseOut(event) {
        const tooltips = document.querySelectorAll('body > div[role="tooltip"]');
        tooltips.forEach(tooltip => {
            tooltip.remove();
        });
    }


    browser.runtime.sendMessage({ action: 'getLocalStorageValue', requestType: 'pagesToSearch' }).then((response) => {
        if (response && response.value) {
            main(JSON.parse(response.value));
        } else {
            console.log('Failed to retrieve disallowed tags');
        }
    }).catch(error => {
        console.error('Error fetching disallowed tags:', error);
    });

})();