
if (chrome){
    chrome.runtime.openOptionsPage();
} else {
    browser.runtime.openOptionsPage();
}
window.close();