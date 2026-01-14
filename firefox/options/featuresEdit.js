let currentEditorData = {};
let originalEditorValue = "";
let currentlyEditing = undefined;
const editor = document.getElementById("featuresEditor");
const highlight = document.getElementById("jsonHighlight");
const saveBtn = document.getElementById("feature-saveBtn");
const headerText = document.getElementById("editorHeader"); 


editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
        e.preventDefault();

        const start = editor.selectionStart;
        const end = editor.selectionEnd;

        const value = editor.value;
        editor.value = value.substring(0, start) + "  " + value.substring(end);

        editor.selectionStart = editor.selectionEnd = start + 2;

        highlightJSON();
    }
});

editor.addEventListener("scroll", () => {
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
});

function highlightJSON() {
    highlight.innerHTML = Prism.highlight(editor.value, Prism.languages.json, "json");

    try {
        JSON.parse(editor.value);

        const isChanged = editor.value !== originalEditorValue;

        if (isChanged) {
            saveBtn.classList.remove("deactivatedBtn");
            saveBtn.classList.add("validJson");
        } else {
            saveBtn.classList.remove("deactivatedBtn");
            saveBtn.classList.remove("validJson");
        }

    } catch {
        saveBtn.classList.add("deactivatedBtn");
        saveBtn.classList.remove("validJson");
    }
}

function setJsonEditor(jsonObj) {

    if (currentlyEditing === editor.dataset.key) {
        return;
    }

    headerText.querySelector('span').textContent = editor.dataset.formattedKey;
    currentlyEditing = editor.dataset.key;

    currentEditorData = jsonObj || {};
    originalEditorValue = JSON.stringify(currentEditorData, null, 4);

    editor.value = originalEditorValue;
    highlightJSON();
}

function saveEditorData() {

    if (saveBtn.classList.contains("deactivatedBtn")) {
        return;
    }

    try {
        const jsonObj = JSON.parse(editor.value);
        currentEditorData = jsonObj;

        const parentKey = editor.dataset.key;
        const storageKey = parentKey || Object.keys(jsonObj)[0];

        if (jsonObj[storageKey]) {
            localStorageData[storageKey] = jsonObj[storageKey];
            if (typeof browser !== "undefined" && browser.storage) {
                browser.storage.local.set({ [storageKey]: jsonObj[storageKey] });
            }
        } else {
            localStorageData[storageKey] = jsonObj;
            if (typeof browser !== "undefined" && browser.storage) {
                browser.storage.local.set({ [storageKey]: jsonObj });
            }
        }

        originalEditorValue = editor.value;
        saveBtn.classList.remove("validJson");

    } catch (err) {
        console.log(err);
    }
}

document.getElementById("featuresEditor").addEventListener("input", highlightJSON);

saveBtn.addEventListener("click", saveEditorData);