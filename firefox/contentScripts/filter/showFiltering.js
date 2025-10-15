

(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "filter/showFiltering.js" } }));


    // We can't set the display block as an inline since it gets set to none later on which overrides ours

    const style = document.createElement('style');
    style.textContent = `
        .showFiltering {
            display: block !important;
        }
    `;

    document.head.appendChild(style);
    document.getElementById('qaForm').classList.add('showFiltering');
})();