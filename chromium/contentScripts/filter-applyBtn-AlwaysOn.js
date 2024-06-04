




(function() {

    const styleElement = document.createElement('style');
    
    styleElement.textContent = `
        .applyBtn-AlwaysOn {
            display: flex !important;
            height: auto !important;
            padding: 0.5em 1em !important;
        }
    `;
    
    document.head.appendChild(styleElement);
    
    document.querySelector('div.pillFilters').classList.add('applyBtn-AlwaysOn');

})();