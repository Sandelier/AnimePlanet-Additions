



(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "other/sortRandom.js" } }));



    const sortMenu = document.querySelector('div.sortFilter select');
    const randomBtn = document.createElement('option');

    randomBtn.value = "random";
    randomBtn.textContent = "Random"
    
    sortMenu.appendChild(randomBtn);

    if (window.location.href.endsWith("sort=random")) {
        randomBtn.selected = true;
    }
})();