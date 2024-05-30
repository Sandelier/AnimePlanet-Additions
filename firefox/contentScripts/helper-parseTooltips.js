



let tooltipData = [];

function parseTooltips(dispatch = false) {
    tooltipData = [];
    let tooltips = document.querySelectorAll('.card a');

    // Lists have different structure.
    if (tooltips.length <= 0) {
        tooltips = document.querySelectorAll('h4 > a.tooltip');
    }

    tooltips.forEach(tooltip => {
        let title = tooltip.getAttribute('title');
        const parser = new DOMParser();
        const parsedTitle = parser.parseFromString(title, 'text/html').body;

        tooltipData.push({ tooltip: tooltip, parsedTitle: parsedTitle });
    });

    // Useful for like permanent tag blocking so it can remove the entries again.
    if (dispatch === true) {
        document.dispatchEvent(new Event('newEntries'));
    }
}

parseTooltips();