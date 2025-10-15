

(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "entry/stillLeft.js" } }));

    function addStillLeft() {
        const tooltipData = window.tooltipData;
        tooltipData.forEach(item => {

            if (item.tooltip.dataset.stillLeft === 'true') {
                return;
            }
            

            let totalEpisodes;
            let totalChapters;

            const episodeTextContent = item.parsedTitle.querySelector('ul.entryBar li.type');
            const chapterTextContent = item.parsedTitle.querySelector('.iconVol');

            // total episodes or chapters
            if (episodeTextContent) {
                totalEpisodes = episodeTextContent.textContent.replace(/[^0-9]/g, '');
            } else if (chapterTextContent) {
                const chapterMatch = chapterTextContent.textContent.match(/Ch:\s*(\d+)/);
                if (chapterMatch) {
                    totalChapters = chapterMatch[1];
                }
            }

            const totalAmounth = !totalEpisodes ? totalChapters : totalEpisodes;

            if (!item.tooltip.querySelector('div.statusArea span')) return;

            const currentCountEle = item.tooltip.querySelector('div.statusArea span').nextSibling;
            if (!currentCountEle) return;
            
            const currentCount = currentCountEle.textContent.replace(/[^0-9]/g, '');
            if (currentCount.length === 0) {
                return;
            }

            const stillLeft = totalAmounth - currentCount;


            if (stillLeft > 0) {
                item.tooltip.querySelector('div.statusArea span').nextSibling.textContent += ` (+${totalAmounth - currentCount})`;
            } else {
                const statusParent = item.tooltip.querySelector('div.statusArea span').parentElement;
                if (episodeTextContent?.textContent.includes('+') || chapterTextContent?.textContent.includes('+')) {
                    // Still publishing
                    statusParent.style.color = "#8DEA43";
                } else {
                    // Finished series (Sometimes you just forget to click the read btn :/)
                    statusParent.style.color = "#BF40BF";
                }
            }

            item.tooltip.dataset.stillLeft = 'true';
        });
    }

    document.addEventListener('newEntries', function() {
        addStillLeft();
    });

    addStillLeft();
})();