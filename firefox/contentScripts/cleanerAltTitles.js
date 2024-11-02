

(function() {
	window.postMessage({ action: "injectedScript", name: "cleanerAltTitles.js" });


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

	if (!altTitles) {
		altTitles = document.createElement('h2');
		altTitles.classList.add('aka');
		mangaNameElement.parentNode.insertBefore(altTitles, mangaNameElement.nextSibling);
	} else {
        const textContent = altTitles.textContent;
        const separatorIndex = textContent.indexOf(': ');
    
        if (separatorIndex !== -1) {
            const prefix = textContent.substring(0, separatorIndex);
            const titles = textContent.substring(separatorIndex + 2);
    
            const titlesArray = titles.split(', ');
    
            altTitles.textContent = prefix + ':';
    
            titlesArray.forEach(title => {
                const pElement = document.createElement('p');
                pElement.textContent = title;
                altTitles.appendChild(pElement);
            });
        }
    }
})();