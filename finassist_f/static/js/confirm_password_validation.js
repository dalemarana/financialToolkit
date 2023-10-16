addEventListener('DOMContentLoaded', (event) => {
    const password = document.getElementById('password');
    const confirmation = document.getElementById('confirmation');

    // Reset class of confirmation
    confirmation.addEventListener('focus', () => {
        if (!confirmation.classList.contains('is-valid')){
            confirmation.classList.add('is-invalid');
        }
    });

    confirmation.addEventListener('input', () => {
        let value = confirmation.value;
        let passvalue = password.value;
        if (passvalue == value) {
            confirmation.classList.remove('is-invalid');
            confirmation.classList.add('is-valid');
        } else {
            confirmation.classList.remove('is-valid');
            confirmation.classList.add('is-invalid');
        }
    });

});

