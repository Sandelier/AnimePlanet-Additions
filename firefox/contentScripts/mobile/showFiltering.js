

(function() {
    window.postMessage({ action: "injectedScript", name: "mobile/showFiltering.js" });
})();

document.getElementById('qaForm').style.setProperty('display', 'block', 'important');
