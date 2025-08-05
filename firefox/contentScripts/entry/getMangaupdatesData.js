

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

						main(mangaInfo.data.associated, mangaInfo.data.status, mangaInfo.data.categories, mangaInfo.data.genres, mangaInfo.data.url, mangaInfo.data.description, mangaInfo.data.publications, mangaInfo.data.year, true);
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

		function main(mangaOtherNames, status, categories, muTags, muLink, mangaDesc, mangaPublications, mangaStartYear, saveToEntries = false) {

			if (status) {
				status = status.replace(/[*•]/g, '');
			}

			let entryJson = { MU: {
				"url": muLink,
				"status": status
			}};
			mangaDesc = decodeHTMLEntities(mangaDesc);

			// Removes markdown links
			mangaDesc = mangaDesc.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "");

			// Removes links
			mangaDesc = mangaDesc.replace(/https?:\/\/[^\s)]+/g, "");

			// Many contain like "From Square Enix:" or something similar at the start
			mangaDesc = mangaDesc.replace(/^From\s[^:]+:/, "");
			mangaDesc = mangaDesc.replace(/^\(From \[.*?:/, "");

			// Asterick removing (bold text)
			mangaDesc = mangaDesc.replace(/\*{2,}/g, "");

			// The ending of description typically contains like orginal translation links and etc or official links
			mangaDesc = mangaDesc.replace(/(.)?(Original|Official|Links|Source)[\s\S]*/, "");

			// Removing all <br> texts and then splitting it when we encounter an <b> or <a>
			mangaDesc = mangaDesc.replace(/<BR><BR>/g, " ");
			mangaDesc = mangaDesc.replace(/<BR>/g, "");
			mangaDesc = mangaDesc.split(/<b>|<a|<!/)[0];

			// Encountered this in "knight under my heart"
			// Removes the orginal text from mu description if its at the start of it.
			if (mangaDescriptionElement && mangaDesc.startsWith(mangaDescriptionElement.textContent)) {
				mangaDesc = mangaDesc.slice(mangaDescriptionElement.textContent.length);
			}

			if (mangaDesc.length <= 20) {
				mangaDesc = "";
			}

			if (mangaOtherNames.length > 0) {
				const seen = new Set();
				const cleanedOtherNames = [];

				// Just a simple clean so we dont need to store as much useless data
				// It would be better to return the values from addtoalttitle but there is an problem with when updating data so for now it will be like this
				// This still in example keeps some useless data in example if alttiles already has "Hey"
				for (const obj of mangaOtherNames) {
					const cleaned = obj.title
  						.normalize('NFD') // Removes those unique letters like ủ 
  						.replace(/[^\w]|_/g, '') // Removes all non word characters like !
  						.toLowerCase();


					if (!seen.has(cleaned)) {
						seen.add(cleaned);
						cleanedOtherNames.push(obj);
					}
				}

				addToAltTitles(cleanedOtherNames);
				entryJson.MU.mangaOtherNames = cleanedOtherNames.map(obj => obj.title);
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


			// Tags
			if (muTags || categories) {
				const tagsContainer = document.querySelector("section#entry.pure-g.EntryPage__content div.tags ul");
						
				let currentTagElements = Array.from(tagsContainer.querySelectorAll("li:not([class])"));
				const existingTagsText = currentTagElements.map(el => el.textContent.trim().toLowerCase());
			
				let lastTagElement = currentTagElements[currentTagElements.length - 1];
			
				const insertTag = (text, href, color, className) => {
					const tagElement = document.createElement('li');
					tagElement.classList.add(className);
				
					const link = document.createElement('a');
					link.textContent = text;
					link.style.color = color;
					if (href) {
						link.href = href;
						link.target = "_blank";
					}
					tagElement.appendChild(link);
				
					if (lastTagElement) {
						lastTagElement.insertAdjacentElement('afterend', tagElement);
					} else {
						tagsContainer.appendChild(tagElement);
					}
					lastTagElement = tagElement;
				};
			

				// MU Tags
				if (muTags) {

					// We making the json into array so we dont save useless data
					if (muTags[0]?.genre) {
						const genresArray = muTags.map(muTag => muTag.genre.trim());
						muTags = genresArray.filter(genre => {
							const genreClean = genre.toLowerCase();
							return !existingTagsText.some(existingTag => existingTag === genreClean);
						});
					}
				
					// If we updating the data and this found elements then we will skip the inserting of tags
					const existingMuTagElements = Array.from(tagsContainer.querySelectorAll("li.mu-tag"));
					if (existingMuTagElements.length === 0) {
						muTags.forEach(muTag => {
							// tagLink dosent work on everything but well its better than nothing ig
							const tagLink = muTag.toLowerCase().replace(/\s+/g, '-');
							insertTag(muTag, `/manga/tags/${tagLink}`, "#ff8c15", 'mu-tag');
						});
					}

					entryJson.MU.tags = muTags;
				}
			
				// Categories
				if (categories) {

					// Have to recalculate it again due to mutags adding more tags
					currentTagElements = [
						...Array.from(tagsContainer.querySelectorAll("li:not([class])")),
						...Array.from(tagsContainer.querySelectorAll("li.mu-tag"))
					];
				
					const combinedTagsText = currentTagElements.map(el => el.textContent.trim().toLowerCase());
				
					// Check for when we make the category into an array so that it dosent run this again. We making it an array so we dont need to store so much useless data
					if (categories[0]?.category !== undefined) {
						categories = categories
							// We sorting by most votes
							.sort((a, b) => b.votes - a.votes)
							.slice(0, 25 - currentTagElements.length)
							// We dont really care about those low vote ones so we just ignore those ones that have 10x less votes
							.filter((cat, _, arr) => arr[0].votes < (cat.votes === 0 ? 1 : cat.votes) * 10)
							.map(({ category }) => category.replace(/\//g, "").trim())
							.filter(category =>
								!combinedTagsText.some(existingTag => existingTag === category.toLowerCase())
							);
					}

					// If we updating the data and this found elements then we will skip the inserting of tags
					const existingCategoryElements = Array.from(tagsContainer.querySelectorAll("li.category-tag"));
					if (existingCategoryElements.length === 0) {
						categories.forEach(category => {
							insertTag(category, null, "#A7C7E7", 'category-tag');
						});
					}
			
					entryJson.MU.categories = categories;
				}
			}

			if (saveToEntries) {
				const formElement = document.querySelector('.md-3-5 > form');
				const entryId = formElement.getAttribute('data-id');
				const entryType = formElement.getAttribute('data-mode');

				document.dispatchEvent(new CustomEvent("updateEntries", { detail: { type: entryType, id: entryId, data: entryJson } }));

			}


			// Mu link to notes
			if (document.querySelector('div.notes a.mangaupdates-link')) return;

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

			const currentMuSynopsis = document.getElementById('mangaupdates-synopsis');
			if (currentMuSynopsis) {
				currentMuSynopsis.textContent === description;
				return;
			}

		    const divSynopsis = document.createElement('div');
		    divSynopsis.classList.add('synopsisManga');
			divSynopsis.id = "mangaupdates-synopsis";
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
			const mainTitle = document.querySelector('h1[itemprop="name"]').textContent.trim();

			// Removes all commas and whitespaces because earlier there were a lot of duplicates
			const normalize = str => str.replace(/[\s,]+/g, '').toLowerCase();

			const normalizedMain = normalize(mainTitle);
			const existingAltText = altTitles.textContent.trim();

			if (!existingAltText) {
				altTitles.appendChild(document.createTextNode('Alt titles: '));
			}

			const normalizedAltText = normalize(existingAltText.replace(/^Alt\s+titles?:\s*/, ''));

			if (otherNames.length >= 3) {
				altTitles.textContent = altTitles.textContent.replace('Alt title:', 'Alt titles:');
			}

			const seenTitles = new Set();

			// Retrieving only unique names
			otherNames = otherNames.filter(nameObj => {
				const normalizedTitle = normalize(nameObj.title);

				if ( normalizedTitle === normalizedMain ||
					normalizedAltText.includes(normalizedTitle) ||
					seenTitles.has(normalizedTitle) ) {

					return false;
				}
				seenTitles.add(normalizedTitle);
				// We making the comma into U+201A so that we can split the alt titles easily in cleaneralttitles.
				nameObj.title = nameObj.title.replace(/,/g, '\u201A');
				return true;
			});

			if (otherNames.length > 0) {
				const newTitles = otherNames.map(nameObj => nameObj.title.trim()).join(', ');
				let altText = altTitles.textContent.trim();

				if (altText.includes(":") && !altText.includes(": ")) {
					altText = altText.replace(":", ": ");
				}
				if (altText === "Alt titles:" || altText === "Alt title:") {
					altTitles.textContent = altText + " " + newTitles;
				} else {
					altTitles.textContent = altText + ", " + newTitles;
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


				const mangaInfo = {
					name: mangaName
				}
				
				// year
				const yearEle = document.querySelector('div#siteContainer div.pure-1.md-1-5 span.iconYear');
				if (yearEle) {
					// year ele should always start with the year if i am not wrong 
					mangaInfo.year = yearEle.textContent.trim().slice(0, 4);
				}

				// Type
				let currentTagElements = Array.from(document.querySelectorAll("section#entry.pure-g.EntryPage__content div.tags ul li:not([class])"));
				let hasManhuaOrManwha = currentTagElements.some(el => {
					let text = el.textContent.trim().toLowerCase();
					return text === "manhua" || text === "manwha";
				});

				mangaInfo.type = hasManhuaOrManwha ? null : "Manga";


				await getMangaInfo(mangaInfo);

				getDataBtn.disabled = false;
				getDataBtn.style.cursor = 'pointer';
			});

			// Show data
			if (entries[entryType]?.[entryId]?.MU) {
				getDataBtn.textContent = "Update data";

				const muData = entries[entryType][entryId].MU;
				muData.mangaOtherNames = (muData.mangaOtherNames ?? []).map(title => ({ title }));
				main(muData.mangaOtherNames, muData?.status, muData.categories, muData?.tags, muData?.url, muData.mangaDesc, muData.mangaPublications, muData.mangaStartYear);
			}
		})();
	}
})();