(async function() {

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

    let contentScripts = {};
    let missedScriptNames = [];

    // Adding "Scripts" element into menu
    const menuList = document.querySelector('ul#menuRoot');

    const scriptsEle = document.createElement('li');
    scriptsEle.classList.add('pure-u');

    const scriptsText = document.createElement('a');
    scriptsText.textContent = 'Scripts';

    scriptsEle.appendChild(scriptsText);

    const dropdownMenu = document.createElement('ul');
    scriptsEle.appendChild(dropdownMenu);

    menuList.appendChild(scriptsEle);

    document.addEventListener("injectedScript", function(event) {
        const { name } = event.detail;
        // We might miss an script before we get the response for content scripts
        if (!contentScripts[name]) {
            missedScriptNames.push(name);
        } else {
            const dropElement = document.createElement('li');
            const scriptNameEle = document.createElement('a');
            scriptNameEle.textContent = contentScripts[name].formattedName;

            dropElement.appendChild(scriptNameEle);
            dropdownMenu.appendChild(dropElement);
        }
    });

    const response = await callRequestFromLocal('getLocalStorageValue', 'contentScripts');
    contentScripts = response && response.value ? response.value : {};

    missedScriptNames.forEach((name) => {
        if (contentScripts[name]) {
            const dropElement = document.createElement('li');
            const scriptNameEle = document.createElement('a');
            scriptNameEle.textContent = contentScripts[name].formattedName;

            dropElement.appendChild(scriptNameEle);
            dropdownMenu.appendChild(dropElement);
        }
    });

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "other/scriptsLoaded.js" } }));
})();