// DOM - UTILS - having cer tain dom overing function which has been used in formutils.js by the imported
// and got declared in constant name as - DOM_API.
// search with key - DOM_API to track of all dom function to track in formutils which is used over all the functions.

/**
 * Sets data attribute and value on the closest ancestor element with the specified class name.
 * @param {string} elementName - The name of the element to search for.
 * @param {string} fieldValue - The value to check for existence before setting data.
 * @param {string} dataAttribute - The name of the data attribute to set.
 * @param {string} value - The value to set for the data attribute.
 * @param {string} ancestorClassName - The class name of the ancestor element where the data attribute will be set.
 */
const setDataAttributeOnClosestAncestor = (elementName, fieldValue, dataAttribute, value, ancestorClassName) => {
  if (!fieldValue) {
    return;
  }

  // Get the element by name
  const element = document.getElementsByName(elementName)?.[0];

  // If element exists, set data attribute on the closest ancestor with the specified class name
  if (element) {
    const closestAncestor = element.closest(`.${ancestorClassName}`);
    if (closestAncestor) {
      closestAncestor.setAttribute(dataAttribute, value);
    }
  }
};

/**
 * Sets the options of a select element based on the provided option lists.
 * @param {Array<object>} optionLists - An array of objects representing the options to be set.
 * @param {string} elementName - The name attribute of the select element.
 */
const setSelectOptions = (optionLists, elementName) => {
  const selectOption = document.querySelector(`[name=${elementName}]`);
  if (optionLists.length === 0) {
    const options = selectOption.querySelectorAll('option:not(:first-child)');
    options.forEach((option) => option.remove());
    return;
  }
  optionLists?.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option?.value;
    optionElement.textContent = option?.label;
    const parent = selectOption?.parentNode;
    selectOption?.appendChild(optionElement);
    parent?.setAttribute('data-active', true);
  });
};

/**
 * Moves the corporate card wizard view from one step to the next step.
 * @param {String} source - The name attribute of the source element (parent wizard panel).
 * @param {String} target - The name attribute of the destination element.
 */
const moveWizardView = (source, target) => {
  const navigateFrom = document.getElementsByName(source)?.[0];
  const current = navigateFrom?.querySelector('.current-wizard-step');
  const currentMenuItem = navigateFrom?.querySelector('.wizard-menu-active-item');
  const navigateTo = document.getElementsByName(target)?.[0];
  current?.classList?.remove('current-wizard-step');
  navigateTo?.classList?.add('current-wizard-step');
  // add/remove active class from menu item
  const navigateToMenuItem = navigateFrom?.querySelector(`li[data-index="${navigateTo?.dataset?.index}"]`);
  currentMenuItem?.classList?.remove('wizard-menu-active-item');
  navigateToMenuItem?.classList?.add('wizard-menu-active-item');
  const event = new CustomEvent('wizard:navigate', {
    detail: {
      prevStep: { id: current?.id, index: parseInt(current?.dataset?.index || 0, 10) },
      currStep: { id: navigateTo?.id, index: parseInt(navigateTo?.dataset?.index || 0, 10) },
    },
    bubbles: false,
  });
  navigateFrom?.dispatchEvent(event);
};

/**
 * Changes the language of the Aadhar content to the specified language.
 * @param {Object} content - The content configuration for Aadhar.
 * @param {string} defaultLang - The language to show us default.
 * @param {Object} currentFormContext - current form context to store the language selected for aadhar
 */
// select dropdow-aadhar
const aadharLangChange = async (adharContentDom, defaultLang, currentFormContext) => {
  const selectOp = adharContentDom.querySelector(`[name= ${'selectLanguage'}]`);
  const findFieldSet = adharContentDom?.querySelectorAll('fieldset');
  const selectedClass = 'selected-language';
  const defaultOptionClass = `field-aadharconsent-${defaultLang?.toLowerCase()}`;
  const applySelected = (fieldNode, optionClass, nameClass) => {
    fieldNode?.forEach((element) => {
      if (element?.classList?.contains(optionClass)) {
        element.style.display = 'block';
        element?.classList.add(nameClass);
      } else {
        element.style.display = 'none';
        element?.classList.remove(nameClass);
      }
    });
  };
  applySelected(findFieldSet, defaultOptionClass, selectedClass);
  currentFormContext.languageSelected = defaultLang;
  selectOp.value = defaultLang;
  selectOp?.addEventListener('change', (e) => {
    e.preventDefault();
    const { value: valueSelected } = e.target;
    selectOp.value = valueSelected;
    currentFormContext.languageSelected = valueSelected;
    const optionClass = `field-aadharconsent-${valueSelected?.toLowerCase()}`;
    applySelected(findFieldSet, optionClass, selectedClass);
  });
};

/**
 * Hides the incorrect OTP text message when the user starts typing in the OTP input field.
 */
const removeIncorrectOtpText = () => {
  const otpNumFormName = 'otpNumber';// constantName-otpNumberfieldName
  const otpNumbrQry = document.getElementsByName(otpNumFormName)?.[0];
  const incorectOtp = document.querySelector('.field-incorrectotptext');
  otpNumbrQry?.addEventListener('input', (e) => {
    if (e.target.value) {
      incorectOtp.style.display = 'none';
    }
  });
};

/**
 * Adds the 'wrapper-disabled' class to the parent elements of inputs or selects within the given panel
 * if their values are truthy (or) the name of the panel input is 'middleName'.
 * @param {HTMLElement} selectedPanel - The panel element containing the inputs or selects.
 */
const addDisableClass = (selectedPanel, exceptions = []) => {
  const panelInputs = Array.from(selectedPanel.querySelectorAll('input, select'));

  // Iterates over each input or select element
  panelInputs.forEach(({ value, name, parentElement }) => {
    const shouldDisable = value || name === 'middleName';
    const isException = exceptions.includes(name);
    if (shouldDisable && !isException) {
      parentElement.classList.add('wrapper-disabled');
    }
  });
};

const removeClassFormElement = (selector, classNameToRemove) => {
  const elem = document.querySelector(selector);
  if (elem) {
    elem.classList.remove(classNameToRemove);
  } else {
    console.warn(`No element found with the selector: ${selector}`);
  }
};

/**
 * Creates a label element and appends it to a specified element in the DOM.
 * @param {string} elementSelector - The CSS selector for the target element.
 * @param {string} labelClass - The class to be applied to the created label element.
 * @returns {void}
 */
const createLabelInElement = (elementSelector, labelClass) => {
  /**
* The main element in the DOM where the form resides.
* @type {HTMLElement}
*/
  const mainEl = document.getElementsByTagName('main')[0];
  /**
* The form element containing the target element.
* @type {HTMLElement}
*/
  const formEl = mainEl.querySelector('form');
  /**
* The target element to which the label will be appended.
* @type {HTMLElement}
*/
  const element = formEl.querySelector(elementSelector);
  if (!element) {
    return;
  }

  /**
* The text content of the label element.
* @type {string}
*/
  const labelText = element.getElementsByTagName('label')[0].innerHTML;
  element.getElementsByTagName('label')[0].innerHTML = '';
  if (!labelText) {
    return;
  }

  /**
* The newly created label element.
* @type {HTMLLabelElement}
*/
  const labelElement = document.createElement('label');
  labelElement.classList.add(labelClass);
  labelElement.textContent = labelText;
  element.appendChild(labelElement);
};
/**
 * Decorates the stepper for CC yourDetails panel
 * @name decorateStepper Runs after yourDetails panel is initialized
 */
function decorateStepper() {
  const totalIndex = document.querySelector('.field-corporatecardwizardview.wizard').style.getPropertyValue('--wizard-step-count');
  const ccDetailsWizard = document.querySelector('.field-corporatecardwizardview.wizard ul');
  Array.from(ccDetailsWizard.children).forEach((child) => {
    if (child.tagName.toLowerCase() === 'li' && Number(child.getAttribute('data-index')) !== totalIndex - 1) {
      child?.classList?.add('stepper-style');
    }
  });
}

/**
 * Displays a loading indicator by adding a 'preloader' class to the body container.
 * Optionally sets a loading text as a custom attribute.
 *
 * @param {string} [loadingText] - The text to display as a loading message.
 */
const displayLoader = (loadingText) => {
  const bodyContainer = document?.querySelector('.appear');
  bodyContainer?.classList?.add('preloader');
  if (loadingText) {
    bodyContainer.setAttribute('loader-text', loadingText);
  }
};

/**
 * Hides the loading indicator by removing the 'preloader' class from the body container.
 * Removes the loading text attribute if it exists.
 */
const hideLoaderGif = () => {
  const bodyContainer = document?.querySelector('.appear');
  bodyContainer?.classList?.remove('preloader');
  if (bodyContainer.hasAttribute('loader-text')) {
    bodyContainer.removeAttribute('loader-text');
  }
};

/**
 * Sets the maximum allowable date for an input field to today's date.
 * @param {string} inputName - The name attribute of the input field to be validated.
 */
const setMaxDateToToday = (inputName) => {
  if (typeof document === 'undefined') return;
  const calendarEl = document.querySelector(`[name= ${inputName}]`);
  calendarEl?.setAttribute('max', new Date()?.toISOString()?.split('T')?.[0]);
};

/**
 * Filters out non-numeric characters,spaces and special characters from the input value.
 * This function binds an 'input' event listener to the input field identified by the given name attribute.
 *
 * @param {string} inputName - The name attribute value of the input field to be validated.
 * @returns {void}
 */
const restrictToAlphabetsNoSpaces = (inputName) => {
  const inputField = document.querySelector(`[name= ${inputName}]`);
  inputField?.addEventListener('input', (e) => {
    const input = e.target;
    input.value = input.value.replace(/(?![A-Z])[`!@#$%^&*_=[\]{};':"\\|,.<>/?~0-9()+-_ ]/g, ''); // Replace non-numeric characters with an empty string
  });
};

/**
 * Groups characters in an input field, adding a space after every specified number of characters.
 *
 * @param {HTMLInputElement} inputField - The input field element whose value is to be formatted.
 * @param {number[]} gapLengths - An array of integers representing the lengths of groups between gaps.
 */
const groupCharacters = (inputField, gapLengths) => {
  const value = inputField.value.replace(/\s+/g, '');
  let formattedValue = '';
  let position = 0;
  let gapsIndex = 0;
  let gapPosition = gapLengths[gapsIndex] || Infinity;

  for (let i = 0; i < value.length; i += 1) {
    if (position === gapPosition) {
      formattedValue += ' ';
      gapsIndex += 1;
      gapPosition = gapLengths[gapsIndex] || Infinity;
      position = 0;
    }
    formattedValue += value[i];
    position += 1;
  }

  inputField.value = formattedValue;
};

/**
 * Validates and formats a phone number input field.
 *
 * @param {HTMLInputElement} inputField - The input field element containing the phone number.
 * @param {number[]} validStartingDigits - An array of valid starting digits for the phone number.
 */
const validatePhoneNumber = (inputField, validStartingDigits) => {
  let { value } = inputField;

  // Ensure the input starts with a valid digit
  if (value.length > 0 && !validStartingDigits.includes(value[0])) {
    inputField.value = '';
    return;
  }

  // Remove invalid characters (non-digits) from the entire input
  value = value.replace(/\D/g, '');

  // Check if all 10 characters would be the same
  if (value.length === 10) {
    const isAllSame = value.split('').every((digit) => digit === value[0]);
    if (isAllSame) {
      value = value.slice(0, 9); // Remove the last character to avoid all being the same
    } else {
      const firstNine = value.slice(0, 9);
      const lastDigit = value[9];
      if (firstNine.split('').every((digit) => digit === lastDigit)) {
        value = value.slice(0, 9); // Remove the last character if it's the same as the previous 9
      }
    }
  }
  inputField.value = value;
};

const validateTextInputOnPaste = (inputField, fieldRegex) => {
  const { value } = inputField;
  if (!fieldRegex.test(value)) {
    inputField.value = '';
  }
};

const validatePanInput = (panNumber) => {
  if (panNumber.length <= 5) {
    if (/^[a-zA-Z]+$/.test(panNumber) && (panNumber.length !== 4 || panNumber[3].toLowerCase() === 'p')) {
      return true;
    }
    return false;
  } if (panNumber.length <= 9) {
    return /^[a-zA-Z]{5}\d{0,4}$/.test(panNumber);
  } if (panNumber.length >= 10) {
    return /^[a-zA-Z]{3}[pP][a-zA-Z]{1}[0-9]{4}[a-zA-Z]{1}$/.test(panNumber);
  }
  return true;
};

const validateTextInput = (inputField, fieldRegex, length) => {
  let { value } = inputField;
  if (value.length > length) {
    value = value.slice(0, length);
  }
  inputField.value = value;
  if (!fieldRegex.test(value)) {
    inputField.value = value.slice(0, -1);
  }
};

const imageClickable = (selector, url, target) => {
  const element = document.querySelector(selector);
  if (element) {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      window.open(url, target);
    });
  }
};

const setArnNumberInResult = (arnNumRef, arnNumberPanel, arnNumberFieldName) => {
  const arnRefNumPanel = document.querySelector(`[name= ${arnNumberPanel}]`);
  const arnNumberElement = arnRefNumPanel.querySelector(`[name= ${arnNumberFieldName}]`);
  arnNumberElement.value = arnNumRef;
};

const addClassToElement = (selector, classNames) => {
  document.querySelector(selector)?.classList?.add(...classNames.split(' '));
};

const validateCardDigits = (inputField) => {
  let { value } = inputField;

  // Ensure the input starts with a valid digit
  if (value.length > 0 && !/\d/.test(value[0])) {
    inputField.value = '';
    return;
  }

  // Remove invalid characters (non-digits) from the entire input
  value = value.replace(/\D/g, '');

  inputField.value = value;
};

const validateOTPInput = (inputField) => {
  const { value } = inputField;

  // Ensure the input values are digits
  if (!/^\d+$/.test(value)) {
    inputField.value = inputField.value.slice(0, -1);
  }
};

/**
 * Attaches a click handler to an element that redirects to a specified URL.
 *
 * @param {string} selector - The CSS selector for the element to make clickable.
 * @param {string} url - The URL to navigate to when the element is clicked.
 * @param {string} [target='_blank'] - The target window or tab for the URL (e.g., '_blank', '_self').
 */
const attachRedirectOnClick = (selector, url, target = '_blank') => {
  const element = document.querySelector(selector);
  if (element) {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      window?.open(url, target);
    });
  }
};

const updateInnerHtml = (selectorName, updatedValue) => {
  if (typeof document !== 'undefined') document.querySelector(selectorName).innerHTML = updatedValue;
};

/**
 * Replaces specified elements with another element while retaining attributes and content.
 * @param {string} selector - The CSS selector for the elements to replace.
 * @param {string} newTag - The tag name of the new element to replace with.
 */
const replaceElementsWith = (selector, newTag, skipIndex = -1) => {
  document.querySelectorAll(selector).forEach((element, index) => {
    if (index === skipIndex) return;

    const newElement = document.createElement(newTag);
    newElement.textContent = element.value || element.textContent;

    [...element.attributes].forEach((attr) => {
      newElement.setAttribute(attr.name, attr.value);
    });

    element.parentNode.replaceChild(newElement, element);
  });
};

export {
  setDataAttributeOnClosestAncestor,
  setSelectOptions,
  moveWizardView,
  aadharLangChange,
  removeIncorrectOtpText,
  addDisableClass,
  createLabelInElement,
  decorateStepper,
  displayLoader,
  hideLoaderGif,
  setMaxDateToToday,
  restrictToAlphabetsNoSpaces,
  groupCharacters,
  validatePhoneNumber,
  validatePanInput,
  validateTextInput,
  validateTextInputOnPaste,
  setArnNumberInResult,
  addClassToElement,
  validateCardDigits,
  validateOTPInput,
  attachRedirectOnClick,
  imageClickable,
  updateInnerHtml,
  replaceElementsWith,
  removeClassFormElement,
};
