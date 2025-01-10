import {
  groupCharacters,
  validatePhoneNumber,
  validatePanInput,
  setMaxDateToToday,
} from '../domutils/domutils.js';
import openModal from '../../blocks/modal/modal.js';
import {
  DOM_ELEMENT,
} from './constant.js';

function enableSubmitOTPBtn() {
  const otpField = document.querySelector('.field-otpnumber input');
  const submitOTPBtn = document.querySelector('.field-submitotp button');
  if (otpField && submitOTPBtn) {
    otpField.addEventListener('keyup', () => {
      const otpLength = otpField.value.length;
      if (otpLength === 6) {
        submitOTPBtn.disabled = false;
      } else {
        submitOTPBtn.disabled = true;
      }
    });
  }
}

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

const addGaps = () => {
  const panInputField = document.querySelector('.field-pan input');
  panInputField?.addEventListener('input', () => {
    panInputField.value = panInputField?.value.toUpperCase();
    const validInput = validatePanInput(panInputField?.value.replace(/\s+/g, ''));
    if (!validInput) {
      panInputField.value = panInputField?.value.slice(0, -1);
      if (panInputField?.value.length > 10) {
        panInputField.value = panInputField?.value.slice(0, 9);
      }
    }
    groupCharacters(panInputField, [5, 4]);
  });
};

const addMobileValidation = () => {
  const countryCode = document.querySelector('[name="countryCode"]');
  const inputField = document.querySelector('.field-registeredmobilenumber input');
  const validateInput = () => {
    const countryCodeValue = countryCode.value.replace(/[^a-zA-Z0-9]/g, '');
    let validFirstDigits;
    if (countryCodeValue === '91') {
      validFirstDigits = ['5', '6', '7', '8', '9'];
      inputField.setAttribute('maxlength', '10');
    } else {
      validFirstDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      inputField.setAttribute('maxlength', '15');
    }
    validatePhoneNumber(inputField, validFirstDigits);
  };
  countryCode?.addEventListener('input', validateInput);
  inputField?.addEventListener('input', validateInput);
};

/**
 * Function to link a trigger element with a modal opening functionality.
 * @param {Object} config - Configuration object for the modal.
 * @param {HTMLElement} config.triggerElement - The element triggering the modal.
 * @param {HTMLElement} config.content - The content to display in the modal.
 * @param {String} [config.actionWrapClass] - Wrapper class containing all the buttons.
 * @param {Boolean} [config.reqConsentAgree=false] - Flag indicating whether consent agreement is required.
 * @param {Function} [config.updateUI] - Function for DOM manipulation upon receiving data.
 */

const linkModalFunction = (config) => {
  config?.triggerElement?.addEventListener('click', async (e) => {
    const { checked, type } = e.target;
    const checkBoxElement = (type === 'checkbox') && checked;
    const otherElement = true;
    const elementType = (type === 'checkbox') ? checkBoxElement : otherElement;
    if (elementType) {
      e.preventDefault();
      await openModal(config);
      config?.content?.addEventListener('modalTriggerValue', (event) => {
        const receivedData = event.detail;
        if (config?.updateUI) {
          config?.updateUI(receivedData);
        }
      });
    }
  });
};

// conset-1 checbox - modal
const consent1Config = {
  // config to create modal for consent-1
  triggerElement: document.getElementsByName(DOM_ELEMENT.identifyYourself.chekbox1Label)[0], // trigger element for calling modalFunction
  content: document.getElementsByName(DOM_ELEMENT.identifyYourself.consent1Content)[0], // content to display in modal
  actionWrapClass: DOM_ELEMENT.identifyYourself.modalBtnWrapper, // wrapper class containing all the buttons
  reqConsentAgree: true, // Indicates if consent agreement is needed; shows close icon if not.
  /**
  * Updates the UI based on received data.
  * @param {Object} receivedData - Data received after the modal button trigger,contains name of the btn triggered which is used to update the UI.
  */
  updateUI(receivedData) {
    if (receivedData?.checkboxConsent1CTA) {
      // iAgreeConsent2- name of the I agree btn.
      this.triggerElement.checked = true;
      this.triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (receivedData?.closeIcon) {
      // closeIcon - name of the Close x btn
      this.triggerElement.checked = false;
      this.triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
};
linkModalFunction(consent1Config);

// consent-2 checkbox - modal
const consent2Config = {
  // config to create modal for consent-2
  triggerElement: document.getElementsByName(DOM_ELEMENT.identifyYourself.chekbox2Label)?.[0], // trigger element for calling modalFunction
  content: document.getElementsByName(DOM_ELEMENT.identifyYourself.consent2Content)?.[0], // content to display in modal
  actionWrapClass: DOM_ELEMENT.identifyYourself.modalBtnWrapper, // wrapper class containing all the buttons
  reqConsentAgree: false, // Indicates if consent agreement is needed; shows close icon if not.
  /**
* Updates the UI based on received data.
 * @param {Object} receivedData - Data received after the modal button trigger,contains name of the btn triggered which is used to update the UI.
*/
  updateUI(receivedData) {
    if (receivedData?.checkboxConsent2CTA) {
      // iAgreeConsent2- name of the I agree btn.
      this.triggerElement.checked = true;
      this.triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (receivedData?.closeIcon) {
      // closeIcon - name of the Close x btn
      this.triggerElement.checked = false;
      this.triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
};
linkModalFunction(consent2Config);

// consent-2 otherProduct-text - modal
const consent2OtherProduct = document?.querySelector(DOM_ELEMENT.identifyYourself.checkbox2ProductLabel)?.querySelector('b');
const linkClass = DOM_ELEMENT.identifyYourself.anchorTagClass;
consent2OtherProduct?.classList.add(linkClass);
const consent2OtherProductTxtConfig = {
  // config to create modal for consent-2
  triggerElement: consent2OtherProduct, // trigger element for calling modalFunction
  content: consent2Config?.content, // content to display in modal
  actionWrapClass: DOM_ELEMENT.identifyYourself.modalBtnWrapper, // wrapper class containing all the buttons
  reqConsentAgree: false, // Indicates if consent agreement is needed; shows close icon if not.
  /**
 * Updates the UI based on received data.
 * @param {Object} receivedData - Data received after the modal button trigger,contains name of the btn triggered which is used to update the UI.
 */
  updateUI(receivedData) {
    const checkBox = consent2Config?.triggerElement;
    if (receivedData?.checkboxConsent2CTA) {
      // iAgreeConsent2- name of the I agree btn.
      checkBox.checked = true;
    }
    if (receivedData?.closeIcon) {
      // closeIcon - name of the Close x btn
      checkBox.checked = false;
    }
  },
};
linkModalFunction(consent2OtherProductTxtConfig);

// consent-1 requestProduct-text - modal
const consent1RequestProduct = document?.querySelector(DOM_ELEMENT.identifyYourself.checkbox1ProductLabel)?.querySelector('b');
consent1RequestProduct?.classList.add(linkClass);
const consent2RequestProductTxtConfig = {
  // config to create modal for consent-2
  triggerElement: consent1RequestProduct, // trigger element for calling modalFunction
  content: consent1Config?.content, // content to display in modal
  actionWrapClass: DOM_ELEMENT.identifyYourself.modalBtnWrapper, // wrapper class containing all the buttons
  reqConsentAgree: true, // Indicates if consent agreement is needed; shows close icon if not.
  /**
* Updates the UI based on received data.
* @param {Object} receivedData - Data received after the modal button trigger,contains name of the btn triggered which is used to update the UI.
*/
  updateUI(receivedData) {
    const checkBox = consent1Config?.triggerElement;
    if (receivedData?.checkboxConsent1CTA) {
      // iAgreeConsent2- name of the I agree btn.
      checkBox.checked = true;
    }
    if (receivedData?.closeIcon) {
      // closeIcon - name of the Close x btn
      checkBox.checked = false;
    }
  },
};
linkModalFunction(consent2RequestProductTxtConfig);

setTimeout(() => {
  setMaxDateToToday('dateOfBirth');
  addMobileValidation();
  document.querySelector('.field-password input').type = 'password';
}, 1200);

export {
  enableSubmitOTPBtn,
  addGaps,
  addMobileValidation,
  validateOtpInput,
};
