


(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "forum/clickableUsername.js" } }));

    
    const usernameElement = document.querySelector('.memberHeader-nameWrapper > span.username');
    
    usernameElement.style.cursor = "pointer";
    
    const username = usernameElement.textContent;
    const url = `https://www.anime-planet.com/users/${username}`;
    
    usernameElement.addEventListener('click', () => {
        window.open(url, '_blank');
    });

})();