
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

function isMobile() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];
    
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

const scriptsPage = document.getElementById('scriptsPage');
const visualizerMain = document.getElementById('visualizerMain');
const homePage = document.getElementById('homePage');
const visualizerStats = document.getElementById('visualizerStats');
const visualizerStart = document.getElementById('visualizerStart');
homePage.scrollIntoView();

window.addEventListener('resize', (event) => {
    if (!isMobile()) {
        homePage.scrollIntoView();
    }
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
        if (!isMobile() && visualizerStart.getBoundingClientRect().x <= (window.innerWidth/1.5)) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        } else if (visualizerMain.getBoundingClientRect().top === 0) {
            scriptsPage.scrollIntoView({ behavior: 'smooth' });
        } else if (scriptsPage.getBoundingClientRect().top === 0) {
            homePage.scrollIntoView({ behavior: 'smooth' });
        } else if (!isMobile() &&visualizerStats.getBoundingClientRect().top === 0) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        }
    }
}


document.getElementById('featuresBtn').addEventListener('click', (event) => {
    scriptsPage.scrollIntoView({ behavior: 'smooth' });
});

const visualizerBtn = document.getElementById('visualizerBtn');

visualizerBtn.addEventListener('click', (event) => {
    if (!visualizerBtn.classList.contains('deactivatedBtn')) {
        visualizerPage.scrollIntoView({ behavior: 'smooth' });
    }
});


if (isMobile()) {
    document.getElementById('visualizerPage').remove();
    visualizerBtn.classList.add('deactivatedBtn');
    visualizerStats.remove();
    visualizerStart.remove();
    visualizerMain.remove();
}