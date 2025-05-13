function createField(key, value) {
    const fieldContainer = document.createElement('div');
    fieldContainer.classList.add('featuresEditor-field-container');
    
    const label = document.createElement('label');
    label.textContent = key;
    
    let input;
    // Array json
    if (Array.isArray(value)) {
        input = document.createElement('div');
        input.classList.add('array-field');

        value.forEach((item, index) => {
            const arrayItemContainer = document.createElement('div');
            arrayItemContainer.classList.add('featuresEditor-field-container');
            
            const arrayItemInput = document.createElement('input');
            arrayItemInput.type = 'text';
            arrayItemInput.value = item;
            arrayItemInput.addEventListener('input', () => {
                currentEditorData[key][index] = arrayItemInput.value;
            });

            const removeButton = document.createElement('button');
            removeButton.textContent = '🗑';
            removeButton.classList.add('remove-btn');
            removeButton.addEventListener('click', () => {
                currentEditorData[key].splice(index, 1);
                setJsonEditor(currentEditorData);
            });

            arrayItemContainer.appendChild(arrayItemInput);
            arrayItemContainer.appendChild(removeButton);
            input.appendChild(arrayItemContainer);
        });

        const addButton = document.createElement('button');
        addButton.classList.add('defaultBtnStyle');
        const addBtnTextEle = document.createElement('span');
        addBtnTextEle.textContent = 'Add Value';
        addButton.appendChild(addBtnTextEle);
        addButton.addEventListener('click', () => {
            currentEditorData[key].push('');
            setJsonEditor(currentEditorData);
        });

        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);
        fieldContainer.appendChild(addButton);
    // Nested object
    } else if (typeof value === 'object' && value !== null) {
        input = document.createElement('div');
        input.classList.add('nested-object');

        Object.keys(value).forEach(nestedKey => {
            const nestedFieldContainer = document.createElement('div');
            nestedFieldContainer.classList.add('featuresEditor-field-container');
            const nestedLabel = document.createElement('label');
            nestedLabel.textContent = nestedKey;
            
            const nestedInput = document.createElement('input');
            nestedInput.type = 'text';
            nestedInput.value = value[nestedKey];
            nestedInput.addEventListener('input', () => {
                currentEditorData[key][nestedKey] = nestedInput.value;
            });

            const removeButton = document.createElement('button');
            removeButton.textContent = '🗑';
            removeButton.classList.add('remove-btn');
            removeButton.addEventListener('click', () => {
                delete currentEditorData[key][nestedKey];
                setJsonEditor(currentEditorData);
            });

            nestedFieldContainer.appendChild(nestedLabel);
            nestedFieldContainer.appendChild(nestedInput);
            nestedFieldContainer.appendChild(removeButton);
            input.appendChild(nestedFieldContainer);
        });

        const addNestedButton = document.createElement('button');
        const addBtnTextEle = document.createElement('span');
        addNestedButton.classList.add('defaultBtnStyle');
        addBtnTextEle.textContent = `Add ${key}`;
        addNestedButton.appendChild(addBtnTextEle);

        addNestedButton.addEventListener('click', () => {
            let newKey = '';
            
            while (true) {
                newKey = prompt("Enter the new key name (max 33 characters):");
                if (newKey === null) return;
                if (newKey.length > 33) {
                    alert("The key name must be 33 characters or fewer.");
                    continue;
                }
                const existingKeys = Object.keys(currentEditorData[key]).map(k => k.toLowerCase());

                if (existingKeys.includes(newKey.toLowerCase())) {
                    alert("This key already exists.");
                    continue;
                }
                break;
            }
            
            if (newKey) {
                currentEditorData[key][newKey] = '';
                setJsonEditor(currentEditorData);
            }
        });

        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);
        fieldContainer.appendChild(addNestedButton);
    // Object
    } else {
        input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.addEventListener('input', () => {
            currentEditorData[key] = input.value;
        });
    }

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    return fieldContainer;
}

let currentEditorData = {};
function setJsonEditor(jsonObj) {
    currentEditorData = jsonObj;
    const jsonEditor = document.getElementById('featuresEditor');
    jsonEditor.innerHTML = '';

    Object.keys(jsonObj).forEach(key => {
        jsonEditor.appendChild(createField(key, jsonObj[key]));
    });

    document.querySelectorAll('.featuresEditor-field-container input').forEach(input => {
        input.style.width = (input.value.length) + 4 + 'ch';

        input.addEventListener('input', (event) => {

            if (event.target.value.length <= 0) {
                input.style.width = 4 + 'ch';
            } else {
                input.style.width = (event.target.value.length) + 4 + 'ch';
            }

        });

        input.addEventListener('beforeinput', (event) => {
            if (input.value.length >= 34 && event.inputType !== "deleteContentBackward") {
                event.preventDefault();
            }
        });
    });
}



// Saving settings

document.getElementById('feature-saveBtn').addEventListener('click', () => {
    saveEditorData();
});

function saveEditorData() {
    let jsonObj = {};
    const parentKey = document.getElementById('featuresEditor').dataset.key;
    
    const fieldContainers = document.querySelectorAll('#featuresEditor > div.featuresEditor-field-container');

    fieldContainers.forEach(field => {
        const labelEle = field.querySelector('label');
        if (!labelEle) return;

        const label = labelEle.textContent;
        let value = null;

        const input = field.querySelector('input');
        if (input && !field.querySelector('.nested-object')) {
            value = input.value.trim();
        }

        const arrayFields = field.querySelectorAll('.array-field');
        arrayFields.forEach(arrayField => {
            const arrayValues = [];
            const inputs = arrayField.querySelectorAll('input');
            inputs.forEach(input => {
                const trimmedValue = input.value.trim();
                if (trimmedValue) arrayValues.push(trimmedValue);
            });
            if (arrayValues.length > 0) value = arrayValues;
        });

        const nestedFields = field.querySelectorAll('.nested-object');
        nestedFields.forEach(nestedField => {
            const nestedJson = {};
            const nestedInputs = nestedField.querySelectorAll('input');
            nestedInputs.forEach(nestedInput => {
                const key = nestedInput.previousElementSibling.textContent;
                const trimmedValue = nestedInput.value.trim();
                if (trimmedValue) nestedJson[key] = trimmedValue;
            });
            if (Object.keys(nestedJson).length > 0) value = nestedJson;
        });

        if (value !== null && value !== "") {
            jsonObj[label] = value;
        }
    });

    let storageKey = parentKey || Object.keys(jsonObj)[0];


    if (jsonObj[storageKey]) {
        localStorageData[storageKey] = jsonObj[storageKey];
        browser.storage.local.set({ [storageKey]: jsonObj[storageKey] });
    } else {
        localStorageData[storageKey] = jsonObj;
        browser.storage.local.set({ [storageKey]: jsonObj });
    }
}