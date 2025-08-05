
	
(function(){
    const visualizerStartBtn = document.getElementById('visualizer-startBtn');
    const visualizerStart = document.getElementById('visualizerStart');

    if (visualizerStart) {
        visualizerStartBtn.addEventListener('click', (event) => {
            visualizerStart.scrollIntoView({ behavior: 'smooth' });
        });    
    
    
        // Visualizer start
        const usernameField = document.getElementById('visualizerStart-usernameField');
        const mangaBtn = document.getElementById('mangaType');
        const animeBtn = document.getElementById('animeType');
        const scrapeBtn = document.getElementById('scrapeBtn');
    
        function switchDataType(btn) {
            visualizerStart.querySelectorAll('.dataTypeSelected').forEach(el => el.classList.remove('dataTypeSelected'));
            btn.classList.add('dataTypeSelected');
        }
    
        mangaBtn.addEventListener('click', function() {
            switchDataType(mangaBtn);
        });
    
        animeBtn.addEventListener('click', function() {
            switchDataType(animeBtn);
        });
    
        let stillScraping = false;
    
        scrapeBtn.addEventListener('click', async function() {
            if (isMobile() && browserType && browserType != "chrome") {

                const granted = await browser.permissions.request({
                    permissions: ['webRequest', 'webRequestBlocking']
                });
                
                if (!granted) {
                  alert("Permissions are required to enable this feature.");
                  return false;
                }
            }

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
                browser.storage.local.set({ [storageKey]: JSON.stringify(message.data) });
    
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

        const totalEntriesEl = document.getElementById("visualizer-totalEntries");
        const installmentsEl = document.getElementById("visualizer-installments");
        const perDayEl = document.getElementById("visualizer-perDay");
        const timeSpentEl = document.getElementById("visualizer-timeSpent");
        const volumesEl = document.getElementById("visualizer-volumes");

        const limiterElement = document.getElementById("visualizerStats-limiter")

        // Limiter up and down logic
        document.querySelectorAll('.limiter-arrows button').forEach(button => {
            button.addEventListener('click', () => {
                if (limiterElement.readOnly) return;

                let currentValue = parseInt(limiterElement.value);
                const max = parseInt(limiterElement.max);
                if (isNaN(currentValue)) return;
            
                const isUp = button.classList.contains('limiter-up');
                if (isUp && currentValue < max) {
                    limiterElement.value = currentValue + 1;
                } else if (!isUp && currentValue > 1) {
                    limiterElement.value = currentValue - 1;
                }

                limiterElement.dispatchEvent(new Event('input'));
            });
        });


        let currentStats;
        let currentType;
        // Making new chart when user changes the limit
		function handleLimiter(e) {
			if (!currentStats || !currentType) return;

			const selectedButton = document.querySelector('#chartButtons button.dataTypeSelected');
			if (!selectedButton) return;

			const selectedChart = selectedButton.getAttribute('data-chart');
			const visualizerCenter = document.getElementById('visualizerStats-center');
			const chartContainer = document.querySelector(`#visualizerStats-center [chart-type="${selectedChart}"]`);
			if (!chartContainer) return;

			e.target.value = e.target.value.replace(/\D/g, '');

			let newLimit = parseInt(e.target.value);
            // Limits the size of the value that input can be since it would be useless to show 10 if we only have 5
			const maxLimit = parseInt(chartContainer.getAttribute('maxLimit'));
			if (isNaN(newLimit) || newLimit < 1) return;
			if (newLimit > maxLimit) {
				newLimit = maxLimit;
				e.target.value = maxLimit;
			}

			chartContainer.remove();

            // Currently only stackedchart uses limiter but if more use then we can do like an switch case for selected chart
            let processedData = processStatsData(currentStats[selectedChart], { index: 2, limit: currentStats[selectedChart].length, bgColors: [] }, 1);
            makeStackedBarChart(selectedChart, processedData, visualizerCenter, newLimit);

            // Chartcontainer gets created again in the previous switch statement
			const newChart = document.querySelector(`#visualizerStats-center [chart-type="${selectedChart}"]`);
			if (newChart) {
				newChart.style.visibility = 'visible';
				newChart.style.position = '';
			}
		}

        // Chart btn switch logic
		function handleChartBtns(e) {
			const target = e.target.closest('button[data-chart]');
			if (!target || !currentStats || document.getElementById('visualizerStart').getAttribute("datatype") !== currentType) return;

            if (target.classList.contains('deactivatedBtn')) return;

            // removing the class from previous target
			const previousSelected = e.currentTarget.querySelector('button.dataTypeSelected');
			if (previousSelected && previousSelected !== target) {
				previousSelected.classList.remove('dataTypeSelected');
			}

			target.classList.add('dataTypeSelected');
			const selectedChart = target.getAttribute('data-chart');
			const chartContainers = document.querySelectorAll('#visualizerStats-center [chart-type]');
			const limiterElement = document.getElementById('visualizerStats-limiter');

            // Hiding / showing charts
			chartContainers.forEach(container => {
				const isVisible = container.getAttribute('chart-type') === selectedChart;
				container.style.visibility = isVisible ? 'visible' : 'hidden';
				container.style.position = isVisible ? '' : 'absolute';

				if (isVisible) {
					limiterElement.value = container.getAttribute('currentLimit');
					limiterElement.setAttribute("max", container.getAttribute("maxLimit"));

					limiterElement.parentElement.style.display = 
                        container.getAttribute("maxLimit") == "hide" ? "none" : "inline-flex";


					document.getElementById('visualizerStats-searchBar-container').style.display =
						container.getAttribute("searchBar") === "true" ? "inline-block" : "none";
				}
			});
		}

        // Defining them outside since well if we do define it in activatebtn it would add multiple listeners.
		document.getElementById('chartButtons').addEventListener('click', handleChartBtns);
		document.getElementById('visualizerStats-limiter').addEventListener('input', handleLimiter);

    
        // Shows the manga/anime statistics
        function activateButton(button, type) {
            browser.storage.local.get([`stats-${type}`], (result) => {
                if (result[`stats-${type}`]) {
                    button.classList.remove('deactivatedBtn');
                }
            });
    
            button.addEventListener('click', function() {
                if (!button.classList.contains('deactivatedBtn')) {
                    visualizerStats.scrollIntoView({ behavior: "smooth" });
    
                    let visualizerCenter = document.getElementById('visualizerStats-center');
    
                    [...visualizerCenter.children].forEach(el => {
                        if (el.hasAttribute('dontRemove')) {
                            el.style.position = 'absolute';
                            el.style.visibility = 'hidden';
                        } else {
                            el.remove();
                        }
                    });
    
                    browser.storage.local.get([`stats-${type}`], (result) => {
                        let stats = JSON.parse(result[`stats-${type}`]);

                        console.log(stats);

                        limiterElement.parentElement.style.display = "inline-flex"; // Otherwise when its hidden and we generate new charts the charts will be cut off

                        // Making data for charts. splices and sorts them and generates bgcolors
                        let sourcesProcessed = processStatsData(stats.sources, { index: 1, limit: 10, bgColors: [] });
                        let typesProcessed = processStatsData(stats.types, { index: 0, limit: 10, bgColors: [] });

                        let yearsProcessed = processStatsData(stats.years, { index: 2, limit: stats.years.length, bgColors: [] }, 1);
                        let tagsProcessed = processStatsData(stats.tags, { index: 2, limit: stats.tags.length, bgColors: [] }, 1)
                        let serializersProcessed = processStatsData(stats.serializers, { index: 2, limit: stats.serializers.length, bgColors: [] }, 1);        

                        // Status modification to make it more readable for user
                        const baseStatusMap = {
                            status1: "read",
                            status2: "reading",
                            status3: "dropped",
                            status5: "stalled",
                        };

                        function adaptStatus(statusValue) {
                            if (type === "anime") {
                                return statusValue === "read" ? "watched" : statusValue.replace(/read/g, "watch");
                            }
                            return statusValue;
                        }

                        let modifiedStatuses = stats.statuses.map(item => ({
                            ...item,
                            status: adaptStatus(baseStatusMap[item.status] || item.status)
                        }));

                        stats.statuses = modifiedStatuses;

                        let statusesProcessed = processStatsData(modifiedStatuses, { index: 1, limit: 4, bgColors: []});

                        // Chart creation
                        makeDoughnutChart("statuses", statusesProcessed, visualizerCenter);
                        makeDoughnutChart("sources", sourcesProcessed, visualizerCenter);
                        makeDoughnutChart("types", typesProcessed, visualizerCenter);

                        makeStackedBarChart("serializers", serializersProcessed, visualizerCenter, 10);
                        makeStackedBarChart("years", yearsProcessed, visualizerCenter, 30);
                        makeStackedBarChart("tags", tagsProcessed, visualizerCenter, 15);

                        makeRatingChart("ratings", stats?.ratings?.user, stats?.ratings?.userbase, visualizerCenter);
                        makeActivityChart(type, "activity", stats?.consumptionByMonth);

                        visualizerStart.setAttribute('dataType', type);
        
                        document.querySelector('#visualizerStats-header h1').textContent = `${stats.username}'s ${type} list`;
                        document.querySelector('#visualizerStats-header p').textContent = timeSince(stats.dataDate);

                        // Header stats
                        const installmentType = type === "anime" ? "Ep" : "Ch";
                        totalEntriesEl.textContent = "Entries: " + stats.totalEntries;
                        installmentsEl.textContent = `${installmentType}'s: ${stats.chapterCount}`;
                        perDayEl.textContent = `Avg ${installmentType}/day: ${stats.averageChaptersPerDay}`;


                        timeSpentEl.textContent = "Time: " + stats.totalTime + " H";

                        if (stats.volumeCount >= 1) {
                            volumesEl.style.display = "block";
                            volumesEl.textContent = `Vol's: ` + stats.volumeCount;
                        } else {
                            volumesEl.style.display = "none";
                        }

                        // Changing serializer to publisher and vice versa
                        const serializerBtn = document.querySelector('#chartButtons [data-chart="serializers"] span')
                        if (type == "anime") {
                            serializerBtn.textContent = "Studios"
                        } else {
                            serializerBtn.textContent = "Serializers"
                        }

                        currentStats = stats;
                        currentType = type;

                        // Showing questions initially
                        const previousSelected = document.querySelector('#chartButtons button.dataTypeSelected');
                        if (previousSelected) {
                            previousSelected.classList.remove('dataTypeSelected');
                        }

                        limiterElement.parentElement.style.display = "none";
                        document.getElementById('visualizerStats-searchBar-container').style.display = "none";
                        
                        const questionsContainer = document.getElementById('questionsInfo').parentElement
                        questionsContainer.style.position = "";
                        questionsContainer.style.visibility = "visible";
                    });
                }
            });
        }
    
        function timeSince(dataDate) {
            const date = new Date(dataDate);
            const current = new Date();
            const secondsAgo = Math.floor((current - date) / 1000);

            const units = [
                { label: 'day', seconds: 86400 },
                { label: 'hour', seconds: 3600 },
                { label: 'minute', seconds: 60 },
                { label: 'second', seconds: 1 }
            ];

            for (const unit of units) {
                if (secondsAgo >= unit.seconds) {
                    const value = Math.floor(secondsAgo / unit.seconds);
                    return `${value} ${unit.label}${value !== 1 ? 's' : ''} ago`;
                }
            }

            return '';
        }
    
        activateButton(mangaStatsBtn, 'manga');
        activateButton(animeStatsBtn, 'anime');
    
    
        // Export json
        document.getElementById('visualizer-exportJson').addEventListener('click', function() {
            let dataType = visualizerStart.getAttribute('dataType');
            
            browser.storage.local.get([`stats-${dataType}`], (result) => {
                const stats = JSON.parse(result[`stats-${dataType}`]);
                const stringifiedData = JSON.stringify((stats), null, 2);
                const blob = new Blob([stringifiedData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
            
                const link = document.createElement('a');
                link.download = `visualizer-${stats.username}-${dataType}-.json`;
                link.href = url;
            
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            });
        });

        // Settings btn
        document.getElementById('visualizer-settingsBtn').addEventListener('click', () => {
            browser.storage.local.get("timeCalcMap")
            .then((result) => {
                document.getElementById('featuresEditPage').scrollIntoView({ behavior: 'smooth' });
                document.getElementById('featuresEditor').dataset.key = "timeCalcMap";

                setJsonEditor(result.timeCalcMap, "Visualizer", false, false);
            })
        });

        // Import json
        document.getElementById('visualizer-importJson').addEventListener("click", function() {
            document.getElementById('visualizer-fileInput').click();
        });

        document.getElementById('visualizer-fileInput').addEventListener("change", async function(event) {
            const file = event.target.files[0]; 
                
            if (file && file.type === "application/json") {
                try {
                    function readFile(file) {
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = () => reject(reader.error);
                            reader.readAsText(file);
                        });
                    };

                    const contentText = await readFile(file);
                    const content = JSON.parse(contentText);

                    const dataType = content.dataType;
                    if (dataType === "manga" || dataType === "anime") {
                        await browser.storage.local.set({ [`stats-${dataType}`]: JSON.stringify(content) });
                        document.getElementById('visualizerPage').scrollIntoView({ behavior: 'smooth' });
                    }
                } catch (err) {
                    console.error("Error processing file:", err);
                    alert("Error processing file :(");
                }
            } else {
                console.error("Select a valid JSON file");
                alert("Select a valid JSON fil.");
            }
        });
    }
}())