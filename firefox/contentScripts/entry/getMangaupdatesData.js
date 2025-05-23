

(function() {

	document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "entry/getMangaupdatesData.js" } }));

	// Blocks if its not in the manga overview page + if its an novel
	const novelTags = ["Light Novels", "Web Novels", "Korean Novels", "Novels", "Chinese Novels"];
	const tagElements = document.querySelectorAll("section#entry.pure-g.EntryPage__content div.tags li");
	
	const isNovel = Array.from(tagElements).some(tag =>
		novelTags.includes(tag.textContent.trim())
	);

	if (!document.querySelector('div#siteContainer section.pure-g.entryBar') || isNovel) {
    	return;
	}

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

	const mangaNameElement = document.querySelector('#siteContainer > h1');

	if (mangaNameElement) {
		const mangaName = mangaNameElement.textContent.trim();

		async function getMangaInfo(name) {
			try {
				const response = await callRequestFromLocal('getMangaInfo', '', name);
				if (response && response.value) {
					try {
						handleResponse(JSON.parse(response.value));
						return true;
					} catch (error) {
						console.log("Failed to parse response value:", error);
						return false;
					}
				} else {
					console.log('Failed to retrieve manga info');
					return false;
				}
			} catch (error) {
				console.error('Error fetching manga info:', error);
				return false;
			}
		}

		function handleResponse(mangaInfo) {

			if (mangaInfo && mangaInfo.status) {
				switch (mangaInfo.status) {
					case "ok":
						getDataBtn.textContent = "Update data";	

						main(mangaInfo.data.associated, mangaInfo.data.status, mangaInfo.data.url, mangaInfo.data.description, mangaInfo.data.publications, mangaInfo.data.year, true);
						break;
					case "rateLimit":
						console.log('Rate limit reached. Please wait before retrying.');
						getDataBtn.style.backgroundColor = "#FF6961";
						setTimeout(() => {
							getDataBtn.style.backgroundColor = "";
						}, 10000);
						break;
					case "error":
						console.log('Failed to retrieve manga info');
						getDataBtn.remove();
						break;
					default:
						console.log('Unexpected status:', mangaInfo.status);
				}
			} else {
				console.log('Unexpected response format:', mangaInfo);
			}
		}

		function decodeHTMLEntities(text) {
			let textArea = document.createElement('textarea');
			textArea.innerHTML = text;
			return textArea.value;
		}


		// chatgpt provided levenshtein :p
		function levenshtein(a, b) {
			const tmp = [];
			for (let i = 0; i <= a.length; i++) {
			  tmp[i] = [i];
			}
			for (let j = 0; j <= b.length; j++) {
			  tmp[0][j] = j;
			}

			for (let i = 1; i <= a.length; i++) {
			  for (let j = 1; j <= b.length; j++) {
				const cost = a[i - 1] === b[j - 1] ? 0 : 1;
				tmp[i][j] = Math.min(
				  tmp[i - 1][j] + 1,
				  tmp[i][j - 1] + 1,
				  tmp[i - 1][j - 1] + cost
				);
			  }
			}
		  
			const maxLength = Math.max(a.length, b.length);
			return ((maxLength - tmp[a.length][b.length]) / maxLength) * 100;;
		}

		// All of these will be null if the value is missing.
		const mangaDescriptionElement = document.querySelector('.synopsisManga');
		const mangaMagazine = document.querySelector('div.md-1-5:nth-child(2) > a');
		const mangaYear = document.querySelector('div.md-1-5:nth-child(3) > span');

		function main(mangaOtherNames, status, muLink, mangaDesc, mangaPublications, mangaStartYear, saveToEntries = false) {

			status = status.replace(/[*•]/g, '');

			let entryJson = { MU: {
				"url": muLink,
				"status": status
			}};
			mangaDesc = decodeHTMLEntities(mangaDesc);

			// Many contain like "From Square Enix:" or something similar at the start
			mangaDesc = mangaDesc.replace(/^From\s[^:]+:/, "");
			mangaDesc = mangaDesc.replace(/^\(From \[.*?:/, "");

			// Asterick removing (bold text)
			mangaDesc = mangaDesc.replace(/\*{2,}/g, "");

			// The ending of description typically contains like orginal translation links and etc or official links
			mangaDesc = mangaDesc.replace(/(.)?(Original|Official|Links)[\s\S]*/, "");

			// Removing all <br> texts and then splitting it when we encounter an <b> or <a>
			mangaDesc = mangaDesc.replace(/<BR><BR>/g, " ");
			mangaDesc = mangaDesc.replace(/<BR>/g, "");
			mangaDesc = mangaDesc.split(/<b>|<a|<!/)[0];

			if (mangaOtherNames.length > 0) {
				addToAltTitles(mangaOtherNames);
				entryJson.MU.mangaOtherNames = mangaOtherNames.map(obj => obj.title);
			}

			if (mangaDesc && mangaDesc != undefined && mangaDesc != "undefined") {
				if (!mangaDescriptionElement) {
					createDescription(mangaDesc, false);
					entryJson.MU.mangaDesc = mangaDesc;
				} else {
					if (mangaDesc.length > 1 && levenshtein(mangaDesc, mangaDescriptionElement.textContent) <= 75) {
						createDescription(mangaDesc, true);
						entryJson.MU.mangaDesc = mangaDesc;
					}
				}
			}	


			if (!mangaYear && mangaStartYear) {
				createEntrybarElement(3, 'iconYear', mangaStartYear);
				entryJson.MU.mangaStartYear = mangaStartYear;
			}
		
			if (!mangaMagazine && mangaPublications && mangaPublications.length > 0) {
				createEntrybarElement(2, null, mangaPublications[0].publication_name);
				entryJson.MU.mangaPublications = mangaPublications;
			}

			if (saveToEntries) {

				const formElement = document.querySelector('.md-3-5 > form');
				const entryId = formElement.getAttribute('data-id');
				const entryType = formElement.getAttribute('data-mode');

				document.dispatchEvent(new CustomEvent("updateEntries", { detail: { type: entryType, id: entryId, data: entryJson } }));

			}

			// Mu link to notes
			if (muLink) {

				const dataContainer = document.querySelector('section#entry.pure-g.EntryPage__content div.pure-1.md-2-3 div.pure-1.md-3-5');

				const synopsisEles = dataContainer.querySelectorAll('.synopsisManga');
				const lastSynopsisEle = synopsisEles[synopsisEles.length - 1];

				// creating notes div if it dosent exist.
				let notesDiv = dataContainer.querySelector('div.notes');
				if (!notesDiv) {
				  notesDiv = document.createElement('div');
				  notesDiv.className = 'notes';

				  lastSynopsisEle.parentNode.insertBefore(notesDiv, lastSynopsisEle.nextSibling);
				}

				// mu link
				let linkEle = document.createElement('a');
				linkEle.href = muLink;
				linkEle.target = '_blank';
				linkEle.className = 'mangaupdates-link';

				// mu logo
				let muLogo = document.createElement('img');
				muLogo.src = chrome.runtime.getURL('images/mangaupdates_modified.svg');

				linkEle.appendChild(muLogo);
				linkEle.appendChild(document.createTextNode('Mangaupdates'));

				notesDiv.appendChild(linkEle);
			}

			if (status) {
				const container = document.querySelector('section#entry.pure-g.EntryPage__content div.pure-1.md-1-3');

				// Heard that this element was used for ads but is nowadays not used anymore so we are hiding it.
				container.querySelector('div.gah').style.display = "none";

				const newSection = document.createElement('section');
				newSection.classList.add('MuStatus');
			
				const heading = document.createElement('h3');
				heading.textContent = 'MU Status';
				newSection.appendChild(heading);

				// Adding data to the section

				function appendMatchSpan(regex, prefix, source = status) {
					const match = source.match(regex);
					if (match) {
						const span = document.createElement('span');
						span.textContent = `${prefix}${match[1]}`;
						newSection.appendChild(span);
					}
				}

				// Volumes
				appendMatchSpan(/(\d+)\s*Volumes?/, 'Volumes: ', status);

				// Chapters has to also check for dots since sometimes its like "403.2 Chapters"
				appendMatchSpan(/(\d+(?:\.\d+)?)\s*Chapters?/, 'Chapters: ', status);

				// Manga status
				appendMatchSpan(/\((.*?)\)/, '• Status: ');

				// Season status (check last line only)
				const lastLine = status.split('\n').pop();
				appendMatchSpan(/(TBA)$/, '• Season Status: ', lastLine);
			
				container.appendChild(newSection);
			}
		}

		// Entry bar.

		function createEntrybarElement(childNumber, className, textContent) {
			const element = document.createElement('span');
			if (className) {
				element.className = className;
			}
			element.textContent = textContent;
			const container = document.querySelector(`div.md-1-5:nth-child(${childNumber})`);
			container.appendChild(element);
		}

		// Description
		// isToggleable is when description is not orginally there. so when we add the new description it will not need to have toggle btn
		function createDescription(description, isToggleable) {
		    const divSynopsis = document.createElement('div');
		    divSynopsis.classList.add('synopsisManga');
		    if (isToggleable) {
		        divSynopsis.style.display = 'none';
		    }
		    const synopsis = document.createElement('p');
		    synopsis.textContent = description;
		    divSynopsis.appendChild(synopsis);
		
		    const container = document.querySelector('div.pure-1.md-3-5');
		    const firstChild = container.querySelector('p');
		    if (firstChild && isToggleable === false) {
		        container.removeChild(firstChild);
		    }
		    container.insertBefore(divSynopsis, container.firstChild);
		
		    if (isToggleable) {
		        createToggleButton(container, divSynopsis);
		    }
		}

		function createToggleButton(container, divSynopsis) {
		    const toggleButton = document.createElement('button');
		    toggleButton.textContent = 'MU Synopsis';
			toggleButton.style.margin = "1.33em 0 0em";
		
		    const tagsElement = container.querySelector('div.tags');
		    if (tagsElement) {
		        container.insertBefore(toggleButton, tagsElement);
		    } else {
		        const formElement = container.querySelector('form');
		        container.insertBefore(toggleButton, formElement);
		    }
		
		    toggleButton.addEventListener('click', () => {
		        if (divSynopsis.style.display === 'none') {
		            divSynopsis.style.display = 'block';
		            mangaDescriptionElement.style.display = 'none';
		            toggleButton.textContent = 'AP Synopsis';
		        } else {
		            divSynopsis.style.display = 'none';
		            mangaDescriptionElement.style.display = 'block';
		            toggleButton.textContent = 'MU Synopsis';
		        }
		    });
		}

		// Alt titles
		function addToAltTitles(otherNames) {

			if (!altTitles.textContent.trim()) {
				const altTitlesTextNode = document.createTextNode('Alt titles: ');
				altTitles.appendChild(altTitlesTextNode);
			} 


			if (otherNames.length >= 3) {
				altTitles.textContent = altTitles.textContent.replace('Alt title:', 'Alt titles:');
			}

			const mainTitle = document.querySelector('h1[itemprop="name"]').textContent.trim();
			const altTitlesText = altTitles.textContent.replace(/^Alt titles: /, '').trim();
    		const altTitlesArray = altTitlesText ? altTitlesText.split(', ').map(title => title.trim()) : [];

    		const altTitlesSet = new Set(altTitlesArray);

    		otherNames = otherNames.filter(nameObj => {
				const trimmedTitle = nameObj.title.trim();
				return trimmedTitle !== mainTitle && !altTitlesSet.has(trimmedTitle);
			});

			if (otherNames.length > 0) {
				const newTitles = otherNames.map(nameObj => nameObj.title.trim()).join(', ');
				let trimmedText = altTitles.textContent.trim();

				if (trimmedText.includes(":") && !trimmedText.includes(": ")) {
					trimmedText = trimmedText.replace(":", ": ");
				}
			
				if (trimmedText === "Alt titles:" || trimmedText === "Alt title:") {
					altTitles.textContent = trimmedText + " " + newTitles;
				} else {
					altTitles.textContent = trimmedText + ", " + newTitles;
				}
			}
		}

		// Modifying the width of entrybar entries so we can fit everything in it.
		const style = document.createElement('style');

		style.textContent = `
			@media (min-width: 48em) {
				.md-1-5 {
					width: 16% !important;
				}
			}

			#entry.pure-g.EntryPage__content .pure-1.md-1-3:has(section.MuStatus) {
				display: flex;
				flex-direction: column;
				justify-content: space-evenly;
			}

			@media (min-width: 768px) {
				.MuStatus {
					margin-bottom: 1.4em;
					padding-left: 1em;
				}
			}
			
			.MuStatus > span {
				display: block;
				margin-bottom: 5px;
			}
			
			.mangaupdates-link {
				display: flex;
				align-items: center;
			}
			.mangaupdates-link img {
				max-height: 16px;
				margin-right: 5px;
			}
		`;

		document.head.appendChild(style);


		let altTitles = document.querySelector('h2.aka');
		if (!altTitles) {
			altTitles = document.createElement('h2');
			altTitles.classList.add('aka');
			mangaNameElement.parentNode.insertBefore(altTitles, mangaNameElement.nextSibling);
		}


		const getDataBtn = document.createElement('button');

		(async function () {
			const formElement = document.querySelector('.md-3-5 > form');
			const entryId = formElement.getAttribute('data-id');
			const entryType = formElement.getAttribute('data-mode');
		
			const response = await callRequestFromLocal('getLocalStorageValue', 'entries');
			const entries = response.value;



			getDataBtn.classList.add('pure-1', 'md-1-5');
			const entryBar = document.querySelector('section.pure-g.entryBar');
			entryBar.appendChild(getDataBtn);

			// fetch button
			getDataBtn.textContent = 'Fetch Data';
			getDataBtn.addEventListener('click', async () => {
				getDataBtn.disabled = true;
				getDataBtn.style.cursor = 'not-allowed';

				await getMangaInfo(mangaName);

				getDataBtn.disabled = false;
				getDataBtn.style.cursor = 'pointer';
			});

			// Show data
			if (entries[entryType]?.[entryId]?.MU) {
				getDataBtn.textContent = "Update data";

				const muData = entries[entryType][entryId].MU;
				muData.mangaOtherNames = (muData.mangaOtherNames ?? []).map(title => ({ title }));
				main(muData.mangaOtherNames, muData?.status, muData?.url, muData.mangaDesc, muData.mangaPublications, muData.mangaStartYear);
			}
		})();
	}
})();