


(function() {

    injectedScripts.push("filter-quick-apply.js");

    function createQuickApplyBtn() {
        const quickApplyBtn = document.createElement("button");
        quickApplyBtn.className = "pillApply cta";
        quickApplyBtn.id = "quickApply-btn";
        quickApplyBtn.textContent = "Quick apply";
    
        return quickApplyBtn;
    }
    
    function main() {
        const quickApplyBtn = createQuickApplyBtn();
    
        const filterField = document.querySelector(".pillLabel");
        filterField.appendChild(quickApplyBtn);
    
        quickApplyBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
        
            const checks = createChecksArray();
            filterEntries(checks);
        });
    }
    
    main();
    
    
    function getFilterValues() {
        const pills = document.querySelectorAll('.pillBottle .pill');
    
        const values = [];
    
        pills.forEach(pill => {
            let text = pill.textContent.trim();
        
            if (pill.classList.contains('title-search')) {
                text = text.replace(/^Name contains\s*/, '');
            }


            let dataType = pill.getAttribute('data-type') || null;
        
            const icon = pill.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-plus')) {
                    dataType = 'incTag';
                } else if (icon.classList.contains('fa-minus')) {
                    dataType = 'excTag';
                }
            }
        
            const pillValue = {
                text: text,
                dataType: dataType
            };
        
            values.push(pillValue);
        });
    
        return values;
    }
    
    function createChecksArray() {
        const filterValues = getFilterValues();
    
        const checks = [];
        const containsTagValues = [];
    
        filterValues.forEach(value => {
            let formattedString = '';
        
            switch (value.dataType) {
                case 'rating_greater':
                    formattedString = `rating≥${value.text.replace('Rating ≥ ', '')}`;
                    break;
                case 'rating_less':
                    formattedString = `rating≤${value.text.replace('Rating ≤ ', '')}`;
                    break;
                case 'incTag':
                    formattedString = `incTag=${value.text.trim()}`;
                    break;
                case 'excTag':
                    formattedString = `excTag=${value.text.trim()}`;
                    break;
                case 'title-search':
                    formattedString = `name=${value.text}`;
                    break;
                case 'formStudio':
                case 'formMagazine':
                    formattedString = `studio=${value.text}`;
                    break;

                // Custom filters
                case 'chapters-filters-to':
                    formattedString = `chapters≤${value.text.replace('Chapters ≤ ', '')}`;
                    break;
                case 'chapters-filters-from':
                    formattedString = `chapters≥${value.text.replace('Chapters ≥ ', '')}`;
                    break;
                case 'containsTag':
                    containsTagValues.push(value.text.trim());
                    break;
                default:
                    formattedString = `other=${value.text}`;
                    break;
            }
        
            checks.push(formattedString);
        });

        if (containsTagValues.length > 0) {
            checks.push(`containsTag=${containsTagValues.join(',')}`);
        }
    
        return checks;
    }
    
    // Filtering
    
    function checkTag(title, tag) {
        const tagsList = title.querySelector('.tags')
        const tagsElements = tagsList.querySelectorAll('li');
        const tags = Array.from(tagsElements).map(tag => tag.textContent);
        return tags.includes(tag);
    }
    
    function checkRating(element, rating, operator) {
    
        // The rating that we are after is located in the statusarea instead of the title.
        let ttRating = element.querySelector('div.statusArea > div.ttRating');
    
        if (ttRating) {
            ttRating = parseFloat(ttRating.textContent);
        } else {
            return false;
        }
    
        switch (operator) {
            case '≥': return ttRating >= rating;
            case '≤': return ttRating <= rating;
            default: return false;
        }
    }
    
    function checkChapters(element, rating, operator) {
        let chapterElement = element.querySelector('.iconVol').textContent;
    
        let chapters;
    
    	const chapterMatch = chapterElement.match(/Ch:\s*(\d+)/i);
    	if (chapterMatch) {
    		  chapters = parseInt(chapterMatch[1], 10);
    	} else if (chapterElement === 'One Shot') {
    		  chapters = 1;
    	} else {
    		  chapters = undefined;
    	}
    
        switch (operator) {
            case '≥': return chapters >= rating;
            case '≤': return chapters <= rating;
            default: return false;
        }
    }
    
    function checkStudio(title, studio) {
        const entryBarLiElements= title.querySelectorAll('.entryBar li');
    
        // have to do it little bit more complex then others since studio can be missing + its not the only li element without class.
        for (let i = 0; i < entryBarLiElements.length; i++) {
            const li = entryBarLiElements[i];
        
            if (li.classList.length === 0 && li.childElementCount === 0) {
                if (li.textContent.trim() == studio) {
                    return true;
                }
            }
        }
    
        return false;
    }
    
    function checkStatus(title, status) {
    
        // manga
        let statusContent = title.querySelector('.iconVol');
    
        if (!statusContent) {
            // anime
            statusContent = title.querySelector('.type');
        }
    
        statusContent = statusContent.textContent;
    
        if (status === 'Ongoing' && statusContent.includes('+')) {
            return true;
        } else if (status === 'Unreleased' && statusContent.includes('TBA')) {
            return true; 
        } else if (status === 'Completed' && !statusContent.includes('TBA') && !statusContent.includes('+')) {
            return true;
        }
        return false;
    }

    function checkContainsTag(title, checkTags) {
        const tagsToMatch = checkTags.split(',');
    
        const tagsList = title.querySelector('.tags');
        const tagsElements = tagsList.querySelectorAll('li');
        
        const tags = Array.from(tagsElements).map(tag => tag.textContent.trim());
    
        const hasMatchingTag = tags.some(tag => tagsToMatch.includes(tag));
    
        return hasMatchingTag;
    }
    
    function filterEntries(checks) {
    
        tooltipData.forEach(data => {
            const { tooltip, parsedTitle } = data;
            tooltip.parentElement.style.display = 'none';
        
            let passesAllChecks = true;
            for (const check of checks) {

                // We can't just split it since value can also have an equal sign.
                const equalIndex = check.indexOf('=');
                let key = equalIndex !== -1 ? check.substring(0, equalIndex) : check;
                let value = equalIndex !== -1 ? check.substring(equalIndex + 1) : '';
            
            
                // In example, rating doesn't have an equal sign. gonna let it be like this for now since i have no motivation to fix this.
                if (key.startsWith('rating')) {
                    value = key;
                    key = "rating";
                } else if (key.startsWith('chapters')) {
                    value = key;
                    key = "chapters";
                }
            
                switch (key) {
                    case 'incTag':
                        if (!checkTag(parsedTitle, value)) {
                            passesAllChecks = false;
                        }
                        break;
                    case 'excTag':
                        if (checkTag(parsedTitle, value)) {
                            passesAllChecks = false;
                        }
                        break;
                    case 'rating':
                        const ratingValue = parseFloat(value.slice(7));
                        const ratingOperator = value.slice(6, 7);
                    
                        if (!checkRating(tooltip, ratingValue, ratingOperator)) {
                            passesAllChecks = false;
                        }
                        break;
                    case 'name':
                        let entryName = tooltip.querySelector('.cardName').textContent.toLowerCase();
                        if (!entryName.includes(value.toLowerCase())) {
                            passesAllChecks = false;
                        }
                        break;
                    case 'studio':
                        if (!checkStudio(parsedTitle, value)) {
                            passesAllChecks = false;
                        }
                        break;
                    case 'chapters':
                        const chaptersValue = parseFloat(value.slice(9));
                        const chaptersOperator = value.slice(8, 9);
                    
                        if (!checkChapters(parsedTitle, chaptersValue, chaptersOperator)) {
                            passesAllChecks = false;
                        }
                        break;
                    case 'other':
                        if (!checkStatus(parsedTitle, value)) {
                            passesAllChecks = false;
                        }
                        break;
                    case 'containsTag': 
                        if (!checkContainsTag(parsedTitle, value)) {
                            passesAllChecks = false;
                        }
                        break;
                    default:
                        break;
                }
            
                if (!passesAllChecks) {
                    break;
                }
            }
        
            if (passesAllChecks) {
                tooltip.parentElement.style.display = 'inline-block';
            }
        });
    }
})();