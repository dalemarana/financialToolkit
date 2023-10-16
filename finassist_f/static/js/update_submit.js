//---------------------------------------------------------------------------
// This script will handle keyword submission to the server
document.addEventListener('DOMContentLoaded', () => {
    const sortForm = document.getElementById('sortForm');
    const sortSuccessMessage = document.getElementById('sortSuccess');

    sortForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the default submission

        // Reset the classlist of sortSuccessMessage
        if (sortSuccessMessage.classList.contains('alert-danger')) {
            sortSuccessMessage.classList.remove('alert-danger');
            sortSuccessMessage.textContent = '';
        } else if (sortSuccessMessage.classList.contains('alert-success')) {
            sortSuccessMessage.classList.remove('alert-success');
            sortSuccessMessage.textContent = '';
        }

        // Get the form data
        let formData = new FormData(sortForm);

        // Make an AJAX request to server
        fetch('/update', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Checker
            //console.log(data);
            if (data.message === 'Data processed successfully') {
                // Clear the input field
                document.getElementById('searchField').value = '';
                document.getElementById('item_type_options').value = '';
                updateTable();
                // Display success message
                sortSuccessMessage.classList.remove('d-none');
                sortSuccessMessage.classList.add('alert-success');
                sortSuccessMessage.textContent = 'Success!';
            } else {
                // Handle the case when the request is not successful
                sortSuccessMessage.classList.remove('d-none');
                sortSuccessMessage.classList.add('alert-danger');
                sortSuccessMessage.textContent = 'Failed.'
            }
        })
        .catch(error => {
            console.error('Error', error);
            sortSuccessMessage.textContent = 'An error has occured.';
        });
    });
});

//-------------------------------------------------------------------------

// This function is to proceed to manual entry for additional transactions
const proceedBtn = document.getElementById('proceed');
const transactionTableForm = document.getElementById('transactionTableForm');
const proceedNext = document.getElementById('proceed_next');
const publishBtn = document.getElementById('publishBtnLi');
const proceedBtnLi = document.getElementById('proceedBtnLi');
const manualTabLi = document.getElementById('manualTab');
const manualTab = document.getElementById('manual-tab');

// Add modal with status of updated and non-updated
if (!proceedNext.classList.contains('d-none')) {
    proceedNext.classList.add('d-none');
}
if (!publishBtn.classList.contains('d-none')) {
    publishBtn.classList.add('d-none');
}
if (!manualTabLi.classList.contains('d-none')) {
    manualTabLi.classList.add('d-none');
}
if (proceedBtnLi.classList.contains('d-none')) {
    proceedBtnLi.classList.remove('d-none');
}

transactionTableForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent the default submission

    // Get the form data
    let formData = new FormData(transactionTableForm);

    // Make an AJAX request to server
    fetch('/update_main', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Checker
        //console.log(data);

        if (data.message === 'Data processed successfully') {
            // update the Table
            updateTable();
            let totalTransactions = parseInt(data.totalTransactions, 10);
            let withBlanks = parseInt(data.withBlanks, 10)

            if (!withBlanks == 0) {
                document.getElementById('serverResponse').innerHTML = '<strong>' + data.message + '</strong><br>   Total transactions: ' + data.totalTransactions +
                                            '<br>   Transactions with blanks: ' + data.withBlanks;   
            } else {
                document.getElementById('serverResponse').innerHTML = '<strong>' + data.message + '</strong><br>   Total transactions: ' + data.totalTransactions +
                                            '<br>   Transactions with blanks: ' + data.withBlanks + 
                                            '<br> <strong class="text-body-success">Expense Transactions Completed</strong>'  ;   
                proceedNext.classList.remove('d-none');
                publishBtn.classList.remove('d-none');
                manualTabLi.classList.remove('d-none');
                proceedBtn.classList.add('d-none');

            }

            // Show the modal
            const modalTrigger = document.getElementById('modalTrigger');
            modalTrigger.click();
            
        } else {
            // Handle the case when request is not successful
        }
    })
    .catch(error => {
        console.error('Error', error);
    });
});


document.getElementById('proceed_next').addEventListener('click', () => {
    document.getElementById('manual-tab').click();
})



