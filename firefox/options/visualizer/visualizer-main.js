
	
(function(){
    const visualizerStartBtn = document.getElementById('visualizer-startBtn');
    const visualizerStart = document.getElementById('visualizerStart');

    visualizerStartBtn.addEventListener('click', (event) => {
        visualizerStart.scrollIntoView({ behavior: 'smooth' });
    });    


    // Visualizer start
    const usernameField = document.getElementById('visualizerStart-usernameField');
    const mangaBtn = document.getElementById('mangaType');
    const animeBtn = document.getElementById('animeType');
    const scrapeBtn = document.getElementById('scrapeBtn');

    function switchDataType(btn) {
        document.querySelectorAll('.dataTypeSelected').forEach(el => el.classList.remove('dataTypeSelected'));
        btn.classList.add('dataTypeSelected');
    }

    mangaBtn.addEventListener('click', function() {
        switchDataType(mangaBtn);
    });

    animeBtn.addEventListener('click', function() {
        switchDataType(animeBtn);
    });

    let stillScraping = false;

    scrapeBtn.addEventListener('click', function() {
        if (!stillScraping) {

            const selectedType = document.querySelector('.dataTypeSelected').textContent.trim().toLowerCase();


            const username = usernameField.value.trim();
            const usernameRegex = /^[a-zA-Z0-9]+$/; 
    
            if (!usernameRegex.test(username)) {
                alert('Username can only contain numbers and English alphabet characters (no spaces or special characters)');
                return;
            }
    
            console.log('Starting scraping for:', selectedType);
            console.log('Username:', username);

            scrapeBtn.classList.toggle('deactivatedBtn');
            stillScraping = true;
            browser.runtime.sendMessage({ action: "scrapeUser", requestType: "", value: {username: username, dataType: selectedType}});
        }
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "scrapedData") {
            stillScraping = false;
            scrapeBtn.classList.toggle('deactivatedBtn');

            const storageKey = `stats-${message.data.dataType}`;
            localStorage.setItem(storageKey, JSON.stringify(message.data));

            if (message.data.dataType === "manga") {
                mangaStatsBtn.classList.remove('deactivatedBtn');
                mangaStatsBtn.click();
            } else {
                animeStatsBtn.classList.remove('deactivatedBtn');
                animeStatsBtn.click();
            }
            
        } else if (message.action === "unknownUsername") {
            usernameField.value = "";
            stillScraping = false;
            scrapeBtn.classList.toggle('deactivatedBtn');
            alert('Username not found!');
        }
    });

    

    let animeStatsBtn = document.getElementById('visualizer-animeStatsBtn');
    let mangaStatsBtn = document.getElementById('visualizer-mangaStatsBtn');
    let visualizerStats = document.getElementById('visualizerStats');

    function activateButton(button, type) {
        if (localStorageData[`stats-${type}`]) {
            button.classList.remove('deactivatedBtn');
        }

        button.addEventListener('click', function() {
            if (!button.classList.contains('deactivatedBtn')) {
                visualizerStats.scrollIntoView({ behavior: "smooth" });

                let visualizerTopBottom = document.getElementById('visualizerStats-topBottom');
                let visualizerBottom = document.getElementById('visualizerStats-bottom');

                visualizerTopBottom.innerHTML = '';
                visualizerBottom.innerHTML = '';

                let stats = JSON.parse(localStorage.getItem(`stats-${type}`));

                let sourcesProcessed = processStatsData(stats.sources, { index: 1, limit: 10, bgColors: [] });
                let typesProcessed = processStatsData(stats.types, { index: 0, limit: 10, bgColors: [] });
                let tagsProcessed = processStatsData(stats.tags, { index: 2, limit: 20, bgColors: [] });

                makeBarChart(tagsProcessed, visualizerBottom);

                makeDoughnutChart(sourcesProcessed, visualizerTopBottom, "right");
                makeInstallmentImage(stats, visualizerTopBottom);
                makeDoughnutChart(typesProcessed, visualizerTopBottom, "left");

                visualizerStart.setAttribute('dataType', type);

                document.querySelector('#visualizerStats-header h1').textContent = `${stats.username}'s ${type} list`;
                document.querySelector('#visualizerStats-header p').textContent = `Data date: ${formatDate(stats.dataDate)}`;
            }
        });
    }

    function formatDate(rawDate) {
        const date = new Date(rawDate);

        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year}-${hours}.${minutes}`;  
    }

    activateButton(mangaStatsBtn, 'manga');
    activateButton(animeStatsBtn, 'anime');


    document.getElementById('exportJsonDataBtn').addEventListener('click', function() {
        let dataType = visualizerStart.getAttribute('dataType');
        
        const data = JSON.stringify(JSON.parse(localStorage[`stats-${dataType}`]), null, 2);
        
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
    
        const link = document.createElement('a');
        link.download = `ap-visualizer-export-${dataType}-.json`;
        link.href = url;
    
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

}())