import {
  groupCharacters,
  validatePhoneNumber,
  validatePanInput,
  createLabelInElement,
  setMaxDateToToday,
} from '../domutils/domutils.js';
import { DOM_ELEMENT } from './constant.js';

/**
 * Validates the OTP input field to ensure it contains only digits.
 *
 * @function validateOtpInput
 * @returns {void}
 */
const validateOtpInput = () => {
  const otpInputField = document.querySelector('.field-otpnumber input');
  otpInputField.placeholder = '••••••';
  otpInputField.addEventListener('input', () => {
    if (!/^\d+$/.test(otpInputField.value)) {
      otpInputField.value = otpInputField.value.slice(0, -1);
    }
  });
};

const addGaps = (elSelector) => {
  const panInputField = document.querySelector(elSelector);
  panInputField.addEventListener('input', () => {
    const vaildInput = validatePanInput(panInputField.value.replace(/\s+/g, ''));
    if (!vaildInput) {
      panInputField.value = panInputField.value.slice(0, -1);
      if (panInputField.value.length > 10) {
        panInputField.value = panInputField.value.slice(0, 9);
      }
    }
    groupCharacters(panInputField, [5, 4]);
  });
};

const addMobileValidation = () => {
  const validFirstDigits = ['6', '7', '8', '9'];
  const inputField = document.querySelector('.field-registeredmobilenumber input');
  inputField.addEventListener('input', () => validatePhoneNumber(inputField, validFirstDigits));
};

/**
 * Updates name attribute of customer id radio buttons
 *
 * @function updateElementAttr
 * @returns {void}
 */
const updateElementAttr = () => {
  const custIdRadioButtons = Array.from(document.querySelectorAll('.field-multiplecustidselect input'));
  custIdRadioButtons.forEach((radioButton) => {
    radioButton.setAttribute('name', 'cust-id-radio');
  });
};

/**
 * calls function to update checkbox to label
 *
 * @function changeCheckboxToToggle
 * @returns {void}
 */
const changeCheckboxToToggle = () => {
  createLabelInElement('.field-employeeassistancetoggle', 'employee-assistance-toggle__label');
  createLabelInElement('.field-mailingaddresstoggle', 'mailing-address-toggle__label');
};

const buttonEnableOnCheck = (selector, ctaSelector) => {
  const checkbox = document.querySelector(selector);
  const ctaButton = document.querySelector(ctaSelector);

  checkbox.addEventListener('change', () => {
    ctaButton.disabled = !checkbox.checked;
  });
};

setTimeout(() => {
  [DOM_ELEMENT.identifyYourself.dob, DOM_ELEMENT.personalDetails.dob].forEach((dateField) => setMaxDateToToday(dateField));
  addGaps('.field-pan.char-gap-4 input');
  addMobileValidation();
  document.querySelector('.field-password input').type = 'password';
}, 1200);

export {
  addGaps,
  addMobileValidation,
  validateOtpInput,
  updateElementAttr,
  changeCheckboxToToggle,
  buttonEnableOnCheck,
};
