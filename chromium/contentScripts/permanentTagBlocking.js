


// https://www.anime-planet.com/forum/threads/request-permanent-tag-blocking-for-recommendations-and-search.349188/
// devilinhumanform asked for permanent tag blocking and this one sounds very good minor inconvinience that i had to fix since its an issue that everyone has.
// https://www.anime-planet.com/forum/members/devilinhumanform.3619667/


(function() {
    function removeEntriesBasedOnTags(disallowedTags) {

        if (disallowedTags.size <= 0) {
            console.log("disallowedTags length 0");
            return;
        }

        const listPage = !!document.querySelector('tbody > tr'); 

        let removedTags = 0;
        tooltipData.forEach(data => {
            const { tooltip, parsedTitle } = data;
            const tagElements = parsedTitle.querySelectorAll('.tags ul li');

            for (const li of tagElements) {

                if (disallowedTags.has(li.textContent)) {

                    if (listPage) {
                        tooltip.parentElement.parentElement.parentElement.remove();
                    } else {
                        tooltip.parentElement.remove();
                    }

                    removedTags++;
                    break;
                }
            }
        });

        console.log(`Removed ${removedTags} entries based on tags.`);

        parseTooltips();
    }


    // new entries event is from load-extrapages.js script
    document.addEventListener('newEntries', function() {
        removeEntriesBasedOnTags(disallowedtags);
    });
            


    let disallowedtags;

    
    browser.runtime.sendMessage({ action: 'getLocalStorageValue', requestType: 'disallowedTags' }).then((response) => {
        if (response && response.value) {
            disallowedtags = new Set(JSON.parse(response.value));
            removeEntriesBasedOnTags(disallowedtags);
        } else {
            console.log('Failed to retrieve disallowed tags');
        }
    }).catch(error => {
        console.error('Error fetching disallowed tags:', error);
    });

})();