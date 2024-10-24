import {
  validatePhoneNumber,
  validateCardDigits,
  validateOTPInput,
} from '../domutils/domutils.js';

// import semitcRedirectURI from '../../blocks/form/constant.js';
/**
 * Function validates the Mobile Input Field
 *
 */
const addMobileValidation = async () => {
  const validFirstDigits = ['6', '7', '8', '9'];
  if (typeof document === 'undefined') return;
  const inputField = document.querySelector('.field-aem-mobilenum input');
  inputField?.addEventListener('input', () => validatePhoneNumber(inputField, validFirstDigits));
};

/**
   * Function validates the Card Last 4 digits Input Field
   *
   */
const addCardFieldValidation = () => {
  if (typeof document === 'undefined') return;
  const inputField = document.querySelector('.field-aem-cardno input');
  inputField?.addEventListener('input', () => validateCardDigits(inputField));
};

/**
  * Function validates the OTP Input Field
  *
  */
const addOtpFieldValidation = () => {
  if (typeof document === 'undefined') return;
  const inputField = document.querySelector('.field-aem-otpnumber input');
  const inputField2 = document.querySelector('.field-aem-otpnumber2 input');
  [inputField, inputField2].forEach((ip) => ip?.addEventListener('input', () => validateOTPInput(ip)));
};

/**
  * Function validates the OTP Input Field
  *
  */
const linkToPopupToggle = (hyperLink, popupOverlay, popupContent, closeBtn = false, redirectBtn = false) => {
  if (typeof document === 'undefined') return;
  const links = document.querySelectorAll(hyperLink);
  let redirectionLink = '';
  [...links].forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.querySelector(popupOverlay).setAttribute('data-visible', 'true');
      document.querySelector(popupContent).setAttribute('data-visible', 'true');
      redirectionLink = link.getAttribute('href');
    });
  });

  if (closeBtn) {
    document.querySelector(closeBtn)?.addEventListener('click', (event) => {
      event.preventDefault();
      document.querySelector(popupOverlay).setAttribute('data-visible', 'false');
      document.querySelector(popupContent).setAttribute('data-visible', 'false');
    });
  }
  if (redirectBtn) {
    document.querySelector(redirectBtn).addEventListener('click', (event) => {
      event.preventDefault();
      window.open(redirectionLink, '_blank').focus();
    });
  }
};

/**
 * Retrieves the value of a query parameter from the URL, case insensitively.
 * This function searches the current URL's query parameters for a parameter that matches the provided name, ignoring case sensitivity.
 * @param {string} param - The name of the query parameter to retrieve.
 * @returns {string|null} The value of the query parameter if found; otherwise, `null`.
 */
const getUrlParamCaseInsensitive = (param) => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramEntry = [...urlSearchParams.entries()]
    .find(([key]) => key.toLowerCase() === param.toLowerCase());
  return paramEntry ? paramEntry[1] : null;
};

export {
  addMobileValidation,
  addCardFieldValidation,
  addOtpFieldValidation,
  linkToPopupToggle,
  getUrlParamCaseInsensitive,
};
