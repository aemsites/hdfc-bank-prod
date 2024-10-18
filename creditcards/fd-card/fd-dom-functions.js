import {
  groupCharacters,
  validatePhoneNumber,
} from '../domutils/domutils.js';

const addGaps = () => {
  const inputField = document.querySelector('.char-gap-4 input');
  inputField.addEventListener('input', () => groupCharacters(inputField, [5, 4]));
};

const addMobileValidation = () => {
  const validFirstDigits = ['6', '7', '8', '9'];
  const inputField = document.querySelector('.field-registeredmobilenumber input');
  inputField.addEventListener('input', () => validatePhoneNumber(inputField, validFirstDigits));
};

const readUrlParam = () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const paramValue = params.get('dob');
  if (paramValue) {
    console.log(paramValue);
  }
};

setTimeout(() => {
  addGaps();
  addMobileValidation();
  readUrlParam();
}, 500);

export {
  addGaps,
  addMobileValidation,
};
