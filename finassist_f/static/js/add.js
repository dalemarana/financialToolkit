//-------------------------------------------------------------------------------------
// Function to submit manual entry form

document.getElementById('manualForm').addEventListener('submit', (event) => {
    console.log('ok');
    event.preventDefault();

    const transactions = document.querySelectorAll('.manual-transactions');
    //console.log(transactions)
    const transactionData = []
    let tempId = 0;

    transactions.forEach((transaction) => {
        const transactionDate = transaction.querySelector('.transaction_date');
        const transactionInfo = transaction.querySelector('.transaction_info');
        const itemType = transaction.querySelector('.item_type');
        const cardProvider = transaction.querySelector('.cardprovider');
        const cardType = transaction.querySelector('.card_type');
        const transactionAmount = transaction.querySelector('.transaction_amount');

        const transactionObj = {
            tempId: tempId, // Assign a unique ID to each transaction
            transactionDate: transactionDate.value,
            transactionInfo: transactionInfo.value,
            itemType: itemType.value,
            cardProvider: (cardProvider.value).toUpperCase(),
            cardType: cardType.value,
            transactionAmount: transactionAmount.value,
        };
    
        transactionData.push(transactionObj);

        tempId ++;
    });

    //console.log(transactionData);

    const transactionList = transactionData;
    // Make an AJAX Request
    fetch('/manual_entry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
    })
    .then(response => response.json())
    .then(data => {
        // Checker
        console.log(data);
        
        if (data.message === 'Data processed successfully') {
            // update the Table
            updateTable();
            console.log('ok');

            html='';
            transactionList.forEach((transaction) => {
                html += '<tr>' +
                            '<td>' + transaction.transactionDate + '</td>' +
                            '<td>' + transaction.transactionInfo + '</td>' +
                            '<td>' + capitalize(transaction.itemType.replace('_', ' ')) + '</td>' +
                            '<td>' + capitalize(transaction.cardProvider.replace('_', ' ')) + '</td>' +
                            '<td>' + capitalize(transaction.cardType.replace('_', ' ')) + '</td>' +
                            '<td style="text-align: right;">' + (parseFloat(transaction.transactionAmount)).toFixed(2) + '</td>' +
                        '</tr>';
                });

                

            document.getElementById('manual-success-modal').innerHTML = html;
            // Show the modal
            const manualModalTrigger = document.getElementById('modalTriggerManualTransactions');
            manualModalTrigger.click();
            
        } else {
            // Handle the case when request is not successful
        }
    })
    .catch(error => {
        console.error('Error', error);
    });
});

//--------------------------------------------------------------------------------
// Function to add manual transaction rows
document.getElementById('addTransactions').addEventListener('click', () => {
    // Clone the existing group
    const inputGroup = document.querySelector('.input-group');
    const clone = inputGroup.cloneNode(true);

    // Clear input values in the cloned group
    const inputs = clone.querySelectorAll('input, select');
    inputs.forEach((input) => {
        input.value = '';
    });

    // Append the cloned input group to the form
    document.getElementById('manualForm').appendChild(clone);
    manualDelButton();
});


//-------------------------------------------------------------------------------
// Function to delete manual transaction rows

function manualDelButton() {
    manualRows = document.getElementsByClassName('manual-transactions');

    Array.from(manualRows).forEach((row) => {
        const rowDelBtn = row.querySelector('.manual-transaction-delete');
        
        rowDelBtn.addEventListener('click', (event) => {
            console.log('ok');
            row.remove();
        });
    });
}

//-------------------------------------------------------------------------------
// Function to provide suggestions to card_provider

document.addEventListener('DOMContentLoaded', () => {
    const card_provider_options = document.getElementById('card_provider_options');
    const cpOptionsList = card_provider_options.options;

    const card_providers = [];

    for (let i = 0; i < cpOptionsList.length; i++) {
        const cpOption = cpOptionsList[i];
        card_providers.push(cpOption.value);
    }

    //console.log(card_providers);

    let suggest = '';
    for (provider of card_providers) {
        suggest +=  '<option value="'+ provider.toUpperCase()+ '">';
    }

    document.getElementById('card_provider_suggest').innerHTML = suggest;

});

//--------------------------------------------------------------------------------------
// Simple function to capitalize strings
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}