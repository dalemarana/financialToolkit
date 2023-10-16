// Function to toggle column visibility
document.addEventListener('DOMContentLoaded', () => {


    function toggleColumn(columnClass, visible) {
        const columns = document.querySelectorAll(`.${columnClass}`);
        columns.forEach((column) => {
            column.style.display = visible ? '' : 'none';
        });
    }
    
    // Event Listener for checkbox changes
    const checkboxes = document.querySelectorAll('.form-check-input.column');
    checkboxes.forEach((checkbox) => {
        // Initial setting
        // const columnId = checkbox.id;
        // const isVisible = checkbox.checked;
        // toggleColumn(columnId, isVisible);

        checkbox.addEventListener('change', () => {
            columnId = checkbox.id;
            isVisible = checkbox.checked;
            toggleColumn(columnId, isVisible);
        });
    });

});



// Function to toggle rows with blanks
// BUG: after applying keyword sort, this function cannot compute rows.length properly
// this is resulting to null output on the item_type_select values.
// Solved with updateTable function

// Event Listener for radios
const transactionTable = document.getElementById('transactionTable');
const radioBtns = document.querySelectorAll('.form-check-input.radio');

radioBtns.forEach((radioBtn) => {
    radioBtn.addEventListener('change', () => {
        const radioOn = radioBtn.value;
        //console.log(radioOn);
        const rows = transactionTable.getElementsByTagName('tr');
        //console.log(rows.length);
        
        // Reset classlist of rows


        // Loop though all rows in the table
        try {
            for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header row
                const row = rows[i];
                const item_type_select = row.querySelector('.item_type_selected');

                //console.log(item_type_select);
                //console.log(item_type_select.textContent);
                if (row.classList.contains('d-none')) {
                    row.classList.remove('d-none');
                }

                
                if((!item_type_select.textContent == '') && radioOn === 'blanksOnly') {
                    row.classList.add('d-none');
                }

                // if (item_type_select.selectedIndex !== -1){
                //     const selectedValue = item_type_select.options[item_type_select.selectedIndex].value;
                //     if (!selectedValue == ''){
                //         if(row.classList.contains('d-none')) {
                //             row.classList.remove('d-none');
                //         } else {
                //             row.classList.add('d-none');
                //         }
                //     }
                // }
            }
        } catch (err) {
            console.log(err.message);
        }
    });
});


//--------------------------------------------------------------------------------
// Function to toggle with/without payments

const withoutPaymentsCheckbox = document.getElementById('withoutPayments');
const withoutPublishCheckbox = document.getElementById('withoutPublish');

document.addEventListener('DOMContentLoaded', () => {
    const rows = transactionTable.getElementsByTagName('tr');

    // console.log(withoutPaymentsCheckbox.checked)    
    try {
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const transaction_amount_cell = row.querySelector('.transaction_amount');
            const transaction_publish = row.querySelector('.publish');

            //console.log(transaction_publish.textContent);

            if (row.classList.contains('d-none')) {
                row.classList.remove('d-none');
            }

            const transaction_amount_value = parseFloat(transaction_amount_cell.textContent);

            if (transaction_amount_value < 0 && withoutPaymentsCheckbox.checked) {
                row.classList.add('d-none');
            }

            if(transaction_publish.textContent == 'published' && withoutPublishCheckbox.checked) {
                if(!row.classList.contains('d-none')) {
                    row.classList.add('d-none');
                }
            }

        }
    } catch (err) {
        console.log(err.message);
    }
});

