

(function() {

    injectedScripts.push("filter-contains.js");

    const pillBottle = document.querySelector('.pillBottle');


    const styleElement = document.createElement('style');

    styleElement.textContent = `

        .fa-contains {
            user-select: none;
            cursor: pointer;
        }

        .filterArea li.contains .fa-contains { 
            color: #d896ff; 
        } 

        .filterArea li.contains a { 
            color: #d896ff; font-weight: bold; padding-right: 0.4em
        }

        .pillIcon {
            color: #d896ff;
        }

        .pillIcon:before {
            content: "\\26";
        }
    `;

    document.head.appendChild(styleElement);


    function addIconAndAttachClickEvent() {
        const multiTagsDiv = document.getElementById('multipletags');
        const filterTooltipItems = multiTagsDiv.querySelectorAll('li[data-class="filter-tooltip"]');

        filterTooltipItems.forEach(item => {
            const icon = document.createElement('i');
            icon.classList.add('fa', 'fa-contains');
            icon.textContent = '&';
            item.appendChild(icon);

            icon.addEventListener('click', () => {

                const tagId = item.id;

                const pillBottleTag = pillBottle.querySelector(`[data-field="${tagId}"]`);

                // Double clicking deactivates it.
                if (item.classList.contains('contains')) {
                    item.classList.remove('contains');
                    pillBottleTag.remove();
                    return;
                }


                if (item.classList.contains('include') || item.classList.contains('exclude')) {
                    item.classList.remove('include', 'exclude');
                }

                item.classList.add('contains');


                // Pillbottle


                const tagname = item.querySelector('a');


                if (pillBottleTag) {
                    const pillBottleIcon = pillBottleTag.querySelector('i');

                    pillBottleIcon.classList.remove('fa-minus', 'fa-plus');

                    pillBottleIcon.classList.add('pillIcon');

                    pillBottleTag.setAttribute('data-type', 'containsTag');

                } else {
                    const newPillEle = createPillBottleElement(tagId, tagname.textContent);
                    pillBottle.insertBefore(newPillEle, pillBottle.firstChild);
                }


                // if in example the contains changes to include
                const classChangeObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            if (!item.classList.contains('contains')) {
                                classChangeObserver.disconnect();
                            } else {
                                classChangeObserver.disconnect();
                                item.classList.remove('contains');
                            }
                        }
                    });
                });

                classChangeObserver.observe(item, { attributes: true });
            });
        });
    }


    function createPillBottleElement(number, text) {

        const pillBottleEle = document.querySelector('.pillBottle');

        const anchor = document.createElement('a');
        anchor.className = `pill ${number}`;
        anchor.setAttribute('data-field', number);
        anchor.setAttribute('data-type', 'containsTag');


        const icon = document.createElement('i');
        icon.classList.add('fa');
        icon.classList.add('pillIcon');
        anchor.appendChild(icon);


        const textNode = document.createTextNode(` ${text}`);
        anchor.appendChild(textNode);

        if (pillBottleEle.parentElement.style.display = "none") {
            pillBottleEle.parentElement.style.display = "flex";
        }

        return anchor;
    }


    addIconAndAttachClickEvent();

})();