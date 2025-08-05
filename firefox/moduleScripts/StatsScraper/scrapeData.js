


// Content script

(function() {
    var browser = browser || chrome;
    
    const url = window.location.href;
    const parts = url.split('/');
    let dataType = parts[parts.length - 1].split('?')[0];
    const username = document.querySelector('h1#profileName').textContent.trim();
    
    async function extractDataFromPage() {
    
            const tooltipElements = document.querySelectorAll('li.card');
            const jsonData = [];
    
            let joinedDate = '';
    
            const liElements = document.querySelectorAll(".userStats > li");
            const joinedElement = Array.from(liElements).find(li => li.textContent.includes('Joined'));
                
            if (joinedElement) {
                joinedDate = joinedElement.textContent.trim().replace('Joined ', '');
            }
        
            tooltipElements.forEach((element) => {
                const title = element.querySelector('a.tooltip')?.getAttribute('title');
                const tooltipDoc = new DOMParser().parseFromString(title, 'text/html');

                const entryName = tooltipDoc.querySelector('h5').textContent;
            
                const yearElement = tooltipDoc.querySelector('.iconYear');
                const tagsElements = tooltipDoc.querySelectorAll('.tags li');

                const tags = Array.from(tagsElements).map(tag => tag.textContent.trim());
                let novelTags = [ "Light Novels", "Web Novels", "Chinese Novels", "Korean Novels", "Novels" ];
                const isNovel = tags.some(tag => novelTags.includes(tag));
            
                let chaptersElement;
                if (dataType === "anime") {
                    chaptersElement = tooltipDoc.querySelector('.type');
                } else {
                    chaptersElement = tooltipDoc.querySelector('.iconVol');
                }
            
                const serializerElement = chaptersElement?.nextElementSibling?.getAttribute('class') ? null : chaptersElement?.nextElementSibling?.textContent.trim();
                const rating = tooltipDoc.querySelector('.entryBar .ttRating')?.textContent.trim();
                const userRating = tooltipDoc.querySelector('.myListBar .ttRating')?.textContent.trim();
            
                const status1Element = tooltipDoc.querySelector('.myListBar .status1');
                let installment;
                let type;
            
                if (status1Element) {
                    if (dataType === "anime") {
                        const typeAndEp = chaptersElement?.textContent || '';
                        const regex = /(\d+)\s*(?:eps|ep|episodes?)/i;
                        const match = regex.exec(typeAndEp);
                        installment = match ? parseInt(match[1], 10) : null;
                        type = typeAndEp.split('(')[0].trim();
                    } else {
                        installment = chaptersElement?.textContent.trim();
                    }
                } else {
                    const statusElements = ['status2', 'status5', 'status3'];
                    for (const status of statusElements) {
                        const statusElement = tooltipDoc.querySelector(`.myListBar .${status}`);
                        if (statusElement) {
                            installment = Array.from(statusElement.parentNode.childNodes)
                                .filter(node => node.nodeType === Node.TEXT_NODE)
                                .map(node => node.textContent.trim())
                                .join('')
                                .split(' - ')[1];
                        
                            if (dataType === "anime" && installment) {
                                installment = installment.split("/")[0];

                                const typeAndEp = chaptersElement?.textContent || '';
                                type = typeAndEp.split('(')[0].trim();
                            }
                            break;
                        }
                    }
                }
            
                if (!installment) {
                    return;
                }
            
                // case for one shots
                if (dataType === "manga" && installment.toLowerCase().includes('one')) {
                    installment = "1 chs";
                }
            
                let isChapter = false;
                if (installment && dataType === "manga") {
                    const numbers = installment.match(/\d+/g);
                    let chapters = 0;
                
                    if (installment.includes('Vol:') && installment.includes('Ch:')) {
                        const index = isNovel ? 0 : 1
                        chapters = parseInt(numbers[index]);
                        isChapter = !isNovel;
                    } else if (installment.includes('chs')) {
                        chapters = parseInt(numbers[0]);
                        isChapter = true;
                    } else if (installment.includes('vols')) {
                        chapters = parseInt(numbers[0]);
                        isChapter = false;
                    } else if (installment.includes('Vol:')) {
                        chapters = parseInt(numbers[0]);
                        isChapter = false;
                    } else if (installment.includes('Ch:')) {
                        chapters = parseInt(numbers[0]);
                        isChapter = true;
                    }
                
                    installment = chapters.toString();
                } else if (dataType === "anime") {
                    isChapter = true;
                }
            
                const year = yearElement?.textContent.trim().split(' - ')[0] || '';

                // If user has marked an manga by only updating the volume instead of ch
                // So we try to math the chapters out of volumes
                if (
                    !isChapter &&
                    chaptersElement.textContent.includes("Vol") &&
                    chaptersElement.textContent.includes("Ch") &&
                    !isNovel
                ) {
                    const match = chaptersElement.textContent.match(/Vol:\s*(\d+)\+?;\s*Ch:\s*(\d+)\+?/i);
                    if (match) {
                        const volume = parseInt(match[1], 10);
                        const chapter = parseInt(match[2], 10);

                        installment = Math.round((chapter / volume) * installment);
                        isChapter = true;
                    }
                }
            
                const statusElement = tooltipDoc.querySelector('.myListBar [class*=status]');
                const status = statusElement ? Array.from(statusElement.classList).find(className => className.includes('status')) : undefined;
            
                const jsonObject = {
                    year: year || undefined,
                    tags: tags.length > 0 ? tags : undefined,
                    serializer: serializerElement || undefined,
                    rating: rating || undefined,
                    userRating: userRating || undefined,
                    status: status || undefined,
                    installment: installment || undefined,
                    isChapter: isChapter,
                    type: type || undefined,
                    entryName: entryName
                };
            
                jsonData.push(jsonObject);
            });
        
            let userImg = document.querySelector('img#user-avatar').src;
        
            jsonData.unshift({ joinedDate, dataType, username, userImg });
        
            return jsonData;
    }
    
    function sendMessageToBackground(messageData) {
        browser.runtime.sendMessage(messageData)
          .then(response => {
            if (response.action === "nextPage") {
                try {
                
                    let liEle = document.querySelector('ul.nav li.selected')?.nextSibling;
                
                    if (liEle) {
                        let nextPageEle = liEle.querySelector('a');
                    
                        if (nextPageEle && !nextPageEle.classList.contains('next')) {
                            nextPageEle.href = `${nextPageEle.href}&dontInjectScripts`;
                            nextPageEle.click();
                        } else {
                            sendMessageToBackground({ action: "stop" });
                        }
                    } else {
                        sendMessageToBackground({ action: "stop" });
                    }
                    
                } catch (error) {
                    console.log(error);
                }
            } else {
                console.log(response);
            }
          })
          .catch(error => {
            console.error("Error sending message:", error);
          });
    }
    
    async function processAndSendData() {
    
        if (!url.includes('dontInjectScripts')) {
            return;
        }

        try {

            // Sends the user token to scrapingMain.js so we can get the backup data while its scraping.
            const urlObj = new URL(url);
            const page = urlObj.searchParams.get("page");
            // For the first page there wont be page param
            if (page === null) {



                const loggedInName = document.querySelector('div#siteUser div.loggedIn a')?.title || '';
                const url = window.location.href;

                const wrappedTitle = `/${loggedInName}/`;
                // We can only retrieve our own backup data so we checking if the page is our own page
                if (loggedInName && url.includes(wrappedTitle)) {

                    const slicedTitle = url.slice(url.indexOf(wrappedTitle) + wrappedTitle.length);
                    const type = slicedTitle.startsWith("manga") ? "manga" : "anime";


                    const siteContainer = document.querySelector('#siteContainer');
                    const scripts = siteContainer.querySelectorAll('script:not([src])');
                    for (const script of scripts) {
                      const scriptContent = script.textContent.trim();
                      // script always starts with "var TOKEN = '" and ends with "';"
                      const token = scriptContent.slice(13, scriptContent.length - 2);

                      sendMessageToBackground({ action: "userToken", token: token, type: type });
                      break;
                    }
                }
            }

            // Start scraping
            const data = await extractDataFromPage();
            sendMessageToBackground({ action: "sendData", data: data });
        } catch (error) {
            console.error("Error extracting or sending data:", error);
        }
    }


    

    // Maybe making the scraping logic into an iframe would be better.
    // So basically instead of clicking the next btn we would be loading the next page on iframes.
    // Overlay
    (function() {

        const style = document.createElement('style');
        style.textContent = `
        #scrape-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            cursor: not-allowed;
        }
        
        #scrape-overlay-top {
            font-size: 2em;
            margin-bottom: 20px;
        }  
        
        #scrape-overlay-progress {
            font-size: 1.5em;
            margin-bottom: 40px;
        }  
        
        #scrape-overlay-warning {
            position: absolute;
            bottom: 30px;
            font-size: 1em;
            opacity: 0.9;
        }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = 'scrape-overlay';

        // Top text
        const topText = document.createElement('div');
        topText.textContent = `Scraping ${username}'s ${dataType} list`;
        topText.id = 'scrape-overlay-top';
        
        // Progress text
        const progressText = document.createElement('div');
        if (document.querySelector('ul.nav li')) {

            const currentPage = parseInt(document.querySelector('ul.nav li.selected').textContent);
            const lastPage = document.querySelector('ul.nav li:nth-last-child(2)').textContent;

            progressText.textContent = `${currentPage}/${lastPage}`;
            progressText.id = 'scrape-overlay-progress';
        }

        // Warning text
        const warningText = document.createElement('div');
        warningText.textContent = "Don't close or click in the window";
        warningText.id = 'scrape-overlay-warning';

        overlay.appendChild(topText);
        overlay.appendChild(progressText);
        overlay.appendChild(warningText);

        document.body.style.overflow = 'hidden';
        document.body.appendChild(overlay);

    })();



    processAndSendData();

})();