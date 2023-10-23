//----------------------------------------------------------
// Function to manipulate headers in index
 
const headers = document.querySelectorAll('.header');
const rows = document.querySelectorAll('.transactions-row');
const datesForFilter = {};
const itemTypeFilter = {};
var structuredItemTypeFilter = {};


//-----------------------------------------------------
// Function for to make dictionary of rowIds

document.addEventListener('DOMContentLoaded', () =>{

    const monthYearOptions = document.getElementById('monthYearOptions');
    monthYearOptions.innerHTML = '';

    //const yearMonthSet = new Set();

    rows.forEach((row) => {

        const rowId = row.id;

        // For datesForFilter dictionary used for date filtering
        const rowDate = toDateDict(row.querySelector('.transaction_date').textContent);
        //console.log(rowId);
        //console.log(rowDate);
        const year = rowDate.year;
        const month = rowDate.month;

        if(!datesForFilter[year]) {
            datesForFilter[year] = {};
        }
        
        if(!datesForFilter[year][month]) {
            datesForFilter[year][month] = [];
        }

        datesForFilter[year][month].push(rowId);

        const rowItemType = row.querySelector('.item_type_selected').textContent;
        const subAccountType = row.querySelector('.sub_account_type').textContent;
        

        if (!itemTypeFilter[subAccountType]) {
            itemTypeFilter[subAccountType] = {};
        }

        if (!itemTypeFilter[subAccountType][rowItemType]) {
            itemTypeFilter[subAccountType][rowItemType] = []
        }
        itemTypeFilter[subAccountType][rowItemType].push(rowId);


    });

    //console.log(itemTypeFilter);


    initiateDateDropdown();
    //initiateItemTypeDropdown(); called this in chart.js to retrieve datastructure
});

var dateCheckboxes; 
function initiateDateDropdown() {
    // Create and populate the filter dropdown dynamically
    const years = Object.keys(datesForFilter);

    years.forEach((year) => {
        const optgroup = document.createElement('li');
        optgroup.innerHTML = `<a class="dropdown-item">
        <div class="form-check">
            <input class="form-check-input year" type="checkbox" value="${year}" id="monthYear_${year}" checked>
            <label class="form-check-label" for="monthYear_${year}" style="font-size: small; text-decoration: none;">${year}</label>
        </div>
        </a>`;

        //console.log(Object.keys(dates[year]));

        for (let month of Object.keys(datesForFilter[year])) {
            // console.log(month);
            const option = document.createElement('li');
            option.innerHTML = `<a class="dropdown-item">
            <div class="form-check">
                <input class="form-check-input month _${year}" type="checkbox" value="${year}-${month}" id="monthYear_${year}-${month}" checked>
                <label class="form-check-label" for="monthYear_${year}-${month}" style="font-size: x-small; text-decoration: none;">${month}</label>
            </div>
            </a>`;
            
            //option.textContent = month;

            optgroup.appendChild(option);
        }

        monthYearOptions.appendChild(optgroup);
    });

    dateCheckboxes = document.querySelectorAll('.form-check-input.month');
    //console.log(checkboxes);

    yearFilter();

    dateCheckboxes.forEach((checkbox) => {
        
        checkbox.addEventListener('change', () => {
            const checkboxId = checkbox.id;
            const isVisible = checkbox.checked;
    
            filterTable('date', checkboxId, isVisible);
    
        });
    });
}

//---------------------------------------------------------------------
// Select all dates
const selectAllDates = document.getElementById('selectAllMonthsYears');


selectAllDates.addEventListener('change', (event) => {
    const yearCheckboxes = document.querySelectorAll('.form-check-input.year');

    //console.log(yearCheckboxes);
    yearCheckboxes.forEach((checkbox) => {
        checkbox.checked = event.target.checked;
        //console.log('ok')
    });

    dateCheckboxes.forEach((checkbox) => {
        checkbox.checked = event.target.checked;

        filterTable('date', checkbox.id, checkbox.checked);
    });


    
});

//-------------------------------------------------------------------
// Select by year
function yearFilter() {
    const selectYear = document.querySelectorAll('.form-check-input.year');
    selectYear.forEach((year) => {
        year.addEventListener('change', (event) => {
            //console.log(year.value);
            let yearValue = year.value;
            const months = document.querySelectorAll('.form-check-input.month._' + yearValue);
            //console.log(months);
            months.forEach((month) => {
                //console.log(month.id);

                month.checked = event.target.checked;

                filterTable('date', month.id, month.checked);
            });
        });
    });
}



//-------------------------------------------------------------------------
// Toggle rows show/hide

function filterTable(head, checkboxId, isVisible) {
    //console.log(checkboxId);
    let filterRows;
    if (head =='date') {
        // Clean checkbox ID, retrieve month and year
        checkboxId = (checkboxId.replace('monthYear_', '')).split('-');
        const checkboxDetails = {'year': checkboxId[0], 'month': checkboxId[1]};

        filterRows = datesForFilter[checkboxId[0]][checkboxId[1]];
    }

    if(head == 'itemType') {
        //console.log(checkboxId);
        //console.log(isVisible);

        checkboxId = (checkboxId.replace('type_','').split('--'));
        //console.log(checkboxId);
        const checkboxDetails = {'balanceSheetAccountType': checkboxId[0],
                                'subAccountType': checkboxId[1],
                                'itemType': checkboxId[2]};
        filterRows = structuredItemTypeFilter[checkboxId[0]][checkboxId[1]][checkboxId[2]];
    }
    //console.log(filterRows);

    // Get all row ID to be hidden
    
    //console.log(datesForFilter[checkboxId[0]][checkboxId[1]]);
    if (filterRows) {
        if (isVisible) {
            rows.forEach((row) => {
                if (filterRows.includes(row.id)) {
                    //console.log(row.id);
                    if(row.classList.contains('d-none')) {
                        row.classList.remove('d-none');
                    }
                }
            });
        } else {
            rows.forEach((row) => {
                if (filterRows.includes(row.id)) {
                    //console.log(row.id);
                    if(!row.classList.contains('d-none')) {
                        row.classList.add('d-none');
                    }
                }
            });
        }
    } else {
        console.log('no rows')
    }


}
 

//-----------------------------------------------------
// Function to return month and date from a datestring

function toDateDict(dateString) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const date = new Date(dateString);
    const day = date.getUTCDate();
    const weekDay = days[date.getDay()];
    const month = date.toLocaleString('default', {month: 'long'});
    const year = date.getUTCFullYear();
    const formattedDate = {'year': year, 'month': month, 'day': day, 'weekday': weekDay};
    return formattedDate;
}





//-----------------------------------------------------
// Function for item type filter--- this function is also called in the 
// async function in chart.js to retrieve the stacked data for 
// itemType/SubAccoutType/And BalanceSheetType structure
var itemTypeCheckboxes;
function initiateItemTypeDropdown() {
    const itemTypeOptions = document.getElementById('itemTypeOptions');

    const filterSubAccountTypes = Object.keys(itemTypeFilter);
    //console.log(filterSubAccountTypes);
    
    const chartData = stackedData;

    const balanceSheetAccountTypes = Object.keys(chartData);
    //console.log(chartData);

    data = {}

    
    for (const balanceSheetAccountType of balanceSheetAccountTypes) {

        let array = chartData[balanceSheetAccountType].datasets;
        if (!data[balanceSheetAccountType]) {
            data[balanceSheetAccountType] = {};
        }
        for(let i = 0; i < array.length; i++) {
            data[balanceSheetAccountType][array[i]['label']] = {}
        }
    }

    for (const balanceSheetAccountType of balanceSheetAccountTypes) {
        const subAccountTypes = Object.keys(data[balanceSheetAccountType]);

        for (const subAccountType of subAccountTypes) {
            for(const filterSubAccountType of filterSubAccountTypes) {

                if (subAccountType.toLowerCase().replace(/ /g, '_') == filterSubAccountType.toLowerCase().replace(/ /g,'_')) {
                    const filterData = itemTypeFilter[filterSubAccountType];
                    //console.log(filterData);
                    Object.assign(
                        data[balanceSheetAccountType][subAccountType],
                        filterData
                    );
                }
                
            }
        }
    }

    structuredItemTypeFilter = data;
    //console.log(structuredItemTypeFilter);

    // Create and populate the filter dropdown dynamically

    balanceSheetAccountTypes.forEach((balanceSheetAccountType) => {
        const optgroup = document.createElement('li');
        optgroup.innerHTML = `<a class="dropdown-item">
        <div class="form-check">
            <input class="form-check-input bsat" type="checkbox" value="${balanceSheetAccountType}" id="type_${balanceSheetAccountType}" checked>
            <label class="form-check-label" for="type_${balanceSheetAccountType}" style="text-decoration: none;">${capitalizeWord(balanceSheetAccountType)}</label>
        </div>
        </a>`;


        for (let subAccountType of Object.keys(data[balanceSheetAccountType])) {

            const option = document.createElement('li');
            option.innerHTML = `<a class="dropdown-item">
            <div class="form-check">
                <input class="form-check-input subAccountType ${balanceSheetAccountType}" type="checkbox" value="${balanceSheetAccountType}--${subAccountType}" id="type_${balanceSheetAccountType}--${subAccountType}" checked>
                <label class="form-check-label" for="type_${balanceSheetAccountType}--${subAccountType}" style="font-size: small; text-decoration: none;">${capitalizeWord(subAccountType)}</label>
            </div>
            </a>`;
            
            for (let itemType of Object.keys(data[balanceSheetAccountType][subAccountType])) {

                const subOption = document.createElement('li');
                subOption.innerHTML = `<a class="dropdown-item">
                <div class="form-check">
                    <input class="form-check-input itemType ${subAccountType} ${balanceSheetAccountType}" type="checkbox" value="${balanceSheetAccountType}--${subAccountType}--${itemType}" id="type_${balanceSheetAccountType}--${subAccountType}--${itemType}" checked>
                    <label class="form-check-label" for="type_${balanceSheetAccountType}--${subAccountType}--${itemType}" style="font-size: x-small; text-decoration: none;">${itemType}</label>
                </div>
                </a>`;
                
                //console.log(itemType);
    
                option.appendChild(subOption);
            }
            //console.log(subAccountType);
            optgroup.appendChild(option);
        }
        //console.log(balanceSheetAccountType)
        itemTypeOptions.appendChild(optgroup);
    });

    itemTypeCheckboxes = document.querySelectorAll('.form-check-input.itemType');
    //console.log(itemTypeCheckboxes);

    subAccountTypeFilter();
    balanceSheetAccountFilter();
    setupSelectAllCheckbox()

    itemTypeCheckboxes.forEach((checkbox) => {
        
        checkbox.addEventListener('change', () => {
            const checkboxId = checkbox.id;
            const isVisible = checkbox.checked;
    
            filterTable('itemType', checkboxId, isVisible);
    
        });
    });

}

//----------------------------------------------------------------
// Function to filter subAccountTypeFilter

function subAccountTypeFilter() {
    const selectSubAccountTypeFilter = document.querySelectorAll('.form-check-input.subAccountType');
    
    //console.log(selectSubAccountTypeFilter);

    selectSubAccountTypeFilter.forEach((subAccountType) => {
        subAccountType.addEventListener('change', (event) => {
            //console.log(subAccountType.value);
            let subAccountTypeValue = subAccountType.value;
            subAccountTypeValue = (subAccountTypeValue.split('--'))[1];
            const itemTypes = document.querySelectorAll('.form-check-input.itemType.' + subAccountTypeValue);
            //console.log(months);
            itemTypes.forEach((itemType) => {
                //console.log(month.id);

                itemType.checked = event.target.checked;

                filterTable('itemType', itemType.id, itemType.checked);
            });
        });
    });
}

function subAccountTypeBridge(subAccountType, event) {
    let subAccountTypeValue = subAccountType.value;
    subAccountTypeValue = (subAccountTypeValue.split('--'))[1];

    const selectSubAccountTypeFilter = document.querySelectorAll('.form-check-input.subAccountType');
    //console.log(selectSubAccountTypeFilter);
    const itemTypes = document.querySelectorAll('.form-check-input.itemType.' + subAccountTypeValue);
    
    itemTypes.forEach((itemType) => {
        //console.log(month.id);
        //console.log(itemType);

        itemType.checked = event.target.checked;

        filterTable('itemType', itemType.id, itemType.checked);
    });

}

//----------------------------------------------------------------
// Function to filter balanceSheetAccountFilter

function balanceSheetAccountFilter() {
    const selectBalanceSheetAccountFilter = document.querySelectorAll('.form-check-input.bsat');
    //console.log(selectBalanceSheetAccountFilter);

    selectBalanceSheetAccountFilter.forEach((balanceSheetAccountType) => {
        balanceSheetAccountType.addEventListener('change', (event) => {

            let balanceSheetAccountTypeValue = balanceSheetAccountType.value;

            //console.log(balanceSheetAccountTypeValue);


            const subAccountTypes = document.querySelectorAll('.form-check-input.subAccountType.' + balanceSheetAccountTypeValue);
            subAccountTypes.forEach((subAccountType) => {
                subAccountType.checked = event.target.checked;
                //console.log(subAccountType);
                subAccountTypeBridge(subAccountType, event);
            });
            //subAccountTypeFilter();
        });
    });
}

//----------------------------------------------------------------
// Function SelectAll filter

function setupSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllItemTypes');
    const itemTypeCheckboxes = document.querySelectorAll('.form-check-input.itemType');
    const subAccountTypeCheckboxes = document.querySelectorAll('.form-check-input.subAccountType');
    const balanceSheetAccountTypeCheckboxes = document.querySelectorAll('.form-check-input.bsat');

    selectAllCheckbox.addEventListener('change', (event) => {
        itemTypeCheckboxes.forEach((itemType) => {
            itemType.checked = event.target.checked;
            filterTable('itemType', itemType.id, itemType.checked);
        });

        subAccountTypeCheckboxes.forEach((subAccountType) => {
            subAccountType.checked = event.target.checked;
            // If needed, call your subAccountTypeBridge function here
        });

        balanceSheetAccountTypeCheckboxes.forEach((bsat) => {
            bsat.checked = event.target.checked;
            // If needed, call your balanceSheetAccountFilter function here
        }); 

    });
}