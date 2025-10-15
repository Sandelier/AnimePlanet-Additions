

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

        if (tooltips.length <= 0) { // for like /manga/top-manga url or invidual character page
            tooltips = document.querySelectorAll('tr > td > a.tooltip');
        }

        tooltips.forEach(tooltip => {
            let title = tooltip.getAttribute('title');
            const parser = new DOMParser();
            let parsedTitle = parser.parseFromString(title, 'text/html').body;

            // Will fail if you are hovering over an element before the script can run. 
            // in example when reloading or when parsing again.
            if (!parsedTitle.innerHTML) {
                const describedById = tooltip.getAttribute('aria-describedby');
                
                if (describedById) {
                    const tooltipIdElement = document.getElementById(describedById);
                    if (tooltipIdElement) {
                        const tooltipContent = tooltipIdElement.querySelector('.ui-tooltip-content');
                        parsedTitle = tooltipContent;
                    }
                }
            }
        
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




// tooltip has "aria.describedby" which has the id of the parsed title being hovered over