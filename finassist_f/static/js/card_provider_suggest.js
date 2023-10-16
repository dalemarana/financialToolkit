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