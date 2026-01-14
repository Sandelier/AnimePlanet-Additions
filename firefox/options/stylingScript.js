

document.getElementById('nextVersion').textContent = `Version: ${browser.runtime.getManifest().version}`;


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
    const inVisualizer = visualizerStats.getBoundingClientRect().top < window.innerHeight;
    if (inVisualizer) {
        visualizerMain.scrollIntoView();
    } else {
        currentPage.scrollIntoView();
    }
});

let currentPage = homePage;
function handleScroll(deltaY, event) {


    const isOverflowing = el => el.scrollHeight > el.clientHeight;
    const isAtTop = el => el.scrollTop === 0;
    const isAtBottom = el => el.scrollTop + el.clientHeight >= el.scrollHeight;

    if (isOverflowing(visualizerStats) && 
        visualizerStats.contains(event.target) && 
        !(deltaY < 0 && 
        isAtTop(visualizerStats))) {
        return;
    }

    const featuresEditor = document.getElementById('featuresEditor');
    if (isOverflowing(featuresEditor) && featuresEditor.contains(event.target)) {
        return;
    }

    const scriptsContainer = document.getElementById('scripts-container');
    if (!isOverflowing(scriptsContainer) && 
        scriptsContainer.contains(event.target) && 
        scriptsContainer !== event.target) {
        return;
    }

    if (isOverflowing(scriptsContainer) && scriptsContainer.contains(event.target)) {

        const canScrollOut =
            (deltaY < 0 && isAtTop(scriptsContainer)) ||
            (deltaY > 0 && isAtBottom(scriptsContainer));

        if (!canScrollOut) {
            return;
        }
    }
    
    const rects = {
        home: homePage.getBoundingClientRect(),
        scripts: scriptsPage.getBoundingClientRect(),
        featuresEdit: featuresEditPage.getBoundingClientRect(),
        visMain: visualizerMain.getBoundingClientRect(),
        visStart: visualizerStart.getBoundingClientRect(),
        visStats: visualizerStats.getBoundingClientRect(),
    };

    const inViewportFromSide = rect => rect.x <= window.innerWidth / 1.5 && rect.top === 0; // For the pages that are on side of another page

    if (deltaY > 0) {
        if (inViewportFromSide(rects.featuresEdit)) {
            currentPage = scriptsPage;
        } else if (inViewportFromSide(rects.visStart)) {
            currentPage = visualizerMain;
        } else if (rects.home.top === 0) {
            currentPage = scriptsPage;
        } else if (rects.scripts.top === 0) {
            currentPage = visualizerMain;
        }
    } else {
        if (inViewportFromSide(rects.featuresEdit)) {
            currentPage = scriptsPage;
        } else if (inViewportFromSide(rects.visStart)) {
            currentPage = visualizerMain;
        } else if (rects.visStats.top === 0) {
            currentPage = visualizerMain;
        } else if (rects.visMain.top === 0) {
            currentPage = scriptsPage;
        } else if (rects.scripts.top === 0) {
            currentPage = homePage;
        }
    }

    if (currentPage) {
        currentPage.scrollIntoView({ behavior: 'smooth' });
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