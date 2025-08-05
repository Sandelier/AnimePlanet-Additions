function getRandomColor() {
    const minBrightness = 25;
    let r, g, b, brightness;

    do {
        r = Math.floor(Math.random() * 151) + 50;
        g = Math.floor(Math.random() * 206) + 50;
        b = Math.floor(Math.random() * 206) + 50;

        brightness = (r * 299 + g * 587 + b * 114) / 1000;
    } while (brightness < minBrightness);

    return `rgba(${r}, ${g}, ${b}, 0.9)`;
}

function createCanvas(width, height, toAppend, dataType, currentLimit, maxLimit = "hide", searchBar = false) {
    const container = document.createElement('div');
    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    container.setAttribute("chart-type", dataType);
    container.setAttribute("currentLimit", currentLimit);
    container.setAttribute("maxLimit", maxLimit);
    container.setAttribute("searchBar", searchBar);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    container.appendChild(canvas);
    toAppend.appendChild(container);

    return canvas;
}

function isEnoughData(dataType, counts) {
    const chartBtn = document.querySelector(`#chartButtons [data-chart="${dataType}"]`)

    const countValue = Array.isArray(counts) ? counts.length : counts;

    if (countValue == null || countValue <= 0) {
        chartBtn.classList.add('deactivatedBtn');
        return false;
    }


    chartBtn.classList.remove('deactivatedBtn');
    return true;
}

Chart.defaults.color = 'black';

function makeDoughnutChart(dataType, statsData, toAppend) { 
    const bgColors = statsData?.bgColors;
    const data = statsData?.counts;

    if (!isEnoughData(dataType, data)) return;

    const total = data.reduce((acc, val) => acc + val, 0);
    const labels = statsData.labels.map((label, index) => `${label} (${data[index]})`);
    
    const canvas = createCanvas(
        toAppend.getBoundingClientRect().width, 
        toAppend.getBoundingClientRect().height - 21, 
        toAppend, 
        dataType, 
        labels.length, 
        "hide",
    );

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 0,
                spacing: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 16
                        },
                        usePointStyle: true,
                        padding: 10
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${((tooltipItem.raw / total) * 100).toFixed(2)}%`;
                        }
                    }
                }
            }
        }
    });
}


function makeStackedBarChart(dataType, statsData, toAppend, limit) {

    if (!statsData) { 
        isEnoughData(dataType, statsData);
        return;
    }

    const labels = [...statsData?.labels];
    const firstData = statsData?.extraData.slice(1);
    const secondData = [...statsData?.counts];
    const timeData = [...statsData?.timeData];
    const volumeData = [...statsData?.volumeData];

    if (!isEnoughData(dataType, firstData)) return;

    const canvas = createCanvas(
        toAppend.getBoundingClientRect().width,
        toAppend.getBoundingClientRect().height - 21,
        toAppend,
        dataType,
        labels.slice(0, limit).length,
        statsData.maxLimit,
        true
    );

    canvas.timeData = timeData.slice(0, limit);
    canvas.volumeData = volumeData.slice(0, limit);

    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.slice(0, limit),
            datasets: [
                {
                    label: statsData.extraData[0],
                    data: firstData.slice(0, limit),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    stack: 'stack1',
                },
                {
                    label: statsData.sortingType,
                    data: secondData.slice(0, limit),
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                    yAxisID: 'y2',
                    stack: 'stack1',
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            animation: {
                duration: 600
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 16
                        },
                        filter: function(item) {
                            return item.text !== 'Hours';
                        }
                    },
                    // Makes an new order for the chart when hiding data
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        const meta = ci.getDatasetMeta(index);

                        // Toggle vsibility
                        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;

                        const isSecondHidden = ci.getDatasetMeta(1).hidden || ci.data.datasets[1].hidden;

                        if (isSecondHidden) {
                            // Sort by first dataset descending
                            const combined = labels.map((label, i) => ({
                                label,
                                first: firstData[i],
                                second: secondData[i],
                                time: timeData[i],
                                volumes: volumeData[i],
                            }))
                            .sort((a, b) => b.first - a.first)
                            .slice(0, limit);

                            ci.data.labels = combined.map(d => d.label);
                            ci.data.datasets[0].data = combined.map(d => d.first);
                            ci.data.datasets[1].data = combined.map(d => d.second);

                            canvas.timeData = combined.map(d => d.time);
                            canvas.volumeData = combined.map(d => d.volumes);

                            // Adjusting y-axis max since otherwise it would show just from 1-0 scale
                            const maxFirst = Math.max(...combined.map(d => d.first));
                            ci.options.scales.y2.max = Math.ceil(maxFirst * 1.1); // Add 10% padding. Ik that it wont look nice since theres no rounding
                        } else {
                            // Orginal order
                            ci.data.labels = [...labels.slice(0, limit)];
                            ci.data.datasets[0].data = [...firstData.slice(0, limit)];
                            ci.data.datasets[1].data = [...secondData.slice(0, limit)];

                            canvas.timeData = timeData.slice(0, limit);
                            canvas.volumeData = volumeData.slice(0, limit);

                            // Adjust y-axis max based on second dataset max
                            const maxSecond = Math.max(...secondData.slice(0, limit));
                            ci.options.scales.y2.max = Math.ceil(maxSecond * 1.1); // Add 10% padding. Ik that it wont look nice since theres no rounding
                        }

                        ci.update();
                    }
                },
                // Shows the hours + volumes tooltip
                tooltip: {
                    callbacks: {
                        afterBody: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const lines = [];

                            const time = canvas.timeData?.[index] || 0;
                            const volume = canvas.volumeData?.[index] || 0;
                            let formattedTime;

                            if (time >= 10) {
                                formattedTime = Math.round(time);
                            } else {
                                formattedTime = time.toFixed(1);
                            }

                             // The empty space is quick ugly to make it seem aligned.
                            if (volume > 0) {
                                lines.push(`    Volume: ${volume.toLocaleString()}`);
                            }
                            lines.push(`    Time: ${formattedTime} h`);
                            return lines;
                        }
                    }
                }
            },
            scales: {
                y1: {
                    display: false,
                },
                y2: {
                    type: 'linear',
                    beginAtZero: true,
                    stacked: true,
                    grid: {
                        drawOnChartArea: true,
                    }
                },
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0,0,0,0)',
                    },
                    ticks: {
                        font: {
                            size: 16,
                        }
                    }
                }
            }
        }
    });

    searchChartData[dataType] = {
        chart,
        labels,
        firstData,
        secondData,
        timeData,
        volumeData,
        limit,
    };
}

// Search bar functionality
let searchChartData = {};

const searchInput = document.getElementById('visualizerStats-searchBar');
searchInput.addEventListener('input', handleInput);

function handleInput(e) {
    if (searchChartData) {
        chartSearchBar(e.target.value.toLowerCase().trim());
    }
}

// I made this orginally work with only one data so i will leave that functionality even tho we are currently always using two data
function chartSearchBar(query) {

    const currentDataType = document.querySelector('div#chartButtons button.defaultBtnStyle.dataTypeSelected').getAttribute('data-chart');
    if (!searchChartData[currentDataType]) return;

    const { chart, labels, firstData, secondData, timeData, volumeData, limit, } = searchChartData[currentDataType];
    const canvas = chart.ctx.canvas;

    let filtered = labels.map((label, i) => ({
        label,
        first: firstData[i],
        second: secondData ? secondData[i] : null,
        time: timeData ? timeData[i] : 0,
        volumes: volumeData ? volumeData[i]: 0
    }));

    // Since limiter does not work with the search we can use it to show the current count of labels
    const limiterElement = document.getElementById('visualizerStats-limiter');
    if (query) {
        filtered = filtered.filter(item => item.label.toLowerCase().includes(query));
        limiterElement.readOnly = true;
        limiterElement.style.cursor = "not-allowed";
    } else {
        filtered = filtered.slice(0, limit);
        limiterElement.readOnly = false;
        limiterElement.style.cursor = "";
    }

    limiterElement.value = filtered.length;

    chart.data.labels = filtered.map(d => d.label);
    chart.data.datasets[0].data = filtered.map(d => d.first);

    if (secondData) {
        chart.data.datasets[1].data = filtered.map(d => d.second);

        const maxSecond = Math.max(...filtered.map(d => d.second), 1);
        chart.options.scales.y2.max = Math.ceil(maxSecond * 1.1);
        chart.options.scales.y2.beginAtZero = true;
    }

    canvas.timeData = filtered.map(d => d.time);
    canvas.volumeData = filtered.map(d => d.volumes);

    chart.update();
}



function makeRatingChart(dataType, userRatingData, userbaseRatingData, toAppend) {

    const dataTest = userRatingData 
        ? Object.values(userRatingData).reduce((sum, v) => sum + v, 0) 
        : null;
    if (!isEnoughData(dataType, dataTest)) return;


    const labels = [];
    for (let val = 5; val >= 0; val -= 0.5) {
        let label = val.toFixed(1);
        if (label.endsWith('.0')) {
            label = label.slice(0, -2);
        }
        labels.push(label);
    }

    // Need to align the data with labels or otherwise the tooltips are gonna be messed up
    userRatingData = labels.map(label => userRatingData?.[label] ?? 0)
    userbaseRatingData = labels.map(label => userbaseRatingData?.[label] ?? 0)



    const canvas = createCanvas(
        toAppend.getBoundingClientRect().width,
        toAppend.getBoundingClientRect().height - 21,
        toAppend,
        dataType,
        labels.length,
        "hide"
    );

    const ctx = canvas.getContext("2d");


    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'User',
                    data: userRatingData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
                {
                    label: 'Userbase',
                    data: userbaseRatingData,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                }
            ]
        },
        options: {
            
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            animation: {
                duration: 600
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 16
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    stacked: true,
                    ticks: {
                        font: {
                            size: 16,
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { // makes the ticks to be only whoel numbers
                        callback: function (value) {
                            return Number.isInteger(value) ? value : '';
                        },
                        precision: 0
                    }
                }
            }
        }
    });
}



function makeActivityChart(installmentType, dataType, data) {

    let dataTest = data ? Object.keys(data).length : null;
    if (!isEnoughData(dataType, dataTest)) return;

    const noDateData = data.ND;
    delete data.ND; // causes problems if we dont delete it.

    // If you run it again the heatmap will still have the old data
    const yearsHeatmap = document.getElementById('yearsHeatmap');
    const monthsHeatmap = document.getElementById('monthsHeatmap');
    yearsHeatmap.innerHTML = "";
    monthsHeatmap.innerHTML = "";
    monthsHeatmap.style.display = "none";
    //

    installmentType = installmentType === "manga" ? "Chapters" : "Episodes";

    const heatmapTooltip = document.getElementById('heatmap-tooltip');
    const tooltipElements = heatmapTooltip.querySelectorAll('p');
    
    // Tooltip 
    function showTooltip(ele, label, installments, entries, time, volumeCount) {
        tooltipElements[0].textContent = label;
        tooltipElements[1].textContent = `${installmentType}: ${installments}`;
        if (volumeCount > 0) {
            tooltipElements[2].textContent = `Volumes: ${volumeCount}`;
        } else {
            tooltipElements[2].textContent = ``;
        }
        tooltipElements[3].textContent = `Entries: ${entries}`;
        tooltipElements[4].textContent = `Time: ${parseFloat(time).toFixed(1)} h`;

        // position
        const rect = ele.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        heatmapTooltip.style.top = `${scrollY + rect.top - heatmapTooltip.offsetHeight - 8}px`;
        heatmapTooltip.style.left = `${scrollX + rect.left + rect.width / 2 - heatmapTooltip.offsetWidth / 2}px`;
        heatmapTooltip.style.visibility = 'visible';
        heatmapTooltip.style.opacity = '1';
    }

    function attachTooltipEvents(ele, label, installments, entries, time, volumeCount) {
        ele.addEventListener('mouseenter', () => {
            showTooltip(ele, label, installments, entries, time, volumeCount);
        });
        ele.addEventListener('mouseleave', () => {
            heatmapTooltip.style.opacity = '0';
            heatmapTooltip.style.visibility = 'hidden';
        });
    }
    //

    function getHeatColor(intensity) {
        const colorMap = [
            [255, 255, 255], // white
            [255, 255,   0], // yellow
            [255, 165,   0], // orange
            [255,   0,   0]  // red
        ];
        const mapSize = colorMap.length - 1;
        const scaled = intensity * mapSize;
        const lowIndex = Math.floor(scaled);
        const frac = scaled - lowIndex;

        // Gets the current lowest and highest index color it can be.
        const lowestIndex = colorMap[lowIndex];
        const highestIndex = colorMap[Math.min(lowIndex + 1, mapSize)];

        const r = Math.round(lowestIndex[0] + frac * (highestIndex[0] - lowestIndex[0]));
        const g = Math.round(lowestIndex[1] + frac * (highestIndex[1] - lowestIndex[1]));
        const b = Math.round(lowestIndex[2] + frac * (highestIndex[2] - lowestIndex[2]));

        return `rgb(${r}, ${g}, ${b})`;
    }

    function createLabel(cont, labelName, installments, installmentType) {
        const labelDiv = document.createElement('div');
        labelDiv.classList.add('label');
        labelDiv.textContent = labelName;
        
        const countDiv = document.createElement('div');
        countDiv.classList.add('count');
        countDiv.textContent = `${installments} ${installmentType.slice(0, 2)}`;
        
        cont.appendChild(labelDiv);
        cont.appendChild(countDiv);
    }

    // Installment count of the highest year
    const maxYearInstallments = Math.max(...Object.values(data).map(yearData =>
        Object.values(yearData).reduce((sum, m) => sum + m.installments, 0)
    ));

    // Year
    function createYearElements() {
        Object.entries(data).forEach(([year, months]) => {
            const totals = Object.values(months).reduce((acc, m) => {
                acc.installments += m.installments;
                if (typeof m.volumeCount === 'number') {
                    acc.volumeCount += m.volumeCount;
                }
                acc.entries += m.entries;
                acc.time += m.time;
                return acc;
            }, { installments: 0, volumeCount: 0, entries: 0, time: 0 });

            const yearDiv = document.createElement('div');
            yearDiv.className = 'year';

            const intensity = totals.installments / maxYearInstallments || 0;
            yearDiv.style.backgroundColor = getHeatColor(intensity);

            createLabel(yearDiv, year, totals.installments, installmentType);

            yearDiv.addEventListener('click', () => {
                document.querySelectorAll('.year').forEach(y => y.classList.remove('active'));
                yearDiv.classList.add('active');
                monthsHeatmap.style.display = "";
                updateMonthsHeatmap(year);
            });

            attachTooltipEvents(yearDiv, year, totals.installments, totals.entries, totals.time, totals.volumeCount);

            yearsHeatmap.appendChild(yearDiv);
        });

        if (noDateData) {
            const noDateDiv = document.createElement('div');
            noDateDiv.classList.add('year', 'disabled');

            createLabel(noDateDiv, "ND", noDateData.installments, installmentType);
            attachTooltipEvents(noDateDiv, 'No Date', noDateData.installments, noDateData.entries, noDateData.time, noDateData.volumeCount);

            yearsHeatmap.appendChild(noDateDiv);
        }
    }

    // Month
    const monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

    function updateMonthsHeatmap(year) {
        monthsHeatmap.innerHTML = '';
        const yearData = data[year];
        monthsHeatmap.style.display = "";

        // Installment count of the highest month
        const maxMonthInstallments = Math.max(...Object.values(yearData).map(m => m.installments));

        const monthsFrag = document.createDocumentFragment(); 
        for (let i = 0; i < 12; i++) {
            const month = (i + 1).toString().padStart(2, '0');
            const monthData = yearData[month] || { installments: 0, entries: 0, time: 0 };

            const intensity = monthData.installments / maxMonthInstallments || 0;

            const monthEl = document.createElement('div');
            monthEl.className = 'month';
            monthEl.style.backgroundColor = getHeatColor(intensity);

            createLabel(monthEl, monthNames[i].slice(0, 3), monthData.installments, installmentType);

            if (monthData.entries + monthData.installments === 0) {
                monthEl.classList.add('disabled');
            } else {
                attachTooltipEvents(monthEl, monthNames[i], monthData.installments, monthData.entries, monthData.time, monthData.volumeCount);
            }

            monthsFrag.appendChild(monthEl);
        }
        monthsHeatmap.appendChild(monthsFrag);
    }

    createYearElements();
}

function processStatsData(statsData, chartSettings, extraIndex = null) {
    const { index, limit, bgColors } = chartSettings;

    if (!statsData[0]) {
        return null;
    }


    // Sorting based on the index. so in example for tags if index is 1 then it means installemnt.
    statsData.sort((a, b) => {
        const property = Object.keys(a)[index];
        return b[property] - a[property];
    });

    let sortingType;

    const labelKey = Object.keys(statsData[0])[0];
    let labels = statsData.map(data => {
        if (Object.keys(data).length === 1) {
            return Object.keys(data)[0]; // For like types where the label is the key.
        } else {
            sortingType = Object.keys(statsData[0])[index];
            return data[labelKey];
        }
    });

    // extraData for now is used only on stackedBarChart
    let extraData;
    let timeData;
    let volumeData;
    if (extraIndex) {
        const keyName = Object.keys(statsData[0])[extraIndex];
        extraData = [keyName];
        const values = statsData.map(data => data[keyName]);
        extraData.push(...values);

        // timedata is always currently included if theres extradata
        timeData = statsData.map(data => data.time)

        volumeData = statsData.map(data => data?.volumes ?? 0);
    }

    let counts = statsData.map(data => data[Object.keys(data)[index]]);

    labels = labels.slice(0, limit);
    counts = counts.slice(0, limit);

    // Adding bgcolors with getrandomcolors if theres not enough bgcolors.

    let borderColors = [];
    if (!bgColors || bgColors.length < limit) {
        const missingColors = limit - (bgColors ? bgColors.length : 0);
        for (let i = 0; i < missingColors; i++) {
            const color = getRandomColor();
            const borderColor = color.replace('0.5', '1');
            borderColors.push(borderColor);
            bgColors.push(color);
        }
    } else {
        borderColors = bgColors.map(color => color.replace('0.5', '1'));
    }


    return { labels, counts, bgColors, borderColors, sortingType, maxLimit: statsData.length, extraData: extraData, timeData, timeData, volumeData, volumeData };
}