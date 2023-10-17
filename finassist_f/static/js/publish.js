//-------------------------------------------------------------------------------
// Function to Initiate Publishing of edited data

document.getElementById('publishBtn').addEventListener('click', () => {
    console.log('ok');

    fetch('/publish', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        //console.log(data[0]); // Server request status message
        //console.log(data[1]); // List of dictionaries from server
        
        if (data[0].success == true) {
            let html = '';

            //console.log('ok');

            for (let transaction of data[1]) {
                //console.log('ok');

                html += '<tr>' +
                            '<td>' + toDate(transaction.transaction_date) + '</td>' +
                            '<td>' + transaction.transaction_info + '</td>' +
                            '<td>' + capitalize(transaction.item_type.replace('_', ' ')) + '</td>' +
                            '<td>' + capitalize(transaction.card_provider.replace('_', ' ')) + '</td>' +
                            '<td>' + capitalize(transaction.card_type.replace('_', ' ')) + '</td>' +
                            '<td style="text-align: right;">' + (parseFloat(transaction.transaction_amount)).toFixed(2) + '</td>' +
                        '</tr>';
            }

            document.getElementById('publish-success-modal').innerHTML = html;
            // Show the modal
            const publishSummaryModal = document.getElementById('publishSummary');
            publishSummaryModal.click();

        } else {
            // Handle failure
        }
        

    })
    .catch(error => {
        console.error('Error', error);
    });
});

// ------------------------------------------------------------------------
// Function to update the table
function updateTable() {
    // Make an AJAX request to fetch the updated table document
    //console.log('function is called');
    const sortForm = document.getElementById('sortForm');
    const sortSuccessMessage = document.getElementById('sortSuccess');

    // Reset the classlist of sortSuccessMessage
    if (sortSuccessMessage.classList.contains('alert-danger')) {
        sortSuccessMessage.classList.remove('alert-danger');
        sortSuccessMessage.textContent = '';
    } else if (sortSuccessMessage.classList.contains('alert-success')) {
        sortSuccessMessage.classList.remove('alert-success');
        sortSuccessMessage.textContent = '';
    }

    fetch('/get_updated_table_data', {
        method: 'GET',
    })
    .then(response => response.json()) // assuming the response is HTML
    .then(data => {
        //Update the table content with fetched HTML
        document.getElementById('all').click();
        const tbody = document.querySelector('#editTbody');
        console.log(tbody);
        if (tbody) {
            tbody.innerHTML = data.table_html;
        }
        // Display success message
        sortSuccessMessage.classList.remove('d-none');
        sortSuccessMessage.classList.add('alert-success');
        sortSuccessMessage.textContent = 'Success!';        
    })
    .catch(error => {
        console.error('Error fetching table data: ', error);
        sortSuccessMessage.classList.remove('d-none');
        sortSuccessMessage.classList.add('alert-danger');
        sortSuccessMessage.textContent = 'Failed.'
    });
}


//---------------------------------------------------------------
// This is a simple function to convert dateString to date data
function toDate(dateString) {
    const date = new Date(dateString);
    const day = date.getUTCDate();
    const month = date.toLocaleString('default', {month: 'long'});
    const year = date.getUTCFullYear();
    const formattedDate = `${day} ${month} ${year}`;
    return formattedDate;
}
