// Function for searching in a dictionary using async function
const searchField = document.getElementById('searchField');

searchField.addEventListener('input', async function() {
    let response = await fetch('/search?q=' + searchField.value);
    let vendors = await response.json();
    
    // DOM manipulation for every Input of user in the searchField
    // This loop is for the data-table manipulation
    let suggest = '';
    let html = '';
    for (let id in vendors) {     
        let transaction_date = vendors[id].transaction_date;
        let date = toDate(transaction_date);
        let transaction_info = vendors[id].transaction_info.replace('<', '&lt;').replace('&', '&amp;');
        let item_type = vendors[id].item_type ??= '';
        let card_type = vendors[id].card_type.replace('<', '&lt;').replace('&', '&amp;');
        let item_type_sel = options(id, item_type);
        let card_provider = vendors[id].card_provider.replace('<', '&lt;').replace('&', '&amp;');
        let sub_account_type = vendors[id].sub_account_type ??= '';
        let transaction_amount = vendors[id].transaction_amount;
        html += '<tr id="txRow_' + id + '" class="transactions-row align-middle" style="font-size: small;">' + 
                    '<td class="transaction_date">' + date + '</td>' +
                    '<td class="transaction_info" id="transaction_info_' + id + '">' + transaction_info + '</td>' +
                    '<td class="item_type_selected">' + capitalize(item_type.replace('_', ' ')) + '</td>' +
                    '<td class="sub_account_type" id="sub_account_type_' + id + '">' + capitalize(sub_account_type.replace('_', ' ')) + '</td>' +
                    '<td class="card_provider" id="card_provider_' + id + '">' +
                    card_provider.replace('_', ' ') + '<br>' +
                    '<small class="text-body-secondary">' + capitalize(card_type.replace('_', ' ')) + '</small>' +
                    '</td> '+
                    '<td class="transaction_amount" style="text-align: right;" id="transaction_amount_' + id + '">' + transaction_amount.toFixed(2) + '</td>' +
                    '<td id="deleteBtn_"' + id + ' class="deleteBtn">' +
                        '<button id="delete_' + id + '" type="button" class="btn btn-light delete-btn d-none" onclick="confirmDelete(event)">' +
                            '<i class="fas fa-trash-alt"></i>' +
                        '</button>' +
                        '<button id="edit_' + id + '" type="button" class="btn edit-btn btn-light">' +
                            '<i class="fas fa-edit"></i>' +
                        '</button>' +
                    '</td>' +
                '<tr>';
        
        suggest += '<option value="' + transaction_info + '">'
    }

    let targetTable = document.getElementById(searchField.getAttribute('data-table'));
    targetTable.innerHTML = html;

    // This is for the suggestive input to the user
    let suggetInput = document.getElementById(searchField.getAttribute('list'));
    suggetInput.innerHTML = suggest;
});

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
//--------------------------------------------------------------
// This is a function to return options to the main function if ID 
// item_type is given. This is not used anymore due to the introduction
// of editable rows when clicked
function options(id, item_type) {
    const item_type_options = document.getElementById('item_type_options');
    const optionsList = item_type_options.options;
    
    const item_types = [];

    for (let i = 1; i < optionsList.length; i++) {
        const option = optionsList[i];
        item_types.push(option.value);
    }

    optionsText = '<select id="' + id +'" name="transaction_"' + id +
                        '" style="width: fit-content;">' +
                        '<option value="" disabled selected>Select item type</option>';

    for (let i in item_types) {
        if (item_types[i] == item_type){
            optionsText += '<option value="' + item_types[i] +
            '" selected>' + capitalize(item_types[i].replace("_", " ")) +
            '</option>';
        } else {
            optionsText += '<option value="' + item_types[i] +
            '">' + capitalize(item_types[i].replace("_", " ")) +
            '</option>';                    
        }

    }
    optionsText += '</select>'

    return optionsText;
}

//---------------------------------------------------------------
// This is a simple function to capitalize a string
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


