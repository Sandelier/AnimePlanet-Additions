

(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "filter/showFiltering.js" } }));

    document.getElementById('qaForm').style.setProperty('display', 'block', 'important');
})();