


(async function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "entry/customTitleName.js" } }));



    const styleElement = document.createElement('style');
    
    styleElement.textContent = `
        .customTitle {
            font-size: 2.4em;
            color: White;
            background: none !important;
            border: none;
            padding: 0;
            margin: 0.67em 0;
            font-family: "Oswald";
            font-weight: normal;
            width: 100%;
            resize: none;
            overflow: hidden;
            height: 60px;
        }

        .customTitleTooltip {
            display: block;
            margin: 0.5em 0 0;
            text-align: center;
            font-size: 0.8em;
            font-family: var(--ap-font-primary);
            font-weight: bold;
            color: var(--color-card--title);
            font-style: italic;
        }

        @media screen and (min-width: 450px) {
          .customTitleTooltip {
            font-size: 0.9em;
          }
        }
    `;

    document.head.appendChild(styleElement);

    // Allows talking between updateEntryData.js

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
    
    //

    const response = await callRequestFromLocal('getLocalStorageValue', 'entries');

    if (response && response.value) {
            
        let entries = response.value;
    
        // For entry page
        // every other page in entrypage does not contain the entry id so we can't modify it in like recommendations
        if (document.querySelector('div.entrySynopsis')) {
            const entryPageTitle = document.querySelector('h1[itemprop="name"]');
            entryPageTitle.style.display = "none";

            const formElement = document.querySelector('.md-3-5 > form');
            const entryId = formElement.getAttribute('data-id');
            const entryType = formElement.getAttribute('data-mode');

            // entryId might not be in the entries.
            const thisEntry = entries[entryType]?.[entryId];

            const customTitleInput = document.createElement("textarea");
            customTitleInput.setAttribute("maxlength", "250");
            customTitleInput.placeholder = entryPageTitle.textContent;
            customTitleInput.classList.add('customTitle');


            if (thisEntry?.customTitle && thisEntry.customTitle.show === true) {
                customTitleInput.value = thisEntry.customTitle.title;
                customTitleInput.style.fontStyle = "italic";



                // Adding the old title to alt titles
                let altTitles = document.querySelector('h2.aka');

                if (!altTitles) {
                    altTitles = document.createElement('h2');
                    altTitles.textContent = `Alt titles: ${entryPageTitle.textContent}`;
                    altTitles.classList.add('aka');

                    entryPageTitle.insertAdjacentElement('afterend', altTitles);
                } else {
                    altTitles.textContent = `${altTitles.textContent.trim()}, ${entryPageTitle.textContent}`;
                }

                // Setting the document title to have the custom title.
                let originalTitleParts = document.title.split(" | Anime-Planet");
                originalTitleParts[0] = thisEntry.customTitle.title;
                document.title = originalTitleParts.join(" | Anime-Planet");
                
            } else {
                customTitleInput.value = entryPageTitle.textContent;
            }

            entryPageTitle.parentNode.insertBefore(customTitleInput, entryPageTitle);

            customTitleInput.addEventListener('input', async function () {

                this.value = this.value.replace(/\s+/g, ' ').trim();
            
                try {
                    if (this.value === '') {
                        document.dispatchEvent(new CustomEvent("removeEntryData", { detail: { type: entryType, id: entryId, key: "customTitle" } }));
                    } else if (this.value == entryPageTitle.textContent.trim()) {
                        document.dispatchEvent(new CustomEvent("removeEntryData", { detail: { type: entryType, id: entryId, key: "customTitle" } }));
                    } else {
                        document.dispatchEvent(new CustomEvent("updateEntries", { detail: { type: entryType, id: entryId, data: { customTitle: { title: this.value, show: true } } } }));
                    }
                } catch (error) {
                    console.log(error);
                }
                

                
                // We need to check if its overflowing since auto makes the height for first row too high.
                if (customTitleInput.scrollWidth > customTitleInput.clientWidth || customTitleInput.scrollHeight > customTitleInput.clientHeight) {
                    customTitleInput.style.height = 'auto';
                    customTitleInput.style.height = customTitleInput.scrollHeight + 'px';
                }

                
            });
        
            // Just disabiling enter key from input
            customTitleInput.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                }
            });

            // We need to check if its overflowing since auto makes the height for first row too high.
            if (customTitleInput.scrollWidth > customTitleInput.clientWidth || customTitleInput.scrollHeight > customTitleInput.clientHeight) {
                customTitleInput.style.height = 'auto';
                customTitleInput.style.height = customTitleInput.scrollHeight + 'px';
            }
        }
    
        // For tooltips
        
        const tooltipData = window.tooltipData;
        if (tooltipData) {
            tooltipData.forEach(item => {
                const tooltip = item.tooltip;

                let cardEle = item.tooltip.parentElement;
                let entryId = cardEle.getAttribute('data-id');
                let entryType = cardEle.getAttribute('data-type');

                let noIconTooltip = false;

                // For tooltips where you cant see an icon (different structure) like /manga/top-manga
                if (!entryId || !entryType) {
                    const parent = cardEle.parentElement;
                    const form = parent.querySelector('td > form');
                    if (form) {
                        entryId = form.getAttribute('data-id');
                        entryType = form.getAttribute('data-mode');
                        cardEle = form;
                        noIconTooltip = true;
                    }
                }

                const customTitle = entries[entryType]?.[entryId]?.customTitle;

                if (customTitle && customTitle.title) {
                    if (!noIconTooltip) {
                        // For tooltips where they have an icon (different structure)
                        const cardNameEle = tooltip.querySelector('h3.cardName');
                        cardNameEle.style.display = "none";

                        const customCardEle = document.createElement('h3');
                        customCardEle.classList.add('customTitleTooltip');
                        customCardEle.textContent = customTitle.title;

                        if (customTitle.show === false) {
                            cardNameEle.style.display = "block";
                            customCardEle.style.display = "none";
                        }

                        cardNameEle.parentNode.insertBefore(customCardEle, cardNameEle);

                    } else {
                        if (customTitle.show === true) {
                            tooltip.textContent = customTitle.title;
                        }
                    }
                }
            });
        }
    } else {
        console.log('Failed to retrieve entries');
    }
})();


