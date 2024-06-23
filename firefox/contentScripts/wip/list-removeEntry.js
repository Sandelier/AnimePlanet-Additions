

// https://www.anime-planet.com/forum/threads/request-change-add-to-new-custom-list-to-add-to-or-remove-from-new-custom-list.350743/

(function() {

    injectedScripts.push("wip/list-removeEntry.js");

	// Injecting the fetch interceptor to document.
	var script = document.createElement('script');

	script.textContent = `

        // Made by AP-Additions extension.
        // Used for list-removeEntry.js

        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
            
                if (args[0].startsWith('/api/custom_lists/applicable/manga/') && response.status === 200) {

                    const clonedResponse = response.clone();
                
                    clonedResponse.text().then(body => {

                        // Posting an message so content script can get the body.
                        window.postMessage({
                            action: "userCustomLists",
                            body: body,
                            userId: window.AP_VARS.USER_ID,
                            token: TOKEN
                        }, "*");
                    
                    }).catch(error => {
                        console.error('Error reading response body:', error);
                    });
                }
            
                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };
    `;

    const styleElement = document.createElement('style');
    
    styleElement.textContent = `
        .customListOnEntry {
            cursor: pointer;
        }
    `;

    document.head.appendChild(styleElement);
	document.head.appendChild(script);


	// Listening for the window to send the fetched data.
	window.addEventListener("message", (event) => {
		if (event.source == window && event.data && event.data.action == "userCustomLists") {

			const body = JSON.parse(event.data.body);

			if (body.status == "ok") {
				addClickListeners(body.data, event.data.userId, event.data.token);
			}
		}
	});


	async function addClickListeners(data, userId, token) {
		const nameToDataMap = {};
		data.forEach(obj => {
			if (obj.is_on_list) {
				nameToDataMap[obj.name] = {
					id: obj.id,
					type: obj.type
				};
			}
		});

		if (Object.keys(nameToDataMap).length <= 0) {
			return;
		}

		const entryName = document.querySelector('#siteContainer > h1').textContent;

		const customLists = document.querySelector('.customLists');

		const childElements = customLists.children;
		for (let i = 0; i < childElements.length; i++) {
			childElements[i].addEventListener('click', async function() {

				if (childElements[i].classList.contains('customListOnEntry')) {
					const listName = childElements[i].textContent;
					const result = confirm(`Are you sure you want to remove "${entryName}" from list "${listName}"`);

					if (result) {

						const listId = nameToDataMap[listName].id;
						const listType = nameToDataMap[listName].type;

						// Until i figure out an good way of removing the entry from an list we will just do it like this. it will only for work lists that have 50 entries or less since we would have to navigate through the pages and we dont relaly wanna do it.
						const listEntrysUrl = `https://www.anime-planet.com/ajaxDelegator.php?mode=customlist&id=${listId}&type=${listType}`;

						const tooltips = await fetchListEntries(listEntrysUrl);

						tooltips.forEach(tooltip => {
							if (tooltip.textContent === entryName) {

								const tdParent = tooltip.closest('td.tableTitle');

								if (tdParent) {
									const userContentDiv = tdParent.querySelector('div.userContent');
									if (userContentDiv) {
										const listEntryId = userContentDiv.getAttribute('id');
										console.log(listEntryId);

                                        removeEntryFromList(listId, listEntryId, userId, token);
                                        document.querySelector('.modal-close').click();
									}
								}
							}
						});
					}
				};
			});
		}
	}

    async function fetchListEntries(listEntrysUrl) {
        try {
            const response = await fetch(listEntrysUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }
            const data = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
    
            const tooltips = doc.querySelectorAll('a.tooltip');

            return tooltips;
        } catch (error) {
            console.error('Error:', error);
        }
    }


    async function removeEntryFromList(listId, listEntryId, userId, token) {
        const data = {
            list_id: listId,
            id: listEntryId,
            usr: userId,
            token: token
        };
    
        const formData = new URLSearchParams();
    
        for (const [key, value] of Object.entries(data)) {
            formData.append(key, value);
        }
    
        const encodedData = formData.toString();

    
        try {
            const response = await fetch('https://www.anime-planet.com/api/customlists/removeitem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: encodedData
            });
    
            if (!response.ok) {
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }
    
            const responseData = await response.text();
            console.log('Success:', responseData);
        } catch (error) {
            console.error('Error:', error);
        }
    }

})();