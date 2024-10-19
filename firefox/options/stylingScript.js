let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('wheel', (event) => {
    handleScroll(event.deltaY);
});

document.addEventListener('touchstart', (event) => {
    touchStartY = event.touches[0].clientY;
});

document.addEventListener('touchmove', (event) => {
    touchEndY = event.touches[0].clientY;
});

document.addEventListener('touchend', () => {
    const deltaY = touchStartY - touchEndY;
    handleScroll(deltaY);
});

const scriptsPage = document.getElementById('scriptsPage');
const visualizerMain = document.getElementById('visualizerMain');
const homePage = document.getElementById('homePage');
const visualizerStats = document.getElementById('visualizerStats');
const visualizerStart = document.getElementById('visualizerStart');
homePage.scrollIntoView();

window.addEventListener('resize', (event) => {
    homePage.scrollIntoView();
});

function handleScroll(deltaY) {
    const scriptsContainer = document.getElementById('scripts-container');
    if (scriptsContainer.contains(event.target) && scriptsContainer != event.target) {
        return;
    }

    // Gonna rethink the logic later so for now its this quick and bad code :p

    if (deltaY > 0) {
        if (homePage.getBoundingClientRect().top === 0) {
            scriptsPage.scrollIntoView({ behavior: 'smooth' });
        } else if (scriptsPage.getBoundingClientRect().top === 0) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        if (visualizerStart.getBoundingClientRect().x <= (window.innerWidth/1.5)) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        } else if (visualizerMain.getBoundingClientRect().top === 0) {
            scriptsPage.scrollIntoView({ behavior: 'smooth' });
        } else if (scriptsPage.getBoundingClientRect().top === 0) {
            homePage.scrollIntoView({ behavior: 'smooth' });
        } else if (visualizerStats.getBoundingClientRect().top === 0) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        }
    }
}




document.getElementById('featuresBtn').addEventListener('click', (event) => {
    scriptsPage.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('visualizerBtn').addEventListener('click', (event) => {
    visualizerPage.scrollIntoView({ behavior: 'smooth' });
});
