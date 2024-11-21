/* eslint-disable no-underscore-dangle */
/* eslint no-bitwise: ["error", { "allow": ["^", ">>", "&"] }] */

import * as CONSTANT from './constants.js';
import * as DOM_API from '../creditcards/domutils/domutils.js';
import { getJsonResponse } from './makeRestAPI.js';

const {
  setDataAttributeOnClosestAncestor,
  setSelectOptions,
  moveWizardView,
  aadharLangChange,
  addDisableClass,
  createLabelInElement,
  decorateStepper,
  attachRedirectOnClick,
} = DOM_API; // DOM_MANIPULATE_CODE_FUNCTION

const { BASEURL, PIN_CODE_LENGTH } = CONSTANT;

// declare-CONSTANTS
const DATA_ATTRIBUTE_EMPTY = 'data-empty';
const ANCESTOR_CLASS_NAME = 'field-wrapper';

/**
 * Generates the full API path based on the environment.
 * @param {string} uri - The endpoint to be appended to the base URL.
 * @returns {string} - The complete API URL including the base URL and the provided endpoint.
 */

const urlPath = (path) => `${BASEURL}${path}`;

/**
 * Masks a number by replacing the specified number of leading digits with asterisks.
 * @param {number} number - The number to mask.
 * @param {number} digitsToMask - The number of leading digits to mask.
 * @returns {string} -The masked number as a string.
 */

const maskNumber = (number, digitsToMask) => {
  if (!number || Number.isNaN(number)) return '******';
  const regex = new RegExp(`^(\\d{${digitsToMask}})`);
  return number.toString().replace(regex, '*'.repeat(digitsToMask));
};

/**
 * Removes spaces and special characters from a given string.
 * @param {string} str - The input string to be cleaned
 * @returns {string} - The input string with spaces and special characters removed.
 */
const clearString = (str) => (str ? str?.replace(/[\s~`!@#$%^&*(){}[\];:"'<,.>?/\\|_+=-]/g, '') : '');

/**
 * Utility function for managing properties of a panel.
 * @param {object} globalObj - The global object containing functions.
 * @param {object} panelName - The name of the panel to manipulate.
 * @returns {void}
 */

const formUtil = (globalObj, panelName) => ({
  /**
    * Sets the visibility of the panel.
    * @param {boolean} val -The visibility value to set.
    * @returns {void}
    */
  visible: (val) => {
    globalObj.functions.setProperty(panelName, { visible: val });
  },
  /**
    * Sets the enabled/disabled state of the panel.
    * @param {boolean} val -The enabled/disabled value to set.
    * @returns {void}
    */

  enabled: (val) => {
    globalObj.functions.setProperty(panelName, { enabled: val });
  },
  /**
 * Sets the value of a panel and updates the data attribute if specified.
 * @param {any} val - The value to set for the panel.
 * @param {Object} changeDataAttr - An object containing information about whether to change the data attribute.
 * @param {boolean} changeDataAttr.attrChange - Indicates whether to change the data attribute.
 * @param {string} changeDataAttr.value - The value to set for the data attribute.
 */
  setValue: (val, changeDataAttr) => {
    globalObj.functions.setProperty(panelName, { value: val });
    if (changeDataAttr?.attrChange && val) {
      const element = document.getElementsByName(panelName._data.$_name)?.[0] || document.getElementsByName(panelName.$name)?.[0];
      if (element) {
        const closestAncestor = element.closest(`.${ANCESTOR_CLASS_NAME}`);
        if (closestAncestor) {
          closestAncestor.setAttribute(DATA_ATTRIBUTE_EMPTY, changeDataAttr.value);
        }
      }
      if (changeDataAttr?.disable && val) {
        globalObj.functions.setProperty(panelName, { readOnly: true });
      }
    }
  },
  /**
   * Sets the value of an enum field with the provided options and value.
   * @param {Array} enumOptions - An array containing the options for the enum field.
   * @param {String} val - The value to set for the enum field
   */
  setEnum: (enumOptions, val) => {
    globalObj.functions.setProperty(panelName, { enum: enumOptions, value: val }); // setting initial value among enums options
  },
  /**
   *  Resets the field by setting its value to empty and resetting floating labels.
   */
  resetField: () => {
    globalObj.functions.setProperty(panelName, { value: '' });
    const element = document.getElementsByName(panelName._data.$_name)?.[0] || document.getElementsByName(panelName.$name)?.[0];
    if (element) {
      const closestAncestor = element.closest(`.${ANCESTOR_CLASS_NAME}`);
      if (closestAncestor) {
        closestAncestor.setAttribute(DATA_ATTRIBUTE_EMPTY, true);
      }
    }
  },
});

/**
 * Gets a formatted timestamp from the provided current time.
 *
 * @param {Date} currentTime The current time to generate the timestamp from.
 * @returns {string} The formatted timestamp in 'YYYYMMDDHHmmss' format.
 */
const getTimeStamp = (currentTime) => {
  // Function to pad single digit numbers with leading zero
  const pad = (number) => ((number < 10) ? `0${number}` : number);
  // Format the datetime as desired
  const formattedDatetime = currentTime.getFullYear()
    + pad(currentTime.getMonth() + 1)
    + pad(currentTime.getDate())
    + pad(currentTime.getHours())
    + pad(currentTime.getMinutes())
    + pad(currentTime.getSeconds());
  return formattedDatetime;
};

/**
 * Gets a formatted timestamp from the provided current time without seconds.
 *
 * @param {Date} currentTime The current time to generate the timestamp from.
 * @returns {string} The formatted timestamp in 'YYYYMMDDHHmm' format.
 */
const getTimeStampNoSeconds = (currentTime) => {
  // Function to pad single digit numbers with leading zero
  const pad = (number) => (String(number).padStart(2, '0'));
  // Format the datetime as desired
  const formattedDatetime = currentTime.getFullYear()
    + pad(currentTime.getMonth() + 1)
    + pad(currentTime.getDate())
    + pad(currentTime.getHours())
    + pad(currentTime.getMinutes());
  return formattedDatetime;
};

/**
 * Converts a date string from 'YYYYMMDD' format to a localized date string.
 * @param {string} date - The date string in 'YYYYMMDD' format.
 * @returns {string} The formatted date string in 'MMM DD, YYYY' format.
 */
const convertDateToMmmDdYyyy = (date) => {
  // Extract year, month, and day parts from the input date string
  const year = date.slice(0, 4);
  const month = date.slice(4, 6).padStart(2, '0'); // Ensures zero padding for single-digit months
  const day = date.slice(6, 8).padStart(2, '0'); // Ensures zero padding for single-digit days

  // Define options for the localized date string
  const options = { month: 'short', day: 'numeric', year: 'numeric' };

  // Create a new Date object and convert it to a localized date string
  return new Date(year, month - 1, day).toLocaleDateString('en-US', options);
};

/**
 * Converts a given date to the format dd/mm/yyyy.
 * @param {Date} date - The date object to be converted.
 * @returns {string} The date string in the format dd/mm/yyyy.
 */
const convertDateToDdMmYyyy = (date) => {
  let day = date.getDate();
  let month = date.getMonth() + 1;
  const year = date.getFullYear();
  day = day < 10 ? `0${day}` : day;
  month = month < 10 ? `0${month}` : month;
  return `${day}/${month}/${year}`;
};

/**
 * Formats a given date string according to the specified format.
 * @param {string} dateString - The date string to be formatted.
 * @param {string} format - The format to apply to the date string. Possible values are 'YYYYMMDD' and 'YYYYMMDDWithTime'.
 * @returns {string} The formatted date string based on the specified format. If the format is not recognized, returns the original dateString.
 */
const dateFormat = (dateString, format) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  if (format === 'YYYYMMDD') {
    return `${year}${month}${day}`;
  } if (format === 'YYYYMMDDWithTime') {
    return `${year}-${month}-${day} 00:00:00`;
  }
  return dateString;
};

/**
 * Generates an array of objects representing different name compositions based on the provided names.
 * @param {string} fn - The first name.
 * @param {string} mn - The middle name.
 * @param {string} ln - The last name.
 * @param {string} cardType - The card type.
 * @param {number} ln - max name length.
 * @returns {Array<Object>} -  An array of objects representing different combinations of names using the provided first name (fn), middle name (mn), and last name (ln).
 */
const composeNameOption = (fn, mn, ln, cardType, maxlength) => {
  const initial = (str) => str?.charAt(0);
  const createNames = (patterns) => patterns
    .map(([a, b]) => [a, b].filter(Boolean).join(' '))
    .filter((el) => el.length <= maxlength);

  const basePatterns = [
    fn && mn ? [fn, initial(mn)] : null,
    fn && mn ? [fn, mn] : null,
    fn && ln ? [fn, ln] : null,
    mn && fn ? [mn, fn] : null,
    mn && fn ? [mn, initial(fn)] : null,
    mn && ln ? [mn, ln] : null,
    mn ? [initial(mn), fn] : null,
    mn && ln ? [initial(mn), ln] : null,
  ].filter(Boolean); // Remove nulls

  const fdExtraPatterns = [
    fn ? [fn] : null,
    mn ? [mn] : null,
    ln ? [ln] : null,
  ].filter(Boolean);

  let names = [];
  switch (cardType) {
    case 'ccc':
      names = createNames(basePatterns);
      break;
    case 'fd':
      names = createNames([...basePatterns, ...fdExtraPatterns]);
      break;
    default:
      return [];
  }

  return [...new Set(names)].map((a) => ({ label: a, value: a }));
};

/**
 * Parses the given address into substrings, each containing up to 30 characters.
 * @param {string} address - The address to parse.
 * @returns {string[]} An array of substrings, each containing up to 30 characters.
 */
const parseCustomerAddress = (address) => {
  const words = address.replace(/\s+/g, ' ').trim().split(' ');
  const substrings = [];
  let currentSubstring = '';
  words.forEach((word) => {
    if (substrings.length === 2) {
      if ((`${currentSubstring} ${word}`).trim().length <= 30) {
        currentSubstring += (currentSubstring === '' ? '' : ' ') + word;
      }
    } else if ((`${currentSubstring} ${word}`).trim().length <= 30) {
      currentSubstring += (currentSubstring === '' ? '' : ' ') + word;
    } else {
      substrings.push(currentSubstring);
      currentSubstring = word;
    }
  });
  if (currentSubstring) {
    if (substrings.length === 2 && currentSubstring.length > 30) {
      currentSubstring = currentSubstring.slice(0, 30);
    }
    substrings.push(currentSubstring);
  }
  return substrings;
};

/**
 * Removes special characters from a string, except those specified in the allowed characters string.
 *
 * @param {string} str - The input string from which special characters will be removed.
 * @param {string} allowedChars - A string containing characters that are allowed to remain in the output string.
 * @returns {string} The input string with all special characters removed, except those specified in allowedChars.
 */
const removeSpecialCharacters = (str, allowedChars) => {
  // Escape special characters in the allowed characters string
  const escapedAllowedChars = allowedChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Construct regex pattern to match special characters except those in allowedChars
  const regex = new RegExp(`[^a-zA-Z0-9,${escapedAllowedChars.replace('-', '\\-')}]`, 'g');

  // Remove special characters from the input string using the regex pattern
  return str?.replace(regex, '');
};

/**
   * Filters out all defined values from the form data using the globals object.
   * @param {object} globaObj- Globals variables object containing form configurations.
   * @returns {object} -Object containing only defined values.
   */
const santizedFormData = (globaObj) => JSON.parse(JSON.stringify(globaObj.functions.exportData()));
/**
   * Removes all undefined keys from the form datand reduces overall size of the object.
   * @param {object} jsonObj
   */
const removeUndefinedKeys = (jsonObj) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(jsonObj)) {
    if (value === null || value === undefined) delete jsonObj[key];
  }
};

/**
   * Filters out all defined values from the form data using the globals object.
   * @param {object} globaObj- Globals variables object containing form configurations.
   * * @param {object} currentFormContext - additional data variables object containing form configurations.
   * @returns {object} -Object containing only defined values.
   */
const santizedFormDataWithContext = (globals, currentFormContext) => {
  try {
    const formData = (Object.prototype.hasOwnProperty.call(globals, 'form') && Object.prototype.hasOwnProperty.call(globals, 'functions')) ? globals.functions.exportData() : globals;
    formData.currentFormContext = currentFormContext;
    if (formData.form) {
      const {
        data, analytics, queryParams, ...formDataPayload
      } = formData;
      removeUndefinedKeys(formDataPayload);
      removeUndefinedKeys(formDataPayload?.form);
      return JSON.parse(JSON.stringify(formDataPayload));
    }
    return formData;
  } catch (ex) {
    return null;
  }
};

/**
 * Generates a Version 4 UUID (Universally Unique Identifier) using a cryptographically secure method.
 * @returns {string} The generated UUID string.
 */
const generateUUID = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));

/**
 * Formate date in `DD-MM-YYYY` into string format by accepting inputDate as string.
 * @param {string} inputDate - Date string
 * @returns {string} - sring in `DD-MM-YYYY` format.
 */
const formatDate = (inputDate) => {
  const date = new Date(inputDate);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' }).substring(0, 3);
  const year = date.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  return formattedDate;
};

/**
 * To get a current dateTime format as like below based on the argument value
 * dobFormatNo: 1 (DD-MM-YYYY HH:MM:SS)
 * dobFormatNo: 2 (YYYYMMDDHHMMSS)
 * dobFormatNo: 3 (DDMMYYYYHHMMSS)
 * @param {Number} dobFormatNo - Accepts number value 1, 2 or 3 to get the format the format of time
 * @returns {string} - dobFormatNo
 */
const getCurrentDateAndTime = (dobFormatNo) => {
  const newDate = new Date();
  const year = newDate.getFullYear();
  const month = newDate.getMonth() + 1;
  const todaySDate = newDate.getDate();
  const hours = newDate.getHours();
  const minutes = newDate.getMinutes();
  const seconds = newDate.getSeconds();
  let formatedTime = '';
  switch (dobFormatNo) {
    case 1:
      formatedTime = `${todaySDate}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      break;
    case 2:
      formatedTime = `${year}${month}${todaySDate}${hours}${minutes}${seconds}`;
      break;
    case 3:
      formatedTime = `${todaySDate}${month}${year.toString().substring(2, 4)}${hours}${minutes}${seconds}`;
      break;
    default:
      formatedTime = '';
  }
  return formatedTime;
};

/**
 * Sanitizes the name for special characters.
 * @param {String} name - The name token.
 * @returns {String} sanitized name - removes special chars, spaces.
 */
const sanitizeName = (name) => name.replace(/[^a-zA-Z\s]/g, '');

/**
 * Splits a full name into its components: first name, middle name, and last name.
 *
 * @param {string} fullName - The full name to split. i.e - fistName<space>middleName<space>lastName
 * @returns {Object} An object containing the first name, middle name, and last name.
 * @property {string} firstName - The first name extracted from the full name.
 * @property {string} middleName - The middle name extracted from the full name.
 * @property {string} lastName - The last name extracted from the full name.
 */
const splitName = (fullName) => {
  const name = { firstName: '', middleName: '', lastName: '' };
  if (fullName) {
    const parts = fullName.split(' ');
    name.firstName = sanitizeName(parts.shift()) || '';
    if (parts.length > 0) {
      name.lastName = sanitizeName(parts.pop()) || '';
      name.middleName = parts.length > 0 ? sanitizeName(parts[0]) : '';
    }
  }
  return name;
};

const parseName = (fullName, maxlength) => {
  // eslint-disable-next-line prefer-const
  let [firstName, middleName = '', lastName = ''] = sanitizeName(fullName).trim().split(/\s+/).slice(0, 3);
  if (!lastName) {
    lastName = middleName;
    middleName = '';
  }
  let combinedName = `${firstName}${middleName ? ` ${middleName}` : ''}${lastName ? ` ${lastName}` : ''}`;
  if (combinedName.length <= maxlength) {
    return { firstName, middleName, lastName };
  }
  combinedName = `${firstName} ${lastName}`;
  return combinedName.length > maxlength
    ? { firstName, middleName: '', lastName: `${lastName.charAt(0)}` }
    : { firstName, middleName: '', lastName };
};

/**
 * Validates if a given date of birth falls within a specified age range.
 * @param {Number} minAge - minAge The minimum age in years.
 * @param {Number} maxAge - maxAge The maximum age in years.
 * @param {String | Date} dobValue - obValue The date of birth value to validate. It can be either a string in ISO format (e.g., "YYYY-MM-DD") or a Date object.
 * @returns {Boolean} - True if the date of birth falls within the specified age range; otherwise, false.
 */
const ageValidator = (minAge, maxAge, dobValue) => {
  const birthDate = new Date(dobValue);

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age -= 1;
  }

  return age >= minAge && age < maxAge;
};

/**
 * Formats a date string into the format "DDth MMM YYYY".
 *
 * The day of the month will have the appropriate suffix (st, nd, rd, or th).
 *
 * @param {string} dateStr - The date string in a format recognized by the `Date` constructor.
 * @returns {string} The formatted date string.
 *
 * @example
 * formatDateDDMMMYYY('2023-08-19'); // '19th Aug 2023'
 */
const formatDateDDMMMYYY = (dateStr) => {
  const dateObj = new Date(dateStr);

  const day = dateObj.getDate();
  const year = dateObj.getFullYear();

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const month = months[dateObj.getMonth()];

  const daySuffix = (d) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${day}${daySuffix(day)} ${month} ${year}`;
};

/**
 * Handles API call for validating pinCode using the pinCodeMaster function.
 * @param {object} globalObj - The global object containing necessary globals form data.
 * @param {object} cityField - The City field object from the global object.
 * @param {object} stateField - The State field object from the global object.
 * @param {object} pincodeField - The PinCode field object from the global object.
 * @param {number} pincode - The PinCode.
 */

const pinCodeMasterCheck = async (globals, cityField, stateField, pincodeField, pincode) => {
  const url = urlPath(`/content/hdfc_commonforms/api/mdm.CREDIT.SIX_DIGIT_PINCODE.PINCODE-${pincode}.json`);
  if (pincodeField?.$value?.length < PIN_CODE_LENGTH) return;
  const method = 'GET';
  const cityFieldUtil = formUtil(globals, cityField);
  const stateFieldUtil = formUtil(globals, stateField);
  const resetStateCityFields = () => {
    cityFieldUtil.resetField();
    stateFieldUtil.resetField();
    cityFieldUtil.enabled(false);
    stateFieldUtil.enabled(false);
  };
  const errorMethod = async (errStack) => {
    const { errorCode } = errStack;
    const defErrMessage = 'Please enter a valid pincode';
    if (errorCode === '500') {
      globals.functions.markFieldAsInvalid(pincodeField.$qualifiedName, defErrMessage, { useQualifiedName: true });
      resetStateCityFields();
    }
  };
  const successMethod = async (value) => {
    const changeDataAttrObj = { attrChange: true, value: false };
    globals.functions.markFieldAsInvalid(pincodeField.$qualifiedName, '', { useQualifiedName: true });
    globals.functions.setProperty(pincodeField, { valid: true });
    cityFieldUtil.setValue(value?.CITY, changeDataAttrObj);
    cityFieldUtil.enabled(false);
    stateFieldUtil.setValue(value?.STATE, changeDataAttrObj);
    stateFieldUtil.enabled(false);
  };

  try {
    const response = await getJsonResponse(url, null, method);
    globals.functions.setProperty(pincodeField, { valid: true });
    const [{ CITY, STATE }] = response;
    const [{ errorCode, errorMessage }] = response;
    if (CITY && STATE) {
      successMethod({ CITY, STATE });
    } else if (errorCode) {
      const errStack = { errorCode, errorMessage };
      throw errStack;
    }
  } catch (error) {
    errorMethod(error);
  }
};

const getUrlParamCaseInsensitive = (param) => {
  const urlSearchParams = new URLSearchParams(window.location.search);

  const paramEntry = [...urlSearchParams.entries()]
    .find(([key]) => key.toLowerCase() === param.toLowerCase());

  return paramEntry ? paramEntry[1] : null;
};

const fetchFiller4 = (mobileMatch, kycStatus, journeyType) => {
  let filler4Value = null;
  switch (kycStatus) {
    case 'aadhaar':
      // eslint-disable-next-line no-nested-ternary
      filler4Value = (journeyType === 'NTB') ? `VKYC${getCurrentDateAndTime(3)}` : ((journeyType === 'ETB') && mobileMatch) ? `NVKYC${getCurrentDateAndTime(3)}` : `VKYC${getCurrentDateAndTime(3)}`;
      break;
    case 'bioKYC':
      filler4Value = 'bioKYC';
      break;
    case 'biokyc':
      filler4Value = 'biokyc';
      break;
    case 'OVD':
      filler4Value = 'OVD';
      break;
    default:
      filler4Value = null;
  }
  return filler4Value;
};
const extractJSONFromHTMLString = (htmlString) => {
  let jsonString = htmlString.replace(/<\/?p>/g, '');
  jsonString = jsonString
    .replace(/&quot;/g, '"')
    .replace(/\\n/g, '');
  try {
    const jsonObject = JSON.parse(jsonString);
    return jsonObject;
  } catch (error) {
    return null;
  }
};

function applicableCards(employmentTypeMap, employmentType, cardMap, applicableCreditLimit) {
  const employmentCategory = employmentTypeMap[employmentType];

  const cardData = cardMap[employmentCategory];

  const matchingCard = cardData.find((entry) => {
    const [minLimit, maxLimit] = entry.creditLimit.split('-').map(Number);
    return applicableCreditLimit >= minLimit && applicableCreditLimit <= maxLimit;
  });

  return matchingCard ? matchingCard.card : [];
}

const pincodeCheck = async (pincode, city, state) => {
  const url = urlPath(`/content/hdfc_commonforms/api/mdm.CREDIT.SIX_DIGIT_PINCODE.PINCODE-${pincode}.json`);

  // Define the error handling method
  const errorMethod = () => ({ result: 'false' });

  // Define the success method
  const successMethod = (value) => {
    if (value?.CITY?.toLowerCase() === city?.toLowerCase() && value?.STATE?.toLowerCase() === state?.toLowerCase()) {
      return { result: 'true' };
    }
    return { result: 'false' };
  };

  try {
    const response = await getJsonResponse(url, null, 'GET');

    if (response && Array.isArray(response)) {
      const [{
        CITY, STATE, errorCode, errorMessage,
      }] = response;

      if (CITY && STATE) {
        return successMethod({ CITY, STATE });
      } if (errorCode) {
        throw new Error(`Error ${errorCode}: ${errorMessage}`);
      }
    }
    return { result: 'false' };
  } catch (error) {
    return errorMethod();
  }
};

const fetchFiller3 = (authMode, status) => {
  if (authMode?.toLowerCase() === 'debitcard' && status?.toLowerCase() === 'true') {
    return 'DCPINSUCCESS';
  }
  if (authMode?.toLowerCase() === 'netbanking' && status?.toLowerCase() === 'true') {
    return 'NBSUCCESS';
  }
  if (authMode?.toLowerCase() === 'aadhaarotp' && status?.toLowerCase() === 'true') {
    return 'AADHAARSUCCESS';
  }
  return '';
};

const formatIndian = (amount) => {
  const str = amount.toString();
  let lastThree = str.slice(-3);
  const otherNumbers = str.slice(0, -3);
  if (otherNumbers) {
    lastThree = `,${lastThree}`;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `₹${formatted}`;
};
/**
 * Creates a deep copy of the given blueprint object.
 *
 * This function returns a new object that is a deep copy of the blueprint object,
 * ensuring that nested objects are also copied rather than referenced.
 *
 * @param {Object} blueprint - The blueprint object to copy.
 * @returns {Object} A deep copy of the blueprint object.
 */
function createDeepCopyFromBlueprint(blueprint) {
  return JSON.parse(JSON.stringify(blueprint));
}

const generateErefNumber = () => {
  const now = new Date();

  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const firstDigitOfSeconds = String(now.getSeconds()).charAt(0);

  return `AD${year}${month}${day}${hours}${minutes}${firstDigitOfSeconds}`;
};

/**
 * Masks all characters in a string with 'X', except for the specified number of characters at the end.
 *
 * @param {string} str - The input string to be masked.
 * @param {number} [visibleCount=4] - The number of characters to leave unmasked at the end of the string. Defaults to 4.
 * @returns {string} - The masked string with only the last `visibleCount` characters visible.
 */
const maskString = (str, visibleCount = 4) => {
  if (str === undefined || str?.length <= visibleCount) return str;
  return 'X'.repeat(str.length - visibleCount) + str.slice(-visibleCount);
};

export {
  urlPath,
  maskNumber,
  clearString,
  formUtil,
  getTimeStamp,
  getTimeStampNoSeconds,
  convertDateToMmmDdYyyy,
  setDataAttributeOnClosestAncestor,
  convertDateToDdMmYyyy,
  setSelectOptions,
  composeNameOption,
  parseCustomerAddress,
  moveWizardView,
  aadharLangChange,
  removeSpecialCharacters,
  santizedFormData,
  dateFormat,
  santizedFormDataWithContext,
  generateUUID,
  formatDate,
  getCurrentDateAndTime,
  splitName,
  addDisableClass,
  createLabelInElement,
  decorateStepper,
  ageValidator,
  formatDateDDMMMYYY,
  pinCodeMasterCheck,
  getUrlParamCaseInsensitive,
  fetchFiller4,
  extractJSONFromHTMLString,
  applicableCards,
  parseName,
  sanitizeName,
  fetchFiller3,
  pincodeCheck,
  attachRedirectOnClick,
  createDeepCopyFromBlueprint,
  formatIndian,
  generateErefNumber,
  maskString,
};
