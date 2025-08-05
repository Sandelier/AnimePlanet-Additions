

(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "entry/cleanerAltTitles.js" } }));

    var style = document.createElement('style');
    style.textContent = `
        #siteContainer > h2.aka {
            display: flex;
            align-items: center;
            gap: 5px;
            flex-wrap: wrap;
        }
        h2.aka > p {
            border: solid 1px;
            padding: 1px 5px;
            margin: 0;
        }
    `;
    document.head.appendChild(style);

    const mangaNameElement = document.querySelector('#siteContainer > h1');
    let altTitles = document.querySelector('h2.aka');
    function processAltTitles() {

        if (altTitles.querySelector('p') !== null) { 
            return; 
        }

        if (!altTitles) {
            altTitles = document.createElement('h2');
            altTitles.classList.add('aka');
            mangaNameElement.parentNode.insertBefore(altTitles, mangaNameElement.nextSibling);
        } else {
            const textContent = altTitles.textContent.trim();
            // We are adding an invisible unicode character so if user later on adds an alttitle we can stil split the old alt titles
            const ZWSP = '\u200B';

            if (textContent.startsWith("Alt titles:") || textContent.startsWith("Alt title:")) {
                const prefix = textContent.startsWith("Alt titles:") ? "Alt titles:" : "Alt title:";
                const titles = textContent.substring(prefix.length).trim();

                function commaSplit(str) {
                    if (!str.includes('(') && !str.includes(')')) {
                        return str.split(',').map(s => s.trim());
                    }

                    // Had to include this since in example if alt title contains "(Oh, sorry)" we dont want to treat it as two separate alt titles
                    const result = [];
                    let current = '';
                    let insideParens = false;

                    for (const char of str) {
                        // We inside an paranthesis
                        if (char === '(') {
                            insideParens = true;
                            current += char;
                        // Ending of paranthesis
                        } else if (char === ')') {
                            insideParens = false;
                            current += char;
                        // Alt title found
                        } else if (char === ',' && !insideParens) {
                            result.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                
                    if (current) {
                        result.push(current.trim());
                    }
                
                    return result;
                }

                const commaParts = commaSplit(titles);

                
                // Making and adding the titles to alttitles element
                const fragment = document.createDocumentFragment();

                commaParts.forEach(part => {
                    part.split(ZWSP).forEach(subPart => {
                        const title = subPart.trim();
                        if (title) {
                            const pElement = document.createElement('p');
                            pElement.textContent = `${ZWSP}${title}`;
                            fragment.appendChild(pElement);
                        }
                    });
                });

                altTitles.textContent = prefix;
                altTitles.appendChild(fragment);
            }
        }
    }

    processAltTitles();

    const observer = new MutationObserver(() => {
        processAltTitles();
    });
    observer.observe(altTitles, { childList: true, subtree: true, characterData: true });
})();