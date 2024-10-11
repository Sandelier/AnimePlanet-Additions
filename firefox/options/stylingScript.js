
document.addEventListener('wheel', (event) => {

    console.log(event.target);
    const scriptsPage = document.getElementById('scriptsPage');
    const homePage = document.getElementById('homePage');
    const scriptsContainer = document.getElementById('scripts-container');


    if (scriptsContainer.contains(event.target)) {
        return;
    }

    if (event.deltaY > 0) {
        scriptsPage.scrollIntoView({ behavior: 'smooth' });
    } else {
        homePage.scrollIntoView({ behavior: 'smooth' });
    }
});