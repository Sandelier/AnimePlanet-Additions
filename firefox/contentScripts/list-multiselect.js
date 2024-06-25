

// https://www.anime-planet.com/forum/threads/multiselect-for-assigning-custom-lists.351332/

injectedScripts.push("wip/list-removeEntry.js");

window.addEventListener("message", (event) => {
    if (event.source == window && event.data && event.data.action == "userCustomLists") {

        const body = JSON.parse(event.data.body);

        if (body.status == "ok") {
            addClickListeners(body.data, event.data.entryInfo);
        }
    }
});



const styleElement = document.createElement('style');
    
styleElement.textContent = `
    .customListReason > textarea {
        width: 100%;
        height: 85px;
        padding: 0.5em;
    }
`;

document.head.appendChild(styleElement);


function addClickListeners(lists, entryInfo) {
    const customLists = document.querySelectorAll('.customLists > div');
    

    customLists.forEach((listElement) => {

        // We have to clone them so that we can remove all the event listeners easily.
        if (!listElement.classList.contains('customListOnEntry')) {
            let clonedListEle = listElement.cloneNode(true);
            listElement.replaceWith(clonedListEle);

            // Adding the adding of selected elements back since we just removed all event listeners
            clonedListEle.addEventListener('click', async function() {
    	    	if (!clonedListEle.classList.contains('customListOnEntry')) {
                    if (clonedListEle.classList.contains('customListSelected')) {
                        clonedListEle.classList.remove('customListSelected')

                        const selectedElements = document.querySelectorAll('.customListSelected');
                        if (selectedElements.length === 0) {
                            const descriptionElement = document.querySelector('.customListReason');
                            if (descriptionElement) {
                                descriptionElement.remove();
                            }
                        }

                    } else {
                        clonedListEle.classList.add('customListSelected');

                        const customListAddBtn = document.querySelector('.customListActions')

                        if (customListAddBtn && !document.querySelector('.customListReason')) {

                            const container = document.createElement('div');
                            container.classList.add('customListReason');

                            const pEle = document.createElement('p');
                            pEle.textContent = `Why does this ${entryInfo.type} belong on this list?`;

                            const textarea = document.createElement('textarea');

                            container.appendChild(pEle);
                            container.appendChild(textarea);

                            customListAddBtn.insertAdjacentElement('beforebegin', container);
                        }
                    }
                } 
    	    });
        }
    });

    // Overwriting the current buttonp
    const newAddBtn = document.createElement('button');
    newAddBtn.textContent = "Add manga";
    const currentAddBtn = document.querySelector('.customListActions > button');

    newAddBtn.addEventListener('click', () => {
        addEntryToLists(lists, entryInfo);
    });

    currentAddBtn.parentNode.replaceChild(newAddBtn, currentAddBtn);
}


async function addEntryToLists(lists, entryInfo) {
    const selectedLists = document.querySelectorAll('.customLists > .customListSelected');
    for (const list of selectedLists) {
        const listName = list.querySelector('label').innerHTML;
        const listInfo = lists.find(entry => entry.name === listName);
        const putApiUrl = `https://www.anime-planet.com/api/custom_lists/list/${listInfo.id}/entries/${entryInfo.type}/${entryInfo.id}`;
        const description = document.querySelector('.customListReason > textarea').value;
        try {
            const response = await fetch(putApiUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ description: description })
            });
            if (!response.ok) {
                console.error(`Http error. Status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error occurred while trying to put list:", error);
        }
    }
    document.querySelector('.fa-times').click();
}