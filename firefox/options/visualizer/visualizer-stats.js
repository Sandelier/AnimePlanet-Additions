function calcEstimatedTime(chapterCount, averageChaptersPerDay, targetNumber) {
    const remainingChapters = targetNumber - chapterCount;
    const daysNeeded = remainingChapters / averageChaptersPerDay;

    if (daysNeeded >= 365) {
        return `${(daysNeeded / 365).toFixed(1)}y`;
    } else if (daysNeeded >= 30) {
        return `${(daysNeeded / 30).toFixed(1)}mo`;
    } else if (daysNeeded >= 1) {
        return `${daysNeeded.toFixed(1)}d`;
    } else {
        return `${(daysNeeded * 24).toFixed(1)}h`;
    }
}

function roundNumber(num) {
    if (num < 10000) {
        return Math.ceil(num / 5000) * 5000;
    } else if (num < 100000) {
        return Math.ceil(num / 50000) * 50000;
    } else {
        return Math.ceil(num / 500000) * 500000;
    }
}

// Function to generate ticks for progress bar.
function generateTicks(tickLimit, targetNumber) {
    let ticks = [];
    const increment = targetNumber / tickLimit;
    ticks.push(0);
    
    for (let i = 1; i < tickLimit; i++) {
        const previousValue = ticks[i - 1];
        const nextValue = previousValue + increment;
        ticks.push(nextValue);
    }
    
    ticks.push(targetNumber);
    return ticks;
}

function getRandomColor() {
    const minBrightness = 50;
    let r, g, b, brightness;

    do {
        r = Math.floor(Math.random() * 206) + 50;
        g = Math.floor(Math.random() * 206) + 50;
        b = Math.floor(Math.random() * 206) + 50;

        brightness = (r * 299 + g * 587 + b * 114) / 1000;
    } while (brightness < minBrightness);

    return `rgba(${r}, ${g}, ${b}, 0.5)`;
}

function createCanvas(width, height, toAppend) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    toAppend.appendChild(canvas);
    return canvas;
}

function getDivisors(number) {
    const divisors = [];
    for (let i = 1; i <= number; i++) {
        if (number % i === 0) {
            divisors.push(i);
        }
    }
    return divisors;
}
  
function findBestDivisor(chapterCount, progressBarTotalWidth) {
    const divisors = getDivisors(roundNumber(chapterCount));
    let bestDivisor = null;
    let closestDifference = Infinity;   
    divisors.forEach(divisor => {
        const quotient = progressBarTotalWidth / divisor;
        const difference = Math.abs(quotient - 60);   
        if (difference < closestDifference || (difference === closestDifference && divisor < bestDivisor)) {
            closestDifference = difference;
            bestDivisor = divisor;
        }
    }); 

    return bestDivisor;
}

function makeInstallmentImage(statsData, toAppend) {

    let canvasWidth = 850;
    let progressBarTotalWidth = 600;

    if (window.innerWidth < 1600) {
        canvasWidth = window.innerWidth;
        progressBarTotalWidth = Math.round(canvasWidth * 0.7058823529411765);
    }

    const canvasHeight = 170;
    const canvas = createCanvas(canvasWidth, canvasHeight, toAppend);
    canvas.style.height = `${canvasHeight}px`;
    canvas.style.width = `${canvasWidth}px`;


    canvas.classList.add('visualizer-statsImage');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // progress bar
    const progressBarHeight = 16;
    const chapterPercentage = statsData.chapterCount / roundNumber(statsData.chapterCount);
    const progressWidth = progressBarTotalWidth * chapterPercentage;

    const progressBarY = (canvasHeight - progressBarHeight) / 2;
    const progressBarX = (canvasWidth - progressBarTotalWidth) / 2;
    const roundness = 8;

    // black progress bar background
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(progressBarX, progressBarY);
    ctx.roundRect(progressBarX, progressBarY, progressBarTotalWidth, progressBarHeight, [roundness, roundness, roundness, roundness]);
    ctx.fill();

    // red progress bar
    ctx.fillStyle = '#d93d48';
    ctx.beginPath();
    ctx.roundRect(progressBarX, progressBarY, progressWidth, progressBarHeight, [roundness, roundness, roundness, roundness]);
    ctx.fill();

    // Drawing the ticks on the progress bar  
    const ticksArray = generateTicks(findBestDivisor(statsData.chapterCount, progressBarTotalWidth), roundNumber(statsData.chapterCount));
    const tickLocY = progressBarY + progressBarHeight + 25;

    ticksArray.forEach(tick => {

        const percentage = (tick / roundNumber(statsData.chapterCount)) * 100;
        let tickText = tick.toString();
        if (tick >= 1000 && tick < 1000000) {
            let formatted = (tick / 1000).toFixed(1);
            if (formatted.endsWith('.0')) {
                formatted = formatted.slice(0, -2);
            }
            tickText = formatted + 'k';
        } else if (tick >= 1000000) {
            tickText = (tick / 1000000).toFixed(0) + 'm';
        }

        const textWidth = ctx.measureText(tickText).width;
        const tickLocX = (percentage / 100) * progressBarTotalWidth - textWidth / 2 + progressBarX;

        ctx.font = '15px Mulish';
        ctx.fillStyle = 'black';
        ctx.fillText(tickText, tickLocX, tickLocY);

        ctx.beginPath();
        const tickHeight = ctx.measureText(tickText).actualBoundingBoxAscent + ctx.measureText(tickText).actualBoundingBoxDescent;
        ctx.moveTo((percentage / 100) * progressBarTotalWidth + progressBarX, tickLocY - tickHeight);
        ctx.lineTo((percentage / 100) * progressBarTotalWidth + progressBarX, (progressBarY + progressBarHeight));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    if (window.innerWidth >= 1600) {
        // Estimated time.
        const estText = `est. ${calcEstimatedTime(statsData.chapterCount, statsData.averageChaptersPerDay, roundNumber(statsData.chapterCount))}`;
        const estTextX = (progressBarTotalWidth + canvasWidth) / 2 + 25;
        const estTextY = progressBarY + progressBarHeight - 4;

        ctx.fillStyle = 'black';
        ctx.font = '15px Mulish';
        ctx.fillText(estText, estTextX, estTextY);
    }

    // Top text
    let topText = 'Chapters Read';
    let bottomText = `Avg. ${statsData.averageChaptersPerDay} ch per day`;

    if (statsData.dataType === "anime") {
        topText = 'Episodes watched';
        bottomText = `Avg. ${statsData.averageChaptersPerDay} ep per day`;
    }

    ctx.font = '25px Oswald';
    const topTextWidth = ctx.measureText(topText).width;
    const topTextX = (canvasWidth - topTextWidth) / 2;
    const topTextY = progressBarY + progressBarHeight - 40;

    ctx.fillStyle = 'black';
    ctx.fillText(topText, topTextX, topTextY);

    // Bottom text
    ctx.font = '15px Mulish';
    const bottomTextWidth = ctx.measureText(bottomText).width;
    const bottomTextX = (canvasWidth - bottomTextWidth) / 2;
    const bottomTextY = progressBarY + progressBarHeight + 60;

    ctx.fillStyle = 'black';
    ctx.fillText(bottomText, bottomTextX, bottomTextY);
}

Chart.defaults.color = 'black';

function makeDoughnutChart(statsData, toAppend, legendPosition) { 
    const bgColors = statsData.bgColors;
    const data = statsData.counts;
    const total = data.reduce((acc, val) => acc + val, 0);
    const labels = statsData.labels.map((label, index) => `${label} (${data[index]})`);


    let canvas;

    if (window.innerWidth < 1600) {
        canvas = createCanvas(window.innerWidth, window.innerWidth/2, toAppend);
    } else {
        canvas = createCanvas(510, 246, toAppend);
    }
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
            plugins: {
                legend: {
                    position: legendPosition,
                    labels: {
                        font: {
                            size: 14
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

function makeBarChart(statsData, toAppend) { 

    const bgColors = statsData.bgColors;
    const data = statsData.counts;
    const labels = statsData.labels;

    const canvas = createCanvas(window.innerWidth, (window.innerHeight/3), toAppend);
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        responsive: true,
        data: {
            labels: labels,
            datasets: [{
                label: statsData.sortingType,
                data: data,
                backgroundColor: bgColors,
                borderColor: statsData.borderColors,
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    },
    
                    ticks: {
                        maxTicksLimit: 20
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false 
                }
            }
        }
    }); 
}




function processStatsData(statsData, chartSettings) {
    const { index, limit, bgColors } = chartSettings;

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
            sortingType = Object.keys(statsData[index])[index];
            return data[labelKey];
        }
    });

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


    return { labels, counts, bgColors, borderColors, sortingType };
}