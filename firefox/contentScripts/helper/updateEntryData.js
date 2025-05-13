

(async function () {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "helper/updateEntryData.js" } }));


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

    let customEntryData = {};
    const response = await callRequestFromLocal('getLocalStorageValue', 'entries');
    customEntryData = response.value

    async function updateEntries(type, id, data) {
        try {
            if (!customEntryData[type]) {
                console.error("Invalid type. Must be 'manga' or 'anime'");
                return false;
            }
        
            if (!customEntryData[type][id]) {
                customEntryData[type][id] = {};
            }   
        
            Object.keys(data).forEach((key) => {
                customEntryData[type][id][key] = data[key];
            });

            await callRequestFromLocal('setLocalStorageValue', 'entries', customEntryData);
        
            return true;
        } catch (error) {
            return false;
        }
    }

    async function removeEntryData(type, id, key) {
    try {
        if (!customEntryData?.[type]?.[id]) {
            console.error("Entry not found");
            return false;
        }
        
        // Removing the key
        if (customEntryData[type][id][key] !== undefined) {
            delete customEntryData[type][id][key];
        }

        // Removing the entry if its empty
        if (Object.keys(customEntryData[type][id]).length === 0) {
            delete customEntryData[type][id];
        }

        await callRequestFromLocal('setLocalStorageValue', 'entries', customEntryData);

        return true;
    } catch (error) {
        return false;
    }
    }


    // This should be only called when in entry page.
    async function makeEntryInfo(type, id) {

        if (!customEntryData[type]) {
            console.error("Invalid type. Must be 'manga' or 'anime'");
            return false;
        }

        const currentUrl = window.location.href;
        const urlRegex = /https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$/;

        if (urlRegex.test(currentUrl)) {
            let name = document.querySelector('h1.long')?.textContent;
            if (!name) {
                name = document.querySelector('h1[itemprop="name"]').textContent;
            }


            let imageUrl = document.querySelector('div.mainEntry > img.screenshots').src;
            imageUrl = imageUrl.replace(/^https:\/\/cdn\.anime-planet\.com\/manga\/primary\//, "").replace(/\?t=\d+$/, "");

            const trimmedUrl = currentUrl.replace(/^https:\/\/www\.anime-planet\.com\/(manga|anime)\//, "");

            const entryInfo = {
                name: name,
                url: trimmedUrl,
                imageUrl: imageUrl
            }

            // Checking if the entryinfo is identical to the current customEntryData entryinfo
            if (customEntryData[type]?.[id]?.entryInfo && JSON.stringify(customEntryData[type][id].entryInfo) === JSON.stringify(entryInfo)) {
                return true;
            }

            await updateEntries(type, id, { entryInfo });

            return true;

        } else {
            return false;
        }
    }


    // Making events so other content scripts can interact with the functions (for now atleast we dont need to return anything)
    document.addEventListener("updateEntries", async (event) => {
        const { type, id, data } = event.detail;
        await updateEntries(type, id, data);
    });
    
    document.addEventListener("removeEntryData", async (event) => {
        const { type, id, key } = event.detail;
        await removeEntryData(type, id, key);
    });
    
    document.addEventListener("makeEntryInfo", async (event) => {
        const { type, id } = event.detail;
        await makeEntryInfo(type, id);
    });
})();