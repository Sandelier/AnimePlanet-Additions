

(function() {
    injectedScripts.push("stillLeft.js");


    tooltipData.forEach(item => {

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
        const currentCountEle = item.tooltip.querySelector('div.statusArea span').nextSibling;
        const currentCount = currentCountEle.textContent.replace(/[^0-9]/g, '');
        const stillLeft = totalAmounth - currentCount;


        if (stillLeft > 0) {
            item.tooltip.querySelector('div.statusArea span').nextSibling.textContent += ` (+${totalAmounth - currentCount})`;
        } else {
            item.tooltip.querySelector('div.statusArea span').parentElement.style.color = "#8DEA43";
        }
    });
})();