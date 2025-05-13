

(function() {

    if (!window.tooltipData) {
        window.tooltipData = [];
    }
    
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "helper/parseTooltips.js" } }));
    
    function parseTooltips(dispatch = false) {
        window.tooltipData = [];
        let tooltips = document.querySelectorAll('.card a');
    
        if (tooltips.length <= 0) {
            tooltips = document.querySelectorAll('h4 > a.tooltip');
        }
    
        tooltips.forEach(tooltip => {
            let title = tooltip.getAttribute('title');
            const parser = new DOMParser();
            const parsedTitle = parser.parseFromString(title, 'text/html').body;
        
            window.tooltipData.push({ tooltip: tooltip, parsedTitle: parsedTitle });
        });
    
        if (dispatch === true) {
            document.dispatchEvent(new Event('newEntries'));
        }
    }
    
    parseTooltips();

    document.addEventListener("parseTooltips", (event) => {
        parseTooltips(event.detail);
    });
})();