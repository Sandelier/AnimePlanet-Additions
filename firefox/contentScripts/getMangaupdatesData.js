

(function() {

	window.postMessage({ action: "injectedScript", name: "getMangaupdatesData.js" });

	const mangaNameElement = document.querySelector('#siteContainer > h1');

	if (mangaNameElement) {
		const mangaName = mangaNameElement.textContent.trim();

		function getMangaInfo(name) {
			(async () => {
				try {
					const response = await requestFromLocal('getMangaInfo', '', name);
					if (response && response.value) {
						handleResponse(response);
					} else {
						console.log('Failed to retrieve manga info');
					}
				} catch (error) {
					console.error('Error fetching manga info:', error);
				}
			})();

			
		}

		function handleResponse(response) {
			let mangaInfo = JSON.parse(response.mangaInfo);
			if (response && mangaInfo.status) {
				switch (mangaInfo.status) {
					case "ok":
						main(mangaInfo.data);
						getDataBtn.remove();
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
				console.log('Unexpected response format:', response);
			}
		}

		function decodeHTMLEntities(text) {
			let textArea = document.createElement('textarea');
			textArea.innerHTML = text;
			return textArea.value;
		}


		// All of these will be null if the value is missing.
		const mangaDescriptionElement = document.querySelector('.synopsisManga');
		const mangaMagazine = document.querySelector('div.md-1-5:nth-child(2) > a');
		const mangaYear = document.querySelector('div.md-1-5:nth-child(3) > span');

		function main(mangaInfo) {

			let mangaOtherNames = mangaInfo.associated;
			let mangaDesc = decodeHTMLEntities(mangaInfo.description);
			let mangaPublications = mangaInfo.publications;
			let mangaStartYear = mangaInfo.year;

			// Removing all <br> texts and then splitting it when we encounter an <b> or <a>
			mangaDesc = mangaDesc.replace(/<BR><BR>/g, " ");
			mangaDesc = mangaDesc.replace(/<BR>/g, "");
			mangaDesc = mangaDesc.split(/<b>|<a|<!/)[0];

			if (mangaOtherNames.length > 0) {
				addToAltTitles(mangaOtherNames);
			}

			if (!mangaDescriptionElement && mangaDesc) {
				createDescription(mangaDesc, false);
			} else {
				createDescription(mangaDesc, true);
			}		


			if (!mangaYear && mangaStartYear) {
				createEntrybarElement(3, 'iconYear', mangaStartYear);
			}
		
			if (!mangaMagazine && mangaPublications && mangaPublications.length > 0) {
				createEntrybarElement(2, null, mangaPublications[0].publication_name);
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

			const existingTitles = new Set(Array.from(altTitles.getElementsByTagName('p')).map(p => p.textContent.trim()));

			otherNames.forEach(obj => {
				const decodedTitle = decodeHTMLEntities(obj.title);
				if (!existingTitles.has(decodedTitle)) {

					const pElement = document.createElement('p');
					pElement.textContent = decodedTitle;
					altTitles.appendChild(pElement);
		
					existingTitles.add(decodedTitle);
				}
			});
		}

		// Modifying the width of entrybar entries so we can fit everything in it.
		var style = document.createElement('style');

		style.textContent = `
          @media (min-width: 48em) {
            .md-1-5 {
              width: 16% !important;
            }
          }
        `;

		document.head.appendChild(style);


		let altTitles = document.querySelector('h2.aka');
		if (!altTitles) {
			altTitles = document.createElement('h2');
			altTitles.classList.add('aka');
			mangaNameElement.parentNode.insertBefore(altTitles, mangaNameElement.nextSibling);
		}


		// Button creeation.
		const getDataBtn = document.createElement('button');
		getDataBtn.classList.add('pure-1', 'md-1-5');
		getDataBtn.textContent = 'Fetch Data';


		getDataBtn.addEventListener('click', function() {
			getDataBtn.disabled = true;
			getDataBtn.style.cursor = 'not-allowed';

			setTimeout(function() {
				getDataBtn.disabled = false;
				getDataBtn.style.cursor = 'pointer';
			}, 10000);

			getMangaInfo(mangaName);
		});

		const entryBar = document.querySelector('section.pure-g.entryBar');
		entryBar.appendChild(getDataBtn);
	}
})();