

// https://www.anime-planet.com/forum/threads/request-quality-of-life-improvements.343089/

(function() {
    injectedScripts.push("add-EntryNotes.js");

    
    const styleElement = document.createElement('style');
    
    styleElement.textContent = `
        .notesTextarea {
            width: 100%;
            height: 190px;
            padding: 0.5em;
            resize: none;
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

        const message = {
            action: "setLocalStorageValue",
            requestType: 'notes',
            value: notesArray
        }

        browser.runtime.sendMessage(message)
            .then(response => {
                console.log("Note saved:", notesArray);
            })
            .catch(error => {
                console.error("Error occured while updating notes:", error);
            })
    });
}

function createDomStructure(note) {
    // reviews, recommendations and etc container

    const relatedInfoEle = document.querySelector('#entry > div:nth-child(3)');

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


browser.runtime.sendMessage({ action: 'getLocalStorageValue', requestType: 'notes' }).then((response) => {
    if (response && response.value) {
        addNote(JSON.parse(response.value));
    } else {
        console.log('Failed to retrieve notes data');
    }
}).catch(error => {
    console.error('Error retrieving notes data:', error);
});