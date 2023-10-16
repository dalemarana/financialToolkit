// ------------------------------------------------------------------------
// Function to make the transaction rows editable

document.addEventListener('click', (event) => {
    const clickedRow = event.target.closest('.transactions-row');

    // Check if a row was clicked
    if (clickedRow) {
        const transactionInfoCell = clickedRow.querySelector('.transaction_info');
        const itemTypeCell = clickedRow.querySelector('.item_type_selected');
        const transactionAmountCell = clickedRow.querySelector('.transaction_amount');
        const deleteBtn = clickedRow.querySelector('.delete-btn')
        const editBtn = clickedRow.querySelector('.edit-btn')

        // Check if the row is already in edit mode
        if (!clickedRow.classList.contains('edit-mode')) {
            // Add 'edit-mode' class to the row
            clickedRow.classList.add('edit-mode');

            // Show Delete Button/Hide edit Btn
            deleteBtn.classList.remove('d-none');
            editBtn.classList.add('d-none');

            // Create an input element for transactin_amount
            const transactionAmountInput = document.createElement('input');
            transactionAmountInput.value = transactionAmountCell.textContent;
            transactionAmountInput.setAttribute('type', 'number');
            transactionAmountInput.setAttribute('step', '0.01');
            transactionAmountInput.setAttribute('class', 'form-control');
            transactionAmountInput.setAttribute('style', 'font-size: small; text-align: right;');
            transactionAmountInput.setAttribute('required', true);

            // Create an input element for transaction_info
            const transactionInfoInput = document.createElement('input');
            transactionInfoInput.value = transactionInfoCell.textContent;
            // Create a select element for item_type
            const itemTypeSelect = document.createElement('select');
            const item_type_options = document.getElementById('item_type_options');
            const originalItemValue = itemTypeCell.textContent.toLowerCase().replace(' ', '_');
            //console.log(originalItemValue)
            const optionsList = item_type_options.options;
            const itemTypes = [];
            for (let i = 1; i < optionsList.length; i++) {
                const option = optionsList[i];
                itemTypes.push(option.value);
            }   
            //console.log(itemTypes);
            itemTypes.forEach((type) => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = capitalize(type.replace('_', ' '));

                // Check if the option matches the original content
                if (type == originalItemValue) {
                    option.selected = true;
                }
                
                itemTypeSelect.appendChild(option);

            });

            // Replace cell content with input and select elements
            transactionAmountCell.innerHTML = '';
            transactionAmountCell.appendChild(transactionAmountInput);

            transactionInfoCell.innerHTML = '';
            transactionInfoCell.appendChild(transactionInfoInput);

            itemTypeCell.innerHTML = '';
            itemTypeCell.appendChild(itemTypeSelect);

            // Focus on the input element
            transactionInfoInput.focus();
        }
    } else {
        // User clicked outside a row, exit edit mode for all rows
        // console.log('clicked outside');
        const rows = document.querySelectorAll('.transactions-row');
        const sortSuccessMessage = document.getElementById('sortSuccess');

        // Reset the classlist of sortSuccessMessage
        // if (sortSuccessMessage.classList.contains('alert-danger')) {
        //     sortSuccessMessage.classList.remove('alert-danger');
        //     sortSuccessMessage.textContent = '';
        // } else if (sortSuccessMessage.classList.contains('alert-success')) {
        //     sortSuccessMessage.classList.remove('alert-success');
        //     sortSuccessMessage.textContent = '';
        // }



        rows.forEach((row) => {
            if (row.classList.contains('edit-mode')){
                //console.log(row.id);
                const transactionInfoCell = row.querySelector('.transaction_info');
                const itemTypeCell = row.querySelector('.item_type_selected');
                const transactionAmountCell = row.querySelector('.transaction_amount');
                const deleteBtn = row.querySelector('.delete-btn')
                const editBtn = row.querySelector('.edit-btn')

                // Show Edit Button/Hide delete Btn
                if(editBtn.classList.contains('d-none')) {
                    editBtn.classList.remove('d-none');
                    deleteBtn.classList.add('d-none');
                }    

                // Set cell content to input/select value
                transactionAmountCell.textContent = transactionAmountCell.querySelector('input').value;
                transactionInfoCell.textContent = transactionInfoCell.querySelector('input').value;
                itemTypeCell.textContent = itemTypeCell.querySelector('select').value;
                //console.log(itemTypeCell.textContent);

                const rowData = {
                    transactionAmount: transactionAmountCell.textContent,
                    transactionInfo: transactionInfoCell.textContent,
                    itemType: itemTypeCell.textContent,
                    transactionId: row.id.replace('txRow_', ''),
                };

                fetch('/update_transaction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(rowData),
                })
                .then((response) => response.json())
                .then((data) => {
                    //console.log('Server response', data);
                    if (data.message === 'Data received successfully') {
                        updateTable();
                        // Display success message
                        // sortSuccessMessage.classList.remove('d-none');
                        // sortSuccessMessage.classList.add('alert-success');
                        // sortSuccessMessage.textContent = 'Success!';
                    } else {
                        // Handle the case when the request is not successful
                        // sortSuccessMessage.classList.remove('d-none');
                        // sortSuccessMessage.classList.add('alert-danger');
                        // sortSuccessMessage.textContent = 'Failed.'
                    }
                })
                .catch((error) => {
                    console.error('Error', error);
                })
    
                // Remove 'edit-mode' class
                row.classList.remove('edit-mode');
            }
        });
    }
});

// ------------------------------------------------------------------------


// Function to update the table
function updateTable() {
    // Make an AJAX request to fetch the updated table document
    //console.log('function is called');
    const sortForm = document.getElementById('sortForm');
    // const sortSuccessMessage = document.getElementById('sortSuccess');

    // Reset the classlist of sortSuccessMessage
    // if (sortSuccessMessage.classList.contains('alert-danger')) {
    //     sortSuccessMessage.classList.remove('alert-danger');
    //     sortSuccessMessage.textContent = '';
    // } else if (sortSuccessMessage.classList.contains('alert-success')) {
    //     sortSuccessMessage.classList.remove('alert-success');
    //     sortSuccessMessage.textContent = '';
    // }

    fetch('/get_updated_table_data', {
        method: 'GET',
    })
    .then(response => response.json()) // assuming the response is HTML
    .then(data => {
        //Update the table content with fetched HTML
        document.getElementById('all').click();
        document.querySelector('#transactionTable').innerHTML = data.table_html;
        // Display success message
        // sortSuccessMessage.classList.remove('d-none');
        // sortSuccessMessage.classList.add('alert-success');
        // sortSuccessMessage.textContent = 'Success!';        
    })
    .catch(error => {
        console.error('Error fetching table data: ', error);
        // sortSuccessMessage.classList.remove('d-none');
        // sortSuccessMessage.classList.add('alert-danger');
        // sortSuccessMessage.textContent = 'Failed.'
    });
}

//--------------------------------------------------------------------------
// Function to delete a transaction
function confirmDelete(event) {
    const idAttribute = event.currentTarget.getAttribute('id');
    const transactionId = idAttribute.replace('delete_', '');
    
    //console.log('function called');

    if (confirm('Are you sure you want to delete this transaction?')) {
        // User confirmed, make the AJAX request to delete transaction
        fetch('/delete_transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `transaction_id=${transactionId}`,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateTable();
                alert('Transaction deleted successfully.');
            } else {
                alert('Error deleting transaction.');
            }
        })
        .catch(error => {
            alert('An error occurred while deleting the transaction');
        });
    }
}

//--------------------------------------------------------------------------------------
// Simple function to capitalize strings
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}