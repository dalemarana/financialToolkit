//-------------------------------------------------------------------------------------
// Function to submit manual entry form

document.getElementById('manualForm').addEventListener('submit', (event) => {
    //console.log('ok');
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
            // console.log('ok');

            // Hide submitted Manual transactions.
            const manualTransactions = document.querySelectorAll('.input-group.manual-transactions');
            //console.log(manualTransactions);
            manualTransactions.forEach((transaction) => {
                if (!transaction.classList.contains('d-none')) {
                    transaction.classList.add('d-none');
                }
            });

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
document.getElementById('addTransactions').addEventListener('click', addManualTransactionRow);

function addManualTransactionRow() {
    // Clone the existing group
    const inputGroup = document.querySelector('.input-group.manual-transactions');
    const clone = inputGroup.cloneNode(true);

    // Clear input values in the cloned group
    const inputs = clone.querySelectorAll('input, select');
    inputs.forEach((input) => {
        input.value = '';
    });

    // Check if display is none, and show
    if (clone.classList.contains('d-none')) {
        clone.classList.remove('d-none');
    }

    // Append the cloned input group to the form
    document.getElementById('manualForm').appendChild(clone);
    clone.querySelector('.form-control.transaction_date').focus();
    manualDelButton();
    manualEntrySuggest();
}

//-------------------------------------------------------------------------------------
// Function to handle Tab key press in the transaction_amount field
document.getElementById('manualForm').addEventListener('keydown', function (e) {
    const target = e.target;
    if (e.key === 'Tab' && target.classList.contains('transaction_amount')) {
        e.preventDefault(); // Prevent the default Tab behavior
        addManualTransactionRow();
    }
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


//--------------------------------------------------------------------------------------
// Simple function to capitalize strings
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

//--------------------------------------------------------------------------------------
// Function to Initiate Transaction info suggest

function manualEntrySuggest() {
    const transactionInfos = document.querySelectorAll('.form-control.transaction_info');
    const itemTypes = document.querySelectorAll('.form-select.item_type');
    const cardProviders = document.querySelectorAll('.form-control.cardprovider');
    const cardTypes = document.querySelectorAll('.form-select.card_type');
    const transactionAmounts = document.querySelectorAll('.form-control.transaction_amount');

    transactionInfos.forEach((transactionInfo, index) => {
        transactionInfo.addEventListener('input', async function () {
            let response = await fetch('manual_entry_suggest?q=' + transactionInfo.value);
            let suggestions = await response.json();

            //console.log(suggestions)
            let suggest = '';
            for (let id in suggestions) {
                let transaction_info = suggestions[id].transaction_info.replace('<', '&lt;').replace('&', '&amp;');
                
                suggest += '<option value="' + transaction_info + '">'
            }
            let suggestInput = document.getElementById(transactionInfo.getAttribute('list'));
            suggestInput.innerHTML = suggest;

            transactionInfo.addEventListener('blur', () => {
                //console.log(transactionInfo.value);
                const selectedTransactionInfo = transactionInfo.value;
                const suggestionArray = Object.values(suggestions);
                const selectedSuggestion = suggestionArray.find(suggestion => suggestion.transaction_info === selectedTransactionInfo);
                
                if (selectedSuggestion) {
                    itemTypes[index].value = selectedSuggestion.item_type;
                    cardProviders[index].value = selectedSuggestion.card_provider;
                    cardTypes[index].value = selectedSuggestion.card_type;
                    transactionAmounts[index].value = selectedSuggestion.transaction_amount;
                } else {
                    itemTypes[index].value = '';
                    cardProviders[index].value = '';
                    cardTypes[index].value = '';
                    transactionAmounts[index].value = '';
                }
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    manualEntrySuggest();
});


