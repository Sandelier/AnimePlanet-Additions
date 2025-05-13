
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('wheel', (event) => {
    handleScroll(event.deltaY, event);
});

document.addEventListener('touchstart', (event) => {
    touchStartY = event.touches[0].clientY;
});

document.addEventListener('touchmove', (event) => {
    touchEndY = event.touches[0].clientY;
});

document.addEventListener('touchend', (event) => {
    const deltaY = touchStartY - touchEndY;
    handleScroll(deltaY, event);
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
const featuresEditPage = document.getElementById('featuresEditPage');
homePage.scrollIntoView();

window.addEventListener('resize', () => {
    if (!isMobile()) {
        homePage.scrollIntoView();
    }
});
function handleScroll(deltaY, event) {


    const visualizerTopBottom = document.getElementById('visualizerStats-topBottom');
    const isVisualizerOverflowing = visualizerTopBottom.scrollHeight > visualizerTopBottom.clientHeight;
    if (isVisualizerOverflowing && visualizerTopBottom.contains(event.target)) {
        const atTopScrollingUp = deltaY < 0 && visualizerTopBottom.scrollTop === 0;

        if (!atTopScrollingUp) {
            return;
        }
    }

    const featuresEditor = document.getElementById('featuresEditor');
    const isfeaturesEditorOverflowing = featuresEditor.scrollHeight > featuresEditor.clientHeight;
    if (isfeaturesEditorOverflowing && featuresEditor.contains(event.target)) {
        return;
    }

    const scriptsContainer = document.getElementById('scripts-container');
    const isOverflowing = scriptsContainer.scrollHeight > scriptsContainer.clientHeight;
    if (!isOverflowing && scriptsContainer.contains(event.target) && scriptsContainer != event.target) {
        return;
    }

    if (isOverflowing && scriptsContainer.contains(event.target)) {
        const atTopScrollingUp = deltaY < 0 && scriptsContainer.scrollTop === 0;
        const atBottomScrollingDown = deltaY > 0 && scriptsContainer.scrollTop + scriptsContainer.clientHeight >= scriptsContainer.scrollHeight;

        if (!atTopScrollingUp && !atBottomScrollingDown) {
            return;
        }
    }

    const scriptsRect = scriptsPage.getBoundingClientRect();
    const featuresEditRect = featuresEditPage.getBoundingClientRect();
    const visualizerMainRect = visualizerMain.getBoundingClientRect();
    const visualizerStartRect = visualizerStart.getBoundingClientRect();
    const visualizerStatsRect = visualizerStats.getBoundingClientRect();

    if (deltaY > 0) {
        if (featuresEditRect.x <= (window.innerWidth / 1.5) && featuresEditRect.top === 0) {
            scriptsPage.scrollIntoView({ behavior: 'smooth' });
        } else if (visualizerStartRect.x <= (window.innerWidth / 1.5) && visualizerStartRect.top === 0) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        } else if (homePage.getBoundingClientRect().top === 0) {
            scriptsPage.scrollIntoView({ behavior: 'smooth' });
        } else if (scriptsRect.top === 0) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        }
    } else {

        if (featuresEditRect.x <= (window.innerWidth / 1.5) && featuresEditRect.top === 0) {
            scriptsPage.scrollIntoView({ behavior: 'smooth' });
        } else if (visualizerStartRect.x <= (window.innerWidth / 1.5) && visualizerStartRect.top === 0) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        } else if (visualizerStatsRect.top === 0) {
            visualizerMain.scrollIntoView({ behavior: 'smooth' });
        } else if (visualizerMainRect.top === 0) {
            scriptsPage.scrollIntoView({ behavior: 'smooth' });
        } else if (scriptsRect.top === 0) {
            homePage.scrollIntoView({ behavior: 'smooth' });
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