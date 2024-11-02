

// https://www.anime-planet.com/forum/threads/request-quality-of-life-improvements.343089/

(function() {
    window.postMessage({ action: "injectedScript", name: "add-EntryNotes.js" });

    
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
})();



function addNote(notesArray) {
    console.log(notesArray);

    const { id, type } = getEntryInfo();

    let noteObject = notesArray.find(item => item.id === id && item.type === type);

    if (!noteObject) {
        noteObject = {
            note: "",
            id: id,
            type: type
        };

        notesArray.push(noteObject);
    }

    const { titleEle, noteTextarea, saveBtn } = createDomStructure(noteObject.note);

    saveBtn.addEventListener('click', function() {

        if (noteTextarea.value.trim() === "") {
            return;
        }

        noteObject.note = noteTextarea.value;

        (async () => {
            try {
                const response = await requestFromLocal('setLocalStorageValue', 'notes', notesArray);
                if (response && response.value) {
                    console.log("Local storage updated successfully.");

                } else {
                    console.log('ailed to update local storage');
                }
            } catch (error) {
                console.error("Error occurred while updating local storage:", error);
            }
        })();
    });
}

function createDomStructure(note) {
    // reviews, recommendations and etc container

    const relatedInfoEle = document.querySelector('#entry > div.pure-1:not([class*=" "])');

    const titleEle = document.createElement('h2');
    titleEle.textContent = "Notes";
    const noteTextarea = document.createElement('textarea');
    noteTextarea.classList.add('notesTextarea');
    noteTextarea.value = note;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = "Save";

    relatedInfoEle.insertBefore(saveBtn, relatedInfoEle.firstChild);
    relatedInfoEle.insertBefore(noteTextarea, saveBtn);
    relatedInfoEle.insertBefore(titleEle, noteTextarea);

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
        const response = await requestFromLocal('getLocalStorageValue', 'notes');
        if (response && response.value) {
            const currentUrl = window.location.href;
            const urlRegex = /https:\/\/www\.anime-planet\.com\/(manga|anime)\/[^\.\/]+$/;
            if (urlRegex.test(currentUrl)) {
                addNote(JSON.parse(response.value));
            }



            tooltipData.forEach(item => {

                const type = item.tooltip.parentElement.getAttribute('data-type');
                const id = item.tooltip.parentElement.getAttribute('data-id');

                const tooltipImage = item.tooltip.querySelector("div.crop");

                addNoteIcon(tooltipImage, type, id, JSON.parse(response.value));
            });
        } else {
            console.log('Failed to retrieve notes data');
        }
    } catch (error) {
        console.error('Error retrieving notes data:', error);
    }
})();



// Just add an mail icon to the bottom right corner of an tooltip if you have note in it
function addNoteIcon(cropDiv, type, id, notesArray) {
    const noteExists = notesArray.some(note => note.type === type && note.id == id);

    if (noteExists) {
        const noteIcon = document.createElement("p");
        noteIcon.textContent = "✉";

        noteIcon.classList.add('noteIcon');
        
        cropDiv.appendChild(noteIcon);    
    }
}