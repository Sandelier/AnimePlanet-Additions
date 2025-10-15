// Noticed while working on update 2.0.3 that animeplanet has removed the hidden tags from script[type="application/ld+json"]
// I was expecting for it to be removed at some point since it probably affects the ads
// Think probably i was the reason it was noticed since i did send an message to them about this.


(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "entry/showHiddenTags.js" } }));

    if (document.querySelector('div#siteContainer section.pure-g.entryBar')) {
        // Maybe they forgot to remove the content warning tags from here but well it gives us easy access to them :p
        const entryDataEle = document.querySelector('script[type="application/ld+json"]');
        if (entryDataEle) {
            try {
                const entryData = JSON.parse(entryDataEle.textContent);
                const entryGenres = entryData.genre;


                let contentWarningElement = document.querySelector('section#entry.pure-g.EntryPage__content div.tags.tags--plain');

                // hidden tag array
                // Maybe missing some tags since well i couldnt immediately find anywhere where they say what excatly is considered mature
                const hiddenTags = ["Violence", "Explicit Sex", "Explicit Violence", "Domestic Abuse", "Emotional Abuse", "Incest", "Nudity", "Smut", "Sexual Abuse", "Sexual Content", "Self-Harm", "Suicide", "Bullying", "Mature Themes", "Cannibalism", "Animal Abuse", "Physical Abuse"];
                const hasHiddenTag = entryGenres.some(genre => hiddenTags.includes(genre));

                if (hasHiddenTag) {
                    // If user is not logged in then content warning wont be in the dom
                    if (!contentWarningElement) {
                        contentWarningElement = document.createElement('div');
                        contentWarningElement.classList.add('tags');

                        const contentWarningText = document.createElement('h4');
                        contentWarningText.textContent = "Content Warning";
                        contentWarningElement.appendChild(contentWarningText);

                        const tagsContainer = document.querySelector('section#entry.pure-g.EntryPage__content div.tags');
                        tagsContainer.insertAdjacentElement('afterend', contentWarningElement);
                    } else {
                        contentWarningElement.classList.remove('tags--plain');
                        contentWarningElement.querySelector('a').remove();
                    }

                    // tag creation
                    entryGenres.forEach(genre => {
                        if (hiddenTags.includes(genre)) {
                            const tagEle = document.createElement('li');
                            const tagName = document.createElement('a');
                            tagName.textContent = genre;

                            // tag link
                            let currentUrl = window.location.href;
                            let baseUrl = currentUrl.replace(/\/[^/]+$/, '');
                            let tagUrl = baseUrl + "/tags/" + genre.toLowerCase().replace(/\s+/g, '-');
                            tagName.setAttribute('href', tagUrl);
                            
                            tagEle.appendChild(tagName);
                            contentWarningElement.appendChild(tagEle);
                        }
                    });
                }



            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        }
    }
})();