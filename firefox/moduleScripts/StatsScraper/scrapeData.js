


// Content script

(function() {
    var browser = browser || chrome;
    
    const url = window.location.href;
    const parts = url.split('/');
    let dataType = parts[parts.length - 1].split('?')[0];
    
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
            
                const yearElement = tooltipDoc.querySelector('.iconYear');
                const tagsElements = tooltipDoc.querySelectorAll('.tags li');
            
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
                            }
                            break;
                        }
                    }
                }
            
                if (!installment) {
                    return;
                }
            
                if (dataType === "manga" && installment.toLowerCase().includes('one')) {
                    installment = "1 chs";
                }
            
                let isChapter = false;
                if (installment && dataType === "manga") {
                    const numbers = installment.match(/\d+/g);
                    let chapters = 0;
                
                    if (installment.includes('Vol:') && installment.includes('Ch:')) {
                        chapters = parseInt(numbers[1]);
                        isChapter = true;
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
                const tags = Array.from(tagsElements).map(tag => tag.textContent.trim());
            
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
                };
            
                jsonData.push(jsonObject);
            });
        
            let username = document.querySelector('h1#profileName').textContent.trim();
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
          const data = await extractDataFromPage();
          sendMessageToBackground({ action: "sendData", data: data });
        } catch (error) {
          console.error("Error extracting or sending data:", error);
        }
    }
    
    processAndSendData();

})();