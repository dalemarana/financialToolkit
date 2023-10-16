//-------------------------------------------------------------------------
// This function is to get the data from the server
var CLIENTDATA;
let stackedChart;
let doughnutChart;
let netIncomeChart;
var stackedData = {};
const doughnutData = {};

const ctx = document.getElementById('chartExpense');
const ctxNetIncome = document.getElementById('netIncomeChart');


document.addEventListener('DOMContentLoaded', () => {

var chart;
let datasets;
const triggerBtn = document.getElementById('testBtn');




    fetch('/get_data')
        .then(response => response.json())
        .then(data => {
            // Store the fetched data in a JavaScript variable for client-side rendering
            CLIENTDATA = data;
            // Further client-side processing
            triggerBtn.click();
            //console.log(CLIENTDATA);
            initiateItemTypeDropdown();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });

        
        //------------------------------------------------------------------------
        // Data for monthly expenses

        const chartOptions = document.getElementsByName('chartOptions');
        let selectedValue;
        //console.log(chartOptions);
        chartOptions.forEach((option) => {
            if (option.checked) {
                selectedValue = option.value;
                //console.log(selectedValue);
            }
            option.addEventListener('click', () => {
                if (option.checked) {
                    selectedValue = option.value;
                    //console.log(selectedValue);

                }
                chart = createChart(ctx, selectedValue, datasets);
                //console.log(chart);
                ctx.addEventListener('click', (e) => {
                    handleChartClick(e, chart, selectedValue, datasets);
                });
            });
        });

        triggerBtn.addEventListener('click', () => {
            //console.log(CLIENTDATA);

            const chartData = getData();

            datasets = chartData.stackedData;

            chart = createChart(ctx, selectedValue, datasets);
        
            ctx.addEventListener('click', (e) => {
                handleChartClick(e, chart, selectedValue, datasets);

            
            });
        });

        document.getElementById('netIncomeBtn').addEventListener('click', () => {
            const container = document.getElementById('netIncomeContainer');
            if (!container.classList.contains('d-none')) {
                container.classList.add('d-none');
            } else {
                container.classList.remove('d-none');
            }
            const netIncomeRawData = getData();
            createNetIncomeChart(ctxNetIncome,netIncomeRawData)
            //console.log(netIncomeRawData);
        } );

});

//-----------------------------------------------------------------------------
// Function to get unique values
function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}


//-----------------------------------------------------------------------------
// Getting unique values of months and years from CLIENTDATA dictionary

function dates(CLIENTDATA) {
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    let months = [];
    let years = [];
    Array.from(CLIENTDATA).forEach((transaction) => {
        let date = new Date(transaction.transaction_date);
        //console.log(date);
        months.push(fullMonths[date.getMonth()]);
        years.push(date.getFullYear());
    });
    let uniqueMonths = months.filter(onlyUnique);
    let uniqueYears = years.filter(onlyUnique);
    return dates = {'months': uniqueMonths, 'years': uniqueYears}
}


//---------------------------------------------------------------------------
// Getting values of month and year from a transaction date
function get_date(date) {
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    let gdate = new Date(date);
    
    return {'month': fullMonths[gdate.getMonth()], 'year': gdate.getFullYear()}
}


//---------------------------------------------------------------------------
// Simple function to capitalize each word
function capitalizeWord(str) {
    return str
        .toLowerCase()
        .split('_')
        .map(function(word) {
            return word[0].toUpperCase() + word.substr(1);
        })
        .join(' ');
}


//----------------------------------------------------------------------------
// Plugin to toggle hide/show datasets

const getOrCreateLegendList = (chart, id) => {
    const legendContainer = document.getElementById(id);
    let listContainer = legendContainer.querySelector('ul');

    if (!listContainer) {
        listContainer = document.createElement('ul');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'row';
        listContainer.style.margin = 0;
        listContainer.style.padding = 0;

        legendContainer.appendChild(listContainer);
    }
    return listContainer;
};

const htmlLegendPlugin = {
    id: 'htmlLegend',
    afterUpdate(chart, args, options) {
        const ul = getOrCreateLegendList(chart, options.containerId);

        // Remove old legend items
        while (ul.firstChild) {
            ul.firstChild.remove();
        }

        // Reuse built-in legendItems generator
        const items = chart.options.plugins.legend.labels.generateLabels(chart);

        items.forEach(item => {
            const li = document.createElement('li');
            li.style.alignItems = 'center';
            li.style.cursor = 'pointer';
            li.style.display = 'flex';
            li.style.flexDirection = 'row';
            li.style.marginLeft = '10px';

            li.onclick = () => {
                const {type} = chart.config;
                if (type === 'pie' || type ==='doughnut') {
                    // Pie and doughnut charts only have a single dataset and visibility per item
                    chart.toggleDataVisibility(item.index);
                } else {
                    chart.setDatasetVisibility(item.datasetIndex, 
                        !chart.isDatasetVisible(item.datasetIndex));
                }
                chart.update();
            };

            // Color box
            const boxSpan = document.createElement('span');
            boxSpan.style.background = item.fillStyle;
            boxSpan.style.borderColor = item.strokeStyle;
            boxSpan.style.borderWidth = item.lineWidth + 'px';
            boxSpan.style.display = 'inline-block';
            boxSpan.style.flexShrink = 0;
            boxSpan.style.height = '20px';
            boxSpan.style.marginRight = '10px';
            boxSpan.style.width = '20px';

            // Text
            const textContainer = document.createElement('p');
            textContainer.style.color = item.fontColor;
            textContainer.style.margin = 0;
            textContainer.style.padding = 0;
            textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

            const text = document.createTextNode(item.text);
            textContainer.appendChild(text);

            li.appendChild(boxSpan);
            li.appendChild(textContainer);
            ul.appendChild(li);
        });
    }
};


//-------------------------------------------------------------
// Chart Legend Position
const actions = [
    {
        name:'Position: top',
        handler(chart) {
            chart.options.plugins.legend.position = 'top';
            chart.update;
        }
    },
];



//------------------------------------------------------------
// Extract the needed data from CLIENTDATA (all positives, no bias for expense or assets/revenue)
function getData() {

    const transformedData = {};
    CLIENTDATA.forEach(entry => {
        const month = new Date(entry.transaction_date).toLocaleDateString('en-us', {month: 'long'});
        const balanceSheetAccountType = entry.balance_sheet_account_type;
        const subAccountType = entry.sub_account_type;
        const itemType = entry.item_type;
        const amount = (parseInt(entry.transaction_amount * 100)) / 100;
        //console.log(amount);
        // ((parseInt(transaction.transaction_amount * 100)) / 100)
        if (!transformedData[month]) {
            transformedData[month] = {};
        }

        if (!transformedData[month][balanceSheetAccountType]) {
            transformedData[month][balanceSheetAccountType] = {}
        }

        if (!transformedData[month][balanceSheetAccountType][subAccountType]) {
            transformedData[month][balanceSheetAccountType][subAccountType] = {};
        }

        if (!transformedData[month][balanceSheetAccountType][subAccountType][itemType]) {
            transformedData[month][balanceSheetAccountType][subAccountType][itemType] = 0;
        }
        let a = 1;
        if (balanceSheetAccountType == 'asset') {
            a = -1;
        }
        transformedData[month][balanceSheetAccountType][subAccountType][itemType] += (a * parseFloat(amount)) || 0;

    });

    const labels = Object.keys(transformedData);
    const netIncomeData = {};
    const balanceSheetAccountTypes =new Set(
        CLIENTDATA.map(entry => entry.balance_sheet_account_type)
    );



    for (const balanceSheetAccountType of balanceSheetAccountTypes){
        netIncomeData[balanceSheetAccountType] = {
            labels: labels,
            datasets: [],
        };
        const subAccountTypes = new Set(CLIENTDATA.filter(entry => entry.balance_sheet_account_type === balanceSheetAccountType).map(entry => entry.sub_account_type));
        const data = labels.map(month => {
            if (transformedData[month][balanceSheetAccountType]) {
                return Object.keys(transformedData[month][balanceSheetAccountType]).reduce(
                    (total, subAccountType) => {
                        const subTypeData = transformedData[month][balanceSheetAccountType][subAccountType];
                        if(subTypeData) {
                            return total + Object.keys(subTypeData).reduce(
                                (subtotal, itemType) => {
                                    return subtotal + (subTypeData[itemType] || 0);
                                },
                                0
                            );
                        }
                    },
                    0
                );
            } else {
                return 0;
            }
        });
        netIncomeData[balanceSheetAccountType].datasets.push({
            label: balanceSheetAccountType,
            data: data,
        });
    }
    

    // Structure for stackedData


    for (const balanceSheetAccountType of balanceSheetAccountTypes) {
        stackedData[balanceSheetAccountType] = {
            labels: labels,
            datasets: [],
        };
        const subAccountTypes = new Set(CLIENTDATA.filter(entry => entry.balance_sheet_account_type === balanceSheetAccountType).map(entry => entry.sub_account_type));
        
        for (const subAccountType of subAccountTypes) {
            const data = labels.map(month => {
                if (transformedData[month][balanceSheetAccountType] && 
                    transformedData[month][balanceSheetAccountType][subAccountType]
                    ) {
                    // console.log(subAccountType);
                    // console.log(month);
                    // console.log(Object.keys(transformedData[month][subAccountType]));
                    return Object.keys(transformedData[month][balanceSheetAccountType][subAccountType]).reduce(
                        (total, itemType) => {
                        //console.log(total + transformedData[month][balanceSheetAccountType][subAccountType][itemType]);
                        return total + (transformedData[month][balanceSheetAccountType][subAccountType][itemType] || 0);
                        }, 
                        0
                    );
                } else {
                    return 0;
                }
    
            }); 
            stackedData[balanceSheetAccountType].datasets.push({
                label: subAccountType,
                data: data,
            });
        }
    }

    // Structure for DoughnutData


    for (const balanceSheetAccountType of balanceSheetAccountTypes) {


        const subAccountTypes = new Set(CLIENTDATA.filter(entry => entry.balance_sheet_account_type === balanceSheetAccountType).map(entry => entry.sub_account_type));
        
        for (const subAccountType of subAccountTypes) {
            doughnutData[subAccountType] = {
                label: labels,
                datasets: [],
            };

            const itemTypes = new Set(
                CLIENTDATA.filter(entry => entry.balance_sheet_account_type === balanceSheetAccountType && entry.sub_account_type === subAccountType).map(entry => entry.item_type)
            );

            for (const itemType of itemTypes) {
                const itemData = labels.map(month => {
                    const dataForMonth = transformedData[month];
                    if(dataForMonth && dataForMonth[balanceSheetAccountType] && dataForMonth[balanceSheetAccountType][subAccountType] && dataForMonth[balanceSheetAccountType][subAccountType][itemType]) {
                        return dataForMonth[balanceSheetAccountType][subAccountType][itemType];
                    } else {
                        return 0;
                    }
                });
                doughnutData[subAccountType].datasets.push({
                    data: itemData,
                    label: itemType,
                });
            }
        }
    }


  
    return {
        stackedData: stackedData,
        doughnutData: doughnutData,
        netIncomeData: netIncomeData,
    };
}

document.getElementById('resetBtn').addEventListener('click', () => {
    
    const chartData = getData();
    console.log(chartData);
})

//---------------------------------------------------------------------------
// Function to get the color palette
function getColorPalette(balanceSheetAccountType) {
    const colorPalettes = {
        expense: ['#00429d80', '#3e67ae80', '#618fbf80', '#85b7ce80', '#b1dfdb80', '#ffffe080'],
        asset: ['#2e580080', '#49793680', '#659c6480', '#86c09380', '#b0e3c080', '#ffffe080'],
        liabilities: ['#9b002980', '#aa504d80', '#b6817580', '#beaf9d80', '#cbdcc480', '#ffffe080']
    };

    return colorPalettes[balanceSheetAccountType] || [];
}


//----------------------------------------------------------------------------
// Function to set the background color on balanceSheetAccountType

function setDatasetBackgroundColor (dataset, balanceSheetAccountType){
    dataset.backgroundColor = getColorPalette(balanceSheetAccountType);
    return dataset;
}

//--------------------------------------------------------------------------
// Function to create a stacked chart
function createChart(ctx, balanceSheetAccountType, mainDatasets) {
    let datasets = mainDatasets[balanceSheetAccountType];

    let labels = datasets.labels;

    // Define a function to set the backgroundColor for each data point
    function setStackedBarColors(dataset, colorPalette) {
        dataset.backgroundColor = colorPalette;
        return dataset;
    }

    let color = getColorPalette(balanceSheetAccountType);
    //console.log (color);

    let modifiedDatasets = [];

    //console.log(datasets.datasets);

    for (let itemType in Object.keys(datasets.datasets)){
        modifiedDatasets.push({
            label: capitalizeWord(datasets.datasets[itemType].label),
            data: datasets.datasets[itemType].data,
            backgroundColor: color[itemType],
        })
    }
    
    let data = {'labels': labels, 'datasets': modifiedDatasets};
    //console.log(data);
    if(!stackedChart) {
        stackedChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                plugins:{
                    htmlLegend: {
                        // ID of the container to put the legend in
                        containerId: 'legend-container1',
                    },
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }).format(context.parsed.y);
                                }
                                return [label,''];
                            },
                            afterLabel: function (context) {
                                //console.log(context);
                                let label = context.dataset.label || '';
                                const values = context.parsed._stacks.y;
                                let stacks;
                                for (let value of Object.keys(values)) {
                                    if (parseFloat(value)) {
                                        stacks = value;
                                    }
                                }
                                //console.log(context)
                                let previousData = context.dataset.data[context.dataIndex + 1] || 0;

                                let sum = 0;
                                for (let i = 0; i <= stacks; i++) {
                                    sum += values[i];
                                }

                                //console.log(sum);
                                let percentage = (context.parsed.y * 100) / sum;
                                let difference = ((context.parsed.y - previousData) * 100) / previousData;
                                if (Math.abs(difference) == Infinity){
                                    difference = 'No previous data';
                                } else {
                                    difference = difference.toFixed(2) + '%';
                                }
                                
                                return ['Percentage of Total:   ' + percentage.toFixed(2) + '%', 
                                    'Vs Previous Month:   ' + difference];
                            },
                        }
                    }
                },
                responsive: true,
                events: ['click', 'mousemove'],
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true
                    }
                }
            },
            plugins: [htmlLegendPlugin],
        });
    } else {
        stackedChart.data = data;
        stackedChart.update();
    }

    return stackedChart;

}


//-------------------------------------------------------------------------
// Function to handle click inside a chart

function handleChartClick(e, chart, selectedValue, datasets) {
    //console.log(chart);
    var elements = chart.getElementsAtEventForMode(e, 'point', chart.options);
    if (elements.length > 0) {
        // Elements contains information about the clicked element

        // Extract the clicked element's data
        const clickedElement = elements[0];
        const datasetIndex = clickedElement.datasetIndex;
        const index = clickedElement.index; //this is the month

        // Get the type of expense
        //console.log(datasets.expense);
        let type = datasets[selectedValue].datasets[datasetIndex].label;
        //console.log(type.toLowerCase().replace(' ', '_'));

        let month = chart.data.labels[index];
        //console.log(chart.data.datasets[datasetIndex].label);
        type = chart.data.datasets[datasetIndex].label;
        type = type.toLowerCase().replace(' ','_')
        // get the list of data for each month for that expense

        const chartData = getData();

        let expenseData = chartData.doughnutData[type].datasets;
        //console.log(expenseData);
        // console.log(Object.keys(expenseData));
        let labels = [];
        let dataset = [];
        let color = getColorPalette(selectedValue);
        let backgroundColor = [];
        let i = 0;
        for (data of expenseData){
            
            labels.push(capitalizeWord(data.label));
            dataset.push(data.data[index]);
            backgroundColor.push(color[i])
            i++;
        }


        // Extract data from the clicked element for doughnut chart
        const doughnutData = {
            labels: labels,
            datasets: [
                {
                    data: dataset,
                    backgroundColor: backgroundColor,
                },
            ],
        };
        
        // Create or update the doughnut chart
        if (!doughnutChart) {
            // Create the doughnut chart
            var doughnutCtx = document.getElementById('chartDoughnut');
            doughnutChart = new Chart(doughnutCtx, {
                type: 'doughnut',
                data: doughnutData,
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: capitalizeWord(type) + 's of ' + month,
                            font: {weight: 'bold'},
                            padding: {
                                top: 30,
                                bottom:10,
                            }
                        },
                        legend: {
                            display: true,
                            position: 'bottom',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var label = context.label;
                                    var currentValue = Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }).format(context.raw);
                                    const sum = (context.dataset.data).reduce((a, b) => a + b, 0);
                                    var percentage = (context.parsed * 100) / sum;
                                    return label + ': ' + currentValue + ' (' + percentage.toFixed(2) + '%)';
                                }
                            }
                        }
                    },
                    responsive: true,
                    events: ['click', 'mousemove']
                }
            });
        } else {
            // Update the existing doughnut chart
            doughnutChart.options.plugins.title.text = capitalizeWord(type) + 's of ' + month;
            doughnutChart.data = doughnutData;
            doughnutChart.update();
        }

    }

}

//------------------------------------------------------------
// Function to create netIncomeChart


function createNetIncomeChart(ctx, mainDatasets) {
    let datasets = mainDatasets['netIncomeData'];

    let labels = [datasets.asset.labels];
    //console.log(labels);

    // Define a function to set the backgroundColor for each data point
    function setStackedBarColors(dataset, colorPalette) {
        dataset.backgroundColor = colorPalette;
        return dataset;
    }


    
    const _datasets = {asset: datasets.asset.datasets[0],
                    expense: datasets.expense.datasets[0]};

    let modifiedDatasets = [];


    for (let itemType of Object.keys(_datasets)){
        let correction = _datasets[itemType].label;
        if (correction == 'asset') {
            correction = 'revenue'
        }
        modifiedDatasets.push({
            label: capitalizeWord(correction),
            data: _datasets[itemType].data,
            backgroundColor: getColorPalette(itemType)[0],
        })
    }
    
    let data = {'labels': labels[0], 'datasets': modifiedDatasets};

    if(!netIncomeChart) {
        netIncomeChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                plugins:{
                    htmlLegend: {
                        // ID of the container to put the legend in
                        containerId: 'legend-container',
                    },
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }).format(context.parsed.y);
                                }
                                return [label];
                            },
                            afterLabel: function(context) {
                                let label = context.dataset.label || '';
                                //console.log(context);
                                //const value = context.parsed.y;

                                let previousData = context.dataset.data[context.dataIndex + 1] || 0;


                                let difference = ((context.parsed.y - previousData) * 100) / previousData;
                                if (Math.abs(difference) == Infinity){
                                    difference = 'No previous data';
                                } else {
                                    difference = difference.toFixed(2) + '%';
                                }
                                
                                //console.log(label);
                                let netIncome;
                                let revenue;
                                if (label.toLowerCase() == 'revenue')
                                {
                                    revenue = context.parsed.y;
                                    let expense = context.chart.config._config.data.datasets[1].data[context.dataIndex];
                                    netIncome = context.parsed.y - expense;
                                    //console.log(netIncome);

                                } else {
                                    revenue = context.chart.config._config.data.datasets[0].data[context.dataIndex];
                                    netIncome = revenue - context.parsed.y;
                                    //console.log(netIncome);
                                }

                                let percentageNetIncome = (netIncome * 100) / revenue;
                                netIncome = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }).format(netIncome);

                                return ['Vs Previous Month:   ' + difference, '', 
                                        'Net Income: ' + netIncome + ' (' + percentageNetIncome.toFixed(2) + '%)'];
                            },                          
                        }
                    }
                },
                responsive: true,
                events: ['click', 'mousemove'],
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                    }
                }
            },
            plugins: [htmlLegendPlugin],
        });
    } else {
        netIncomeChart.data = data;
        netIncomeChart.update();
    }

    return netIncomeChart;

}