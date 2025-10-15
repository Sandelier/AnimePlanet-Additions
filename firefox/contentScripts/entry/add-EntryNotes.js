

// https://www.anime-planet.com/forum/threads/request-quality-of-life-improvements.343089/

(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "entry/add-EntryNotes.js" } }));

    
    const styleElement = document.createElement('style');
    
    styleElement.textContent = `
        .notesTextarea {
            width: 100%;
            height: 190px;
            padding: 0.5em;
            resize: none;
        }
        .noteIcon {
            position: absolute;
            bottom: 0;
            right: 0;
            font-size: 1.8em !important;
            color: yellow;
            text-shadow: 0px 0px 7px black;
        }
    `;

    document.head.appendChild(styleElement);

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
    

    function addNote(entriesData) {

        const { id, type } = getEntryInfo();

        let noteText = entriesData[type][id]?.note || "";

        const { titleEle, noteTextarea, saveBtn } = createDomStructure(noteText);

        saveBtn.addEventListener('click', async function() {

            if (noteTextarea.value.trim() === "") {
                document.dispatchEvent(new CustomEvent("removeEntryData", { detail: { type: type, id: id, key: "note" } }));
                saveBtn.style.backgroundColor = "#FF746C";
                saveBtn.style.color = "black";

            } else {

                noteText = noteTextarea.value;
                document.dispatchEvent(new CustomEvent("updateEntries", { detail: { type: type, id: id, data: { note: noteText } } }));
                saveBtn.style.backgroundColor = "#77DD77";
                saveBtn.style.color = "black";
            }
            
            setTimeout(() => {
                saveBtn.style.backgroundColor = "";
                saveBtn.style.color = "";
            }, 300);
            return;
        });
    }

    function createDomStructure(note) {
        // reviews, recommendations and etc container
        const noteContainer = document.createElement('div');
        noteContainer.id = "noteContainer";

        const relatedInfoEle = document.querySelector('#entry > div.pure-1:not([class*=" "])');

        const titleEle = document.createElement('h2');
        titleEle.textContent = "Notes";
        const noteTextarea = document.createElement('textarea');
        noteTextarea.classList.add('notesTextarea');
        noteTextarea.value = note;

        const saveBtn = document.createElement('button');
        saveBtn.textContent = "Save";

        noteContainer.appendChild(titleEle);
        noteContainer.appendChild(noteTextarea);
        noteContainer.appendChild(saveBtn);
        relatedInfoEle.insertBefore(noteContainer, relatedInfoEle.firstChild);

        return {
            titleEle: titleEle,
            noteTextarea: noteTextarea,
            saveBtn: saveBtn
        };
    }

    // We could make an script to just retrieve the ap_vars but well if i need it more later on then i might consider it
    function getEntryInfo() {

        const formElement = document.querySelector('.md-3-5 > form');
        const dataId = formElement.getAttribute('data-id');
        const dataMode = formElement.getAttribute('data-mode');

        return { id: parseInt(dataId), type: dataMode};
    }

    (async () => {
        try {
            const response = await callRequestFromLocal('getLocalStorageValue', 'entries');
            if (response && response.value) {
                const entriesData = response.value;


                if (document.querySelector('.md-3-5 > form')) {
                    const currentUrl = window.location.href;
                    const urlRegex = /https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+(?!\/recommendations)$/;

                    if (urlRegex.test(currentUrl)) {
                        addNote(entriesData);
                    }
                }

                const tooltipData = window.tooltipData;
                if (!tooltipData) return;
                
                tooltipData.forEach(item => {
                    const type = item.tooltip.parentElement.getAttribute('data-type');
                    const id = item.tooltip.parentElement.getAttribute('data-id');

                    const tooltipImage = item.tooltip.querySelector("div.crop");
                    
                    if (!type || !id) return;

                    const note = entriesData[type][id]?.note || "";

                    addNoteIcon(tooltipImage, note);
                });
            } else {
                console.log('Failed to retrieve entries');
            }
        } catch (error) {
            console.error('Error retrieving entries:', error);
        }
    })();



    // Just add an mail icon to the bottom right corner of an tooltip if you have note in it
    function addNoteIcon(cropDiv, note) {
        if (note) {
            const noteIcon = document.createElement("p");
            noteIcon.textContent = "✉";

            noteIcon.classList.add('noteIcon');

            cropDiv.appendChild(noteIcon);    
        }
    }
})();