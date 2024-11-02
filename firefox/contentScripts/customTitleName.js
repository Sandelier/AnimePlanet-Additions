


(function() {
    window.postMessage({ action: "injectedScript", name: "customTitleName.js" });

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
            line-break: anywhere;
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
            line-break: anywhere;
            font-style: italic;
        }

        @media screen and (min-width: 450px) {
          .customTitleTooltip {
            font-size: 0.9em;
          }
        }
    `;

    document.head.appendChild(styleElement);

    browser.runtime.sendMessage({ action: 'getLocalStorageValue', requestType: 'customTitles' }).then((response) => {
        if (response && response.value) {
    
            let customTitles = JSON.parse(response.value);
    
            // For entry page
            const pattern = new RegExp("https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$");

            if (pattern.test(window.location.href)) {
                const entryPageTitle = document.querySelector('h1[itemprop="name"]');
                entryPageTitle.style.display = "none";

                const formElement = document.querySelector('.md-3-5 > form');
                const entryId = formElement.getAttribute('data-id');
                const entryType = formElement.getAttribute('data-mode');

                const customTitleInput = document.createElement("textarea");
                customTitleInput.setAttribute("maxlength", "250");
                customTitleInput.placeholder = entryPageTitle.textContent;
                customTitleInput.classList.add('customTitle');

                const key = `${entryType}${entryId}`;
                if (customTitles[key] && customTitles[key].show === true) {
                    customTitleInput.value = customTitles[key].title;
                    customTitleInput.style.fontStyle = "italic";
                } else {
                    customTitleInput.value = entryPageTitle.textContent;
                }

                entryPageTitle.parentNode.insertBefore(customTitleInput, entryPageTitle);

                customTitleInput.addEventListener('input', function () {

                    this.value = this.value.replace(/\s+/g, ' ');
                
                    if (this.value.trim() === '') {
                        delete customTitles[key];
                    } else if (this.value.trim() == entryPageTitle.textContent.trim()) {
                        delete customTitles[key];
                    } else {
                        customTitles[key] = { title: this.value, show: true };
                    }
                
                    (async () => {
                        try {
                            await requestFromLocal('setLocalStorageValue', 'customTitles', customTitles);
                        } catch (error) {}
                    })();

                    
                    // We need to check if its overflowing since auto makes the height for first row too high.
                    if (customTitleInput.scrollWidth > customTitleInput.clientWidth || customTitleInput.scrollHeight > customTitleInput.clientHeight) {
                        customTitleInput.style.height = 'auto';
                        customTitleInput.style.height = customTitleInput.scrollHeight + 'px';
                    }

                    
                });
            
                customTitleInput.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                
                        if (customTitles[key]) {
                            customTitles[key].show = !customTitles[key].show;
                        } else {
                            customTitles[key] = { title: entryPageTitle.textContent, show: true };
                        }
                
                        if (customTitles[key].show) {
                            customTitleInput.value = customTitles[key].title;
                            customTitleInput.style.fontStyle = "italic";
                        } else {
                            customTitleInput.value = entryPageTitle.textContent;
                            customTitleInput.style.fontStyle = "normal";
                        }
                
                        (async () => {
                            try {
                                await requestFromLocal('setLocalStorageValue', 'customTitles', customTitles);
                            } catch (error) {}
                        })();
                
                        customTitleInput.blur();
                    }
                });

                // We need to check if its overflowing since auto makes the height for first row too high.
                if (customTitleInput.scrollWidth > customTitleInput.clientWidth || customTitleInput.scrollHeight > customTitleInput.clientHeight) {
                    customTitleInput.style.height = 'auto';
                    customTitleInput.style.height = customTitleInput.scrollHeight + 'px';
                }
            }
        
            // For tooltips

            tooltipData.forEach(item => {
                const tooltip = item.tooltip;
              
                for (const titleKey in customTitles) {
                    if (tooltip.classList.contains(titleKey)) {
                        const cardNameEle = tooltip.querySelector('h3.cardName');
                        cardNameEle.style.display = "none";

                        const customCardEle = document.createElement('h3');
                        customCardEle.classList.add('customTitleTooltip');
                        customCardEle.textContent = customTitles[titleKey].title;

                        if (customTitles[titleKey].show === false) {
                            cardNameEle.style.display = "block";
                            customCardEle.style.display = "none";
                        }


                        cardNameEle.parentNode.insertBefore(customCardEle, cardNameEle);


                        break;
                    }
                }
            });

        } else {
            console.log('Failed to retrieve customTitles data');
        }
    }).catch(error => {
        console.error('Error retrieving customTitles data:', error);
    });
})();


