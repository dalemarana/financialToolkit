

addEventListener('DOMContentLoaded', (event) => {
    let gate = 0;

    // This is a function to check if username length is acceptable
    const username = document.getElementById('username');
    
    // Reset class of username
    username.addEventListener('focus', () => {
        if(!username.classList.contains('is-valid')) {
            username.classList.add('is-invalid');
        }
    });

    username.addEventListener('input', () => {
        let value = username.value;
        if (value.length < 8) {
            username.classList.remove('is-valid');
            username.classList.add('is-invalid');
        } else {
            username.classList.remove('is-invalid');
            username.classList.add('is-valid');
            check();
        }
    });


    // This is a Javascript function to dynamically check user password during registration

    const password = document.getElementById('password');
    const passwordAlert = document.getElementById('password-alert');
    const requirements = document.querySelectorAll('.requirements');
    let lengBoolean, bigLetterBoolean, numBoolean, specialCharBoolean;
    let leng = document.querySelector('.leng');
    let bigLetter = document.querySelector('.big-letter');
    let num = document.querySelector('.num');
    let specialChar = document.querySelector('.special-char');
    const specialChars = "!@#$%^&*()-_=+[{]}\\|;:'\',<.>/?`~";
    const numbers = '0123456789';

    requirements.forEach((element) => element.classList.add('wrong'));

    password.addEventListener('focus', () => {
        passwordAlert.classList.remove('d-none');
        if (!password.classList.contains('is-valid')) {
            password.classList.add('is-invalid');
        }
    });

    password.addEventListener('input', () => {
        let value = password.value;
        if (value.length < 8) {
            lengBoolean = false;
        } else if (value.length > 7) {
            lengBoolean = true;
        }

        if (value.toLowerCase() == value) {
            bigLetterBoolean = false;
        } else {
            bigLetterBoolean = true;
        }

        numBoolean = false;
        for (let i = 0; i < value.length; i++) {
            for (let j = 0; j < numbers.length; j++) {
                if (value[i] == numbers[j]) {
                    numBoolean = true;
                }
            }
        }

        specialCharBoolean = false;
        for (let i = 0; i < value.length; i++) {
            for (let j = 0; j < specialChars.length; j++) {
                if (value[i] == specialChars[j]) {
                    specialCharBoolean = true;
                }
            }
        }

        if (lengBoolean == true && bigLetterBoolean == true && numBoolean == true && specialCharBoolean == true) {
            password.classList.remove('is-invalid');
            password.classList.add('is-valid');

            requirements.forEach((element) => {
                element.classList.remove('wrong');
                element.classList.add('good');
            });
            passwordAlert.classList.remove('alert-warning');
            passwordAlert.classList.add('alert-success');

            check();

        } else {
            password.classList.remove("is-valid");
            password.classList.add("is-invalid");

            passwordAlert.classList.add("alert-warning");
            passwordAlert.classList.remove("alert-success");

            if (lengBoolean == false) {
                leng.classList.add('wrong');
                leng.classList.remove('good');
            } else {
                leng.classList.add('good');
                leng.classList.remove('wrong');
            }

            if (bigLetterBoolean == false) {
                bigLetter.classList.add('wrong');
                bigLetter.classList.remove('good');
            } else {
                bigLetter.classList.add('good');
                bigLetter.classList.remove('wrong');
            }

            if (numBoolean == false) {
                num.classList.add('wrong');
                num.classList.remove('good');
            } else {
                num.classList.add('good');
                num.classList.remove('wrong');
            }

            if (specialCharBoolean == false) {
                specialChar.classList.add('wrong');
                specialChar.classList.remove('good');
            } else {
                specialChar.classList.add('good');
                specialChar.classList.remove('wrong');
            }
        }
    });

    password.addEventListener('blur', () => {
        passwordAlert.classList.add('d-none');
    });


// This is a javascript function to check if password confirmation is matching the password
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

            check();
        } else {
            confirmation.classList.remove('is-valid');
            confirmation.classList.add('is-invalid');
        }
    });


    // Function to enable the continue button when username, password, and confirm password is ok
    continueBtn = document.getElementById('continue');

    function check() {
        if (username.classList.contains('is-valid') &&
        password.classList.contains('is-valid') &&
        confirmation.classList.contains('is-valid')) {
           continueBtn.disabled = false;
        } else {
           continueBtn.disabled = true;
        }
    }

});



