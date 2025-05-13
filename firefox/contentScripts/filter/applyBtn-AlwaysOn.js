




(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "filter/applyBtn-AlwaysOn.js" } }));


    const styleElement = document.createElement('style');
    
    styleElement.textContent = `
        .applyBtn-AlwaysOn {
            display: block !important;
            height: auto !important;
        }
    `;
    
    document.head.appendChild(styleElement);
    
    document.querySelector('div.pillFilters').classList.add('applyBtn-AlwaysOn');
})();