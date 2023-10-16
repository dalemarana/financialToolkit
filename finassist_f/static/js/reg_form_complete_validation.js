// This function is to check if the registration form is complete. To be used with password_validation.js

continueBtn = document.getElementById('continue');
backBtn = document.getElementById('back');
registerBtn = document.getElementById('register');

continueBtn.addEventListener('click', () => {
    form1 = document.getElementById('regForm1');
    form2 = document.getElementById('regForm2');
    
    form1.classList.add('d-none');
    form2.classList.remove('d-none');
});

backBtn.addEventListener('click', () => {
    form1 = document.getElementById('regForm1');
    form2 = document.getElementById('regForm2');
    
    form1.classList.remove('d-none');
    form2.classList.add('d-none');
});

addEventListener('DOMContentLoaded',(event) => {
    const email = document.getElementById('email');
    const first_name = document.getElementById('first_name');
    const last_name = document.getElementById('last_name');
    const consent = document.getElementById('consent');

    // Email validity check
    email.addEventListener('focus', () => {
        if (!email.classList.contains('is-valid')) {
            email.classList.add('is-invalid');
        }
    });

    email.addEventListener('input', () => {
        let email_value = email.value
        if (String(email_value).toLowerCase().match(/^([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})$/)) {
            email.classList.remove('is-invalid');
            email.classList.add('is-valid');
            check2();
        } else {
            email.classList.remove('is-valid');
            email.classList.add('is-invalid');
        }
    });

    // Name and last name field check
    first_name.addEventListener('focus', () => {
        if (!first_name.classList.contains('is-valid')) {
            first_name.classList.add('is-invalid');
        }
    });

    first_name.addEventListener('input', () => {
        if (first_name.value.length > 3) {
            first_name.classList.remove('is-invalid');
            first_name.classList.add('is-valid');
            first_name.value = first_name.value.charAt(0).toUpperCase() + first_name.value.slice(1);
            check2();
        } else {
            first_name.classList.remove('is-valid');
            first_name.classList.add('is-invalid');
        }
    });

    last_name.addEventListener('focus', () => {
        if (!last_name.classList.contains('is-valid')) {
            last_name.classList.add('is-invalid');
        }
    });

    last_name.addEventListener('input', () => {
        if (last_name.value.length > 3) {
            last_name.classList.remove('is-invalid');
            last_name.classList.add('is-valid');
            last_name.value = last_name.value.charAt(0).toUpperCase() + last_name.value.slice(1);
            check2();
        } else {
            last_name.classList.remove('is-valid');
            last_name.classList.add('is-invalid');
        }
    });


    consent.addEventListener('focus', () => {
        if (!consent.classList.contains('is-valid')) {
            consent.classList.add('is-invalid');
        }
    });

    consent.addEventListener('input', () => {
        if (consent.checked) {
            consent.classList.remove('is-invalid');
            consent.classList.add('is-valid');
            check2();
        } else {
            consent.classList.remove('is-valid');
            consent.classList.add('is-invalid');
        }
    });



    function check2() {
        if (email.classList.contains('is-valid') && 
        first_name.classList.contains('is-valid') && 
        last_name.classList.contains('is-valid') &&
        consent.classList.contains('is-valid')) 
        {
            registerBtn.disabled = false;
        } else {
            registerBtn.disabled = true;
        }
    }

});