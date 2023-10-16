// This function is to validate the form in uploading the file.

addEventListener('DOMContentLoaded', (event) => {

    const file = document.getElementById('file');
    const card_provider = document.getElementById('card_provider');
    const card_type = document.getElementById('card_type');
    const date_format = document.getElementById('date_format');
    const statement_year = document.getElementById('statement_year');
    uploadBtn = document.getElementById('upload');

    // This function is to check file if it is in valid format

    // Reset class of file


    file.addEventListener('change', () => {
        if (!file.classList.contains('is-valid')) {
            file.classList.add('is-invalid');
        }
        let value = file.value;
       
        if (file.files[0].type === 'application/pdf') {
            file.classList.remove('is-invalid');
            file.classList.add('is-valid');
            check();
        } else {
            file.classList.remove('is-valid');
            file.classList.add('is-invalid');
        }
    });

    // This function is to check the user input in Card Provider/Bank Field
    
    // Reset classList of card_provider
    card_provider.addEventListener('focus', () => {
        if (!card_provider.classList.contains('is-valid')) {
            card_provider.classList.add('is-invalid');
        }
    });
    
    card_provider.addEventListener('input', () => {
        if (card_provider.value.length >= 3) {
            card_provider.classList.remove('is-invalid');
            card_provider.classList.add('is-valid');
            card_provider.value = card_provider.value.toUpperCase();
            check();
        } else {
            card_provider.classList.remove('is-valid');
            card_provider.classList.add('is-invalid');
        }
    });

    // Reset classList of statement_year
    card_type.addEventListener('focus', () => {
        if(!card_type.classList.contains('is-invalid')) {
            card_type.classList.add('is-valid');
        }
    });

    card_type.addEventListener('change', () => {
        if (card_type.value.length >= 4) {
            card_type.classList.remove('is-invalid');
            card_type.classList.add('is-valid');
            check();
        } else {
            card_type.classList.remove('is-valid');
            card_type.classList.add('is-invalid');
        }
    });
    
    
    // Reset classList of date_format
    date_format.addEventListener('focus', () => {
        if (!date_format.classList.contains('is-valid')) {
            date_format.classList.add('is-invalid');
        }
    });

    date_format.addEventListener('change', () => {
        if (date_format.value.length >= 4) {
            date_format.classList.remove('is-invalid');
            date_format.classList.add('is-valid');
            check();
        } else {
            date_format.classList.remove('is-valid');
            date_format.classList.add('is-invalid');
        }
    });

    
    // Reset classList of statement_year
    statement_year.addEventListener('focus', () => {
        if(!statement_year.classList.contains('is-invalid')) {
            statement_year.classList.add('is-valid');
        }
    });

    statement_year.addEventListener('change', () => {
        if (statement_year.value.length >= 4) {
            statement_year.classList.remove('is-invalid');
            statement_year.classList.add('is-valid');
            check();
        } else {
            statement_year.classList.remove('is-valid');
            statement_year.classList.add('is-invalid');
        }
    });

    function check() {
        if (file.classList.contains('is-valid') && 
        card_provider.classList.contains('is-valid') &&
        card_type.classList.contains('is-valid') &&
        date_format.classList.contains('is-valid') &&
        statement_year.classList.contains ('is-valid'))
        {
            uploadBtn.disabled = false;
        } else {
            uploadBtn.disabled = true;
        }
    }

});