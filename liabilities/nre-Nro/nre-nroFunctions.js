/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import {
  createJourneyId,
  nreNroInvokeJourneyDropOffByParam,
  invokeJourneyDropOffUpdate,
  postIdCommRedirect,
} from './nre-nro-journey-utils.js';
// import {
//   moveWizardView,
// } from '../domutils/domutils.js';
import {
  ageValidator,
  clearString,
  urlPath,
  getTimeStamp,
  maskNumber,
  moveWizardView,
  formUtil,
  convertDateToMmmDdYyyy,
  santizedFormDataWithContext,
} from '../../common/formutils.js';
import {
  displayLoader,
  hideLoaderGif,
  fetchJsonResponse,
} from '../../common/makeRestAPI.js';
import * as NRE_CONSTANT from './constant.js';
import {
  ENDPOINTS,
  CURRENT_FORM_CONTEXT as currentFormContext,
  FORM_RUNTIME as formRuntime,
} from '../../common/constants.js';
import {
  NRENROENDPOINTS,
} from './constant.js';
import {
  sendAnalytics,
} from './analytics.js';
import { reloadPage } from '../../common/functions.js';

setTimeout(async () => {
  if (typeof window !== 'undefined') {
    const { addGaps, validateOtpInput, enableSubmitOTPBtn } = await import('./nre-nro-dom-functions.js');
    addGaps();
    validateOtpInput();
    enableSubmitOTPBtn();
  }
}, 1200);

let prevSelectedIndex = -1;
let defaultDropdownIndex = -1;
let resendOtpCount = 0;
const MAX_OTP_RESEND_COUNT = 3;
const OTP_TIMER = 30;
let MAX_COUNT = 3;
let sec = OTP_TIMER;
let dispSec = OTP_TIMER;

const { CHANNEL, JOURNEY_NAME, VISIT_MODE } = NRE_CONSTANT;
// Initialize all NRE/NRO Journey Context Variables.
currentFormContext.journeyName = JOURNEY_NAME;
currentFormContext.journeyType = 'NTB';
currentFormContext.errorCode = '';
currentFormContext.errorMessage = '';
currentFormContext.eligibleOffers = '';
currentFormContext.selectedCheckedValue = 0;
currentFormContext.productAccountType = '';
currentFormContext.productAccountName = '';
currentFormContext.journeyAccountType = '';
currentFormContext.countryName = '';

formRuntime.getOtpLoader = currentFormContext.getOtpLoader || (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.otpValLoader = currentFormContext.otpValLoader || (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.hideLoader = (typeof window !== 'undefined') ? hideLoaderGif : false;

function customerDataMasking(fieldName, value) {
  if (value != null && value !== undefined && value.length > 0) {
    let splittedValue; let adress; let adressLength; let cityLength; let city; let country; let contryLength;

    switch
    (fieldName) {
      case
        'cutomerIDMasking':
        if (value.length > 7) {
          const last4 = value.slice(-4); // Extract the last 4 digits
          const masked = value.slice(0, -4).replace(/./g, '*'); // Mask all digits except the last 4
          return `${masked} ${last4}`;
        }
        return '';

      case
        'accountNumberMasking':
        if (value.length > 12) {
          const strNum = value.toString();

          // Mask the first 10 digits with '*' and format with spaces
          const masked = `**** **** **${strNum.slice(-4, -2)} ${strNum.slice(-2)}`;

          return masked;
        }
        return '';

      case
        'PANnmbr':// check legth 10
        if (value.length === 10) {
          const PANvalue = value;
          const maskdPAN = PANvalue.substring(0, 2) + '*'.repeat(2) + PANvalue.substring(4, 5) + '*'.repeat(4) + PANvalue.substring(9, 10);
          return maskdPAN;
        }
        return '';

      case
        'eMail': // checck length after splitting
        if (value.includes('@' && '.')) {
          splittedValue = value.split('@');
          const username = splittedValue[0];
          const userlength = username.length;
          const postSplit = splittedValue[1].split('.');
          const domain = postSplit[0];
          const domainLength = domain.length;
          let part1;
          if (userlength > 1) {
            part1 = username.replace(username.substring(1, (userlength - 1)), '*'.repeat(userlength - 2));
          } else {
            part1 = username;
          }
          const part2 = domain.replace(domain.substring(1, (domainLength)), '*'.repeat(domainLength - 1));
          return `${part1}@${part2}.com`;
        }
        return '';

      case
        'AddressLine': // string length

        adress = value.trim();
        adressLength = adress.length;
        if (adressLength > 1) {
          const maskdAdress = adress.replace(adress.substring(adressLength - Math.round(0.80 * adressLength), adressLength), '*'.repeat(adressLength - (adressLength - Math.round(0.80 * adressLength))));
          return maskdAdress;
        }
        return '';

      case
        'CityState':
        city = value;
        cityLength = city.length;
        if (cityLength > 1) {
          const maskdCity = city.replace(city.substring(1, cityLength - 1), '*'.repeat(cityLength - 2));
          return maskdCity;
        }
        return value;

      case
        'Country':
        country = value;
        contryLength = country.length;
        if (contryLength > 1) {
          const maskdCountry = country.replace(country.substring(1, contryLength), '*'.repeat(contryLength - 1));
          return maskdCountry;
        }
        return '';

      default: return '';
    }
  } else {
    return '';
  }
}

const validFDPan = (val) => {
  if (val?.length !== 12) return false;
  if (![...val.slice(0, 5)]?.every((c) => /[a-zA-Z]/.test(c))) return false;
  return true;
};

function isNullOrEmpty(value) {
  return value == null || value.trim() === '';
}

const getCountryName = (countryCodeIst) => new Promise((resolve) => {
  const finalURL = `/content/hdfc_commonforms/api/mdm.COMMON.COUNTRYCODE_MASTER.COUNTRYCODE-${countryCodeIst}.json`;
  fetchJsonResponse(urlPath(finalURL), null, 'GET', true)
    .then((response) => {
      const country = response[0];
      const description = country.DESCRIPTION;
      currentFormContext.countryName = description;
      resolve(description);
    })
    .catch((error) => {
      console.error('Error while getting country data:', error);
    });
});

function errorHandling(response, journeyState, globals) {
  const {
    mobileNumber,
    leadProfileId,
    journeyID,
  } = currentFormContext;
  if (response.errorCode === '02') {
    globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.incorrectOTPText, { visible: true });
  } else if (response.errorCode === '04') {
    document.body.classList.add('errorPageBody');
    document.body.classList.remove('wizardPanelBody');
    globals.functions.setProperty(globals.form.otppanelwrapper, { visible: false });
    globals.functions.setProperty(globals.form.errorPanel.errorresults.incorrectOTPPanel, { visible: true });
  } else if (response.errorCode === 'V01' || response.errorCode === 'V02' || response.errorCode === 'V03' || response.errorCode === 'V04'
    || response.errorCode === 'V05' || response.errorCode === 'VO6' || response.errorCode === 'V07' || response.errorCode === 'V08'
    || response.errorCode === 'V09' || response.errorCode === 'V10' || response.errorCode === 'V11' || response.errorCode === 'V12') {
    document.body.classList.add('errorPageBody');
    document.body.classList.remove('wizardPanelBody');
    globals.functions.setProperty(globals.form.otppanelwrapper, { visible: false });
    globals.functions.setProperty(globals.form.errorPanel.errorresults.differentErrorCodes, { visible: true });
  } else {
    document.body.classList.add('errorPageBody');
    document.body.classList.remove('wizardPanelBody');
    globals.functions.setProperty(globals.form.otppanelwrapper, { visible: false });
    globals.functions.setProperty(globals.form.wizardPanel, { visible: false });
    globals.functions.setProperty(globals.form.errorPanel.errorresults.errorConnection, { visible: true });
  }

  invokeJourneyDropOffUpdate(journeyState, mobileNumber, leadProfileId, journeyID, globals);
}

/**
 * Validates the date of birth field to ensure the age is between 18 and 120.
 * @param {Object} globals - The global object containing necessary data for DAP request.
*/

const validateLogin = (globals) => {
  const mobileNo = globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.registeredMobileNumber.$value;
  const isdCode = (globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.countryCode.$value)?.replace(/[^a-zA-Z0-9]+/g, '');
  const dobValue = globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.dateOfBirth.$value;
  const panValue = globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.pan.$value;
  const panDobSelection = globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.panDobSelection.$value;
  const radioSelect = (panDobSelection === '0') ? 'DOB' : 'PAN';
  const consentFirst = globals.form.parentLandingPagePanel.landingPanel.consentsFragmentNreNro.checkboxConsent1Label.$value;
  const panErrorText = 'Please enter a valid PAN Number';
  const isdNumberPattern = /^(?!0)([5-9]\d{9})$/;
  const panIsValid = validFDPan(panValue);
  const nonISDNumberPattern = /^(?!0)\d{3,15}$/;
  currentFormContext.isdCode = isdCode;
  globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: false });

  const panInput = document?.querySelector(`[name=${'pan'} ]`);
  const panWrapper = panInput?.parentElement;

  switch (radioSelect) {
    case 'DOB':
      if (dobValue && String(new Date(dobValue).getFullYear()).length === 4) {
        const minAge = 18;
        const maxAge = 120;
        const dobErrorText = `Age should be between ${minAge} to ${maxAge}`;
        const ageValid = ageValidator(minAge, maxAge, dobValue);
        if (ageValid && consentFirst && mobileNo) {
          globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: true });
          globals.functions.markFieldAsInvalid('$form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.dateOfBirth', '', { useQualifiedName: true });
        }
        if (ageValid) {
          globals.functions.markFieldAsInvalid('$form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.dateOfBirth', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.dateOfBirth, { valid: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.dobErrorText, { visible: false });
        }
        if (!ageValid) {
          globals.functions.markFieldAsInvalid('$form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.dateOfBirth', dobErrorText, { useQualifiedName: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.dobErrorText, { visible: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: false });
        }
        if (!consentFirst && !ageValid && !mobileNo) {
          globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: false });
        }
      }
      break;
    case 'PAN':
      panWrapper?.setAttribute('data-empty', true);
      if (panValue) {
        panWrapper?.setAttribute('data-empty', false);
        if (panIsValid && consentFirst && mobileNo) {
          globals.functions.markFieldAsInvalid('$form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.pan', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: true });
        }
        if (panIsValid) {
          globals.functions.markFieldAsInvalid('$form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.pan', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.pan, { valid: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.panErrorText, { visible: false });
        }
        if (!panIsValid) {
          globals.functions.markFieldAsInvalid('$form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.pan', panErrorText, { useQualifiedName: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.panErrorText, { visible: true });
          globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: false });
        }
        if (!consentFirst && !mobileNo && !panIsValid) {
          globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: false });
        }
      }
      break;
    default:
      globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: false });
  }
  if (mobileNo && ((isdCode === '91' && !isdNumberPattern.test(mobileNo))
    || (isdCode !== '91' && !nonISDNumberPattern.test(mobileNo)))) {
    globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.registerMobileNumberError, { visible: true });
    globals.functions.setProperty(globals.form.parentLandingPagePanel.getOTPbutton, { enabled: false });
  } else {
    globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.registerMobileNumberError, { visible: false });
  }
};

const getOtpNRE = (mobileNumber, pan, dob, globals) => {
  /* jidTemporary  temporarily added for FD development it has to be removed completely once runtime create journey id is done with FD */
  const jidTemporary = createJourneyId(VISIT_MODE, JOURNEY_NAME, CHANNEL, globals);
  const [year, month, day] = dob.$value ? dob.$value.split('-') : ['', '', ''];
  currentFormContext.action = 'getOTP';
  currentFormContext.journeyID = globals.form.runtime.journeyId.$value || jidTemporary;
  currentFormContext.mobileNumber = mobileNumber.$value;
  currentFormContext.leadIdParam = globals.functions.exportData().queryParams;
  currentFormContext.journeyName = globals.form.runtime.journeyName.$value;
  let identifierNam = '';
  let identifierVal = '';
  let datOfBirth = '';
  if (pan.$value != null) {
    identifierNam = 'PAN';
    identifierVal = pan.$value;
    dob.$value = '';
    datOfBirth = '';
  } else {
    identifierNam = 'DOB';
    identifierVal = dob.$value;
    pan.$value = '';
    datOfBirth = year + month + day;
  }
  // currentFormContext.isdCode = '91'; // TODO : Comment
  const jsonObj = {
    requestString: {
      mobileNumber: currentFormContext.isdCode + mobileNumber.$value,
      dateOfBirth: datOfBirth,
      panNumber: clearString(pan.$value || ''),
      journeyID: globals.form.runtime.journeyId.$value ?? jidTemporary,
      journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
      identifierValue: clearString(identifierVal),
      identifierName: identifierNam,
      getEmail: 'Y',
    },
  };

  const path = urlPath(ENDPOINTS.customerOtpGen);
  formRuntime?.getOtpLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
};

const getCountryCodes = (dropdown) => {
  const finalURL = '/content/hdfc_commonforms/api/mdm.ETB.NRI_ISD_MASTER.COUNTRYNAME-.json';
  fetchJsonResponse(urlPath(finalURL), null, 'GET', true).then((response) => {
    dropdown?.addEventListener('change', () => {
      if (prevSelectedIndex !== -1) {
        dropdown.remove(prevSelectedIndex);
      }
      const selectedIndex = dropdown.selectedIndex; // eslint-disable-line prefer-destructuring
      const selectedOption = dropdown.options[selectedIndex];
      const selectedOptionText = selectedOption.text;
      const selectedOptionVal = selectedOption.value;
      const newOption = document.createElement('option');
      newOption.value = selectedOptionVal;
      newOption.text = selectedOptionText;
      dropdown.options[selectedIndex].text = selectedOptionVal;
      dropdown.options[selectedIndex].style.display = 'none';
      dropdown.add(newOption, selectedIndex + 1);
      prevSelectedIndex = selectedIndex;
    });
    if (dropdown) {
      dropdown.innerHTML = '';
    }
    const newOptionTemp = document.createElement('option');
    newOptionTemp.value = '+91';
    newOptionTemp.textContent = 'INDIA (+91)';
    dropdown?.appendChild(newOptionTemp);
    const newOptionTemp1 = document.createElement('option');
    newOptionTemp1.value = '+291';
    newOptionTemp1.textContent = 'Eritrea (+291)';
    dropdown?.appendChild(newOptionTemp1);
    defaultDropdownIndex = 0;
    response.forEach((countryCode) => {
      if (countryCode.ISDCODE != null && countryCode.DESCRIPTION != null) {
        const val = ` +${String(countryCode.ISDCODE)}`;
        const key = `${countryCode.DESCRIPTION} (${val})`;
        const newOption = document.createElement('option');
        newOption.value = val;
        newOption.textContent = key;
        dropdown?.appendChild(newOption);
        if (val === ' +91') {
          defaultDropdownIndex = (dropdown?.options.length ?? 1) - 1;
        }
      }
    });
    if (dropdown) {
      dropdown.selectedIndex = 0;
      if (defaultDropdownIndex !== -1) {
        dropdown.selectedIndex = defaultDropdownIndex;
      }
    }
    const event = new Event('change', {
      bubbles: true, // Allow the event to bubble up
      cancelable: true, // Allow the event to be canceled
    });
    dropdown?.dispatchEvent(event);
  }).catch((error) => {
    console.error('Dropdown Promise rejected:', error); // Handle any error (failure case)
  });
};

/**
 * Starts the Nre_Nro OTPtimer for resending OTP.
 * @param {Object} globals - The global object containing necessary data for DAP request.
*/
function otpTimer(globals) {
  if (resendOtpCount < MAX_OTP_RESEND_COUNT) {
    globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.secondsPanel, { visible: true });
    globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.otpResend, { visible: false });
  } else {
    globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.secondsPanel, { visible: false });
  }
  const timer = setInterval(() => {
    sec -= 1;
    dispSec = sec;
    if (sec < 10) {
      dispSec = `0${sec}`;
    }
    globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.secondsPanel.seconds, { value: dispSec });
    if (sec < 0) {
      clearInterval(timer);
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.secondsPanel, { visible: false });
      if (resendOtpCount < MAX_OTP_RESEND_COUNT) {
        globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.otpResend, { visible: true });
      }
    }
  }, 1000);
}

function updateOTPHelpText(mobileNo, otpHelpText, email, globals) {
  const emailText = !isNullOrEmpty(email) ? ` & email ID ${customerDataMasking('eMail', email)}` : '';
  const maskedMobile = maskNumber(mobileNo, 6);

  globals.functions.setProperty(otpHelpText, { value: `${otpHelpText} ${maskedMobile}${emailText}` });
  globals.functions.setProperty(globals.form.otppanelwrapper.submitOTP, { enabled: false });
  const otpField = document.querySelector('.field-otpnumber input');
  otpField.addEventListener('mouseover', () => {
    otpField.focus();
  });
}

/**
 * validates the otp
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @return {PROMISE}
 */
function otpValidationNRE(mobileNumber, pan, dob, otpNumber, globals) {
  const referenceNumber = `AD${getTimeStamp(new Date())}` ?? '';
  currentFormContext.referenceNumber = referenceNumber;
  currentFormContext.leadProfileId = globals.form.runtime.leadProifileId.$value;
  let datOfBirth = '';
  if (pan.$value != null) {
    dob.$value = '';
    datOfBirth = '';
  } else {
    pan.$value = '';
    datOfBirth = clearString(dob.$value) || '';
  }
  const jsonObj = {
    requestString: {
      mobileNumber: currentFormContext.isdCode + mobileNumber.$value,
      passwordValue: otpNumber.$value,
      dateOfBirth: datOfBirth,
      panNumber: clearString(pan.$value) || '',
      journeyID: currentFormContext.journeyID,
      journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
      referenceNumber: referenceNumber ?? '',
    },
  };

  const path = urlPath(ENDPOINTS.otpValidationFatca);
  formRuntime?.otpValLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
}

function setupBankUseSection(mainBankUsePanel, globals) {
  /* eslint-disable prefer-destructuring */
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {};
  const lgCode = mainBankUsePanel.lgCode;
  const lcCode = mainBankUsePanel.lcCode;
  const toggle = mainBankUsePanel.bankUseToggle;
  const resetAllBtn = mainBankUsePanel.resetAllBtn;
  globals.functions.setProperty(toggle, { checked: true });
  if (urlParams.size > 0) {
    ['lgCode', 'lcCode'].forEach((param) => {
      const value = urlParams.get(param);
      if (value) {
        utmParams[param] = value;
      }
    });

    globals.functions.setProperty(lgCode, { value: utmParams.lgCode });
    globals.functions.setProperty(lcCode, { value: utmParams.lcCode });
  } else {
    globals.functions.setProperty(lcCode, { value: 'NRI INSTASTP' });
  }
  globals.functions.setProperty(resetAllBtn, { enabled: false });
  globals.functions.setProperty(toggle, { enabled: true });
  globals.functions.setProperty(lcCode, { enabled: false });
}

function showFinancialDetails(financialDetails, response, occupation, globals) {
  const customerAMLDetails = response.customerAMLDetailsDTO[0];
  const {
    codOccupation: occupationCode,
    typCompany: typCompanyCode,
    natureOfBus: natureOfBusCode,
    incomeSource: incomeSourceCode,
    annualTurnover: annualTurnoverCode,
    typResidence: residenceTypeMappingCode,
    txtProfessionDesc: txtProfessionDescCode,
    typEmployer: employeerCatCode,
  } = customerAMLDetails;

  const setDropdownValue = (name, code) => {
    const mappedValue = document.querySelector(`[name=${name}]`);
    if (mappedValue && customerAMLDetails != null) {
      const item = Array.from(mappedValue.options).find((option) => option.value === code);
      if (item) {
        mappedValue.value = code;
        return item.text;
      }
      mappedValue.value = '';
      return 'Others';
    }
    return '';
  };

  const occupationText = setDropdownValue('occupationDropdown', occupationCode);
  const residenceTypeProfText = setDropdownValue('residenceTypeMapping', residenceTypeMappingCode);
  const natureOfBusinessText = setDropdownValue('natureOfBusinessMapping', natureOfBusCode);
  const typeOfCompanyText = setDropdownValue('typeOfCompanyMapping', typCompanyCode);
  const sourceOfFundText = setDropdownValue('sourceOfFundMapping', incomeSourceCode);
  const grossAnnualIncomeText = setDropdownValue('grossAnnualIncomeMapping', annualTurnoverCode);
  const selfEmployedProfText = setDropdownValue('selfEmployedProfMapping', txtProfessionDescCode);
  const employeerCatCodeText = setDropdownValue('employerCategoryMapping', employeerCatCode);

  globals.functions.setProperty(financialDetails.residenceType, { visible: true, value: residenceTypeProfText?.toUpperCase() });
  globals.functions.setProperty(financialDetails.grossAnnualIncome, { visible: true, value: grossAnnualIncomeText?.toUpperCase() });
  globals.functions.setProperty(financialDetails.currencyName, { visible: true });
  globals.functions.setProperty(financialDetails.sourceOfFunds, { visible: true, value: sourceOfFundText?.toUpperCase() });
  globals.functions.setProperty(financialDetails.occupation, { value: occupationText?.toUpperCase() });
  globals.functions.setProperty(financialDetails.selfEmployedProfessional, { value: selfEmployedProfText?.toUpperCase() });
  globals.functions.setProperty(financialDetails.natureOfBusiness, { value: natureOfBusinessText?.toUpperCase() });
  globals.functions.setProperty(financialDetails.typeOfCompoanyFirm, { value: typeOfCompanyText?.toUpperCase() });
  globals.functions.setProperty(financialDetails.employerCategory, { value: employeerCatCodeText?.toUpperCase() });

  if (occupationCode === 2) {
    globals.functions.setProperty(financialDetails.selfEmployedProfessional, { visible: true });
    globals.functions.setProperty(financialDetails.employerCategory, { visible: true });
  }
  if (occupationCode === 3) {
    globals.functions.setProperty(financialDetails.selfEmployedSince, { visible: true });
    globals.functions.setProperty(financialDetails.natureOfBusiness, { visible: true });
    globals.functions.setProperty(financialDetails.typeOfCompoanyFirm, { visible: true });
  }
  if (occupationCode === 5) {
    globals.functions.setProperty(financialDetails.sourceOfFunds, { visible: false });
    globals.functions.setProperty(financialDetails.typeOfCompoanyFirm, { visible: true });
    globals.functions.setProperty(financialDetails.selfEmployedProfessional, { visible: true });
    globals.functions.setProperty(financialDetails.selfEmployedSince, { visible: true });
    globals.functions.setProperty(financialDetails.natureOfBusiness, { visible: true });
  }
}

function showNomineeDetails(nomineeDetails, response, globals) {
  const accIndex = currentFormContext.selectedCheckedValue;
  const nomineeName = response.customerAccountDetailsDTO[0].nomineeNam;
  const nomineeDob = response.customerAccountDetailsDTO[0].nomineeDOB;
  const relationCode = response.customerAccountDetailsDTO[accIndex].codRel;
  const relationDropdown = document.querySelector('[name=relationShipDropdown]');
  relationDropdown.value = relationCode;
  const setDropdownValue = (dropdown, code) => {
    const item = Array.from(dropdown.options).find((option) => option.value === code);
    if (item) {
      dropdown.value = code;
      return item.text;
    }
    dropdown.value = '';
    return 'Others';
  };
  const relationText = setDropdownValue(relationDropdown, relationCode);
  if (nomineeName !== null) {
    globals.functions.setProperty(nomineeDetails, { visible: true });
    const formattedDate = convertDateToMmmDdYyyy(nomineeDob);
    globals.functions.setProperty(nomineeDetails.nomineePanel.nomineeSubpanel.relation, { value: relationText?.toUpperCase() });
    globals.functions.setProperty(nomineeDetails.nomineePanel.nomineeSubpanel.nomineeName, { value: nomineeName?.toUpperCase() });
    globals.functions.setProperty(nomineeDetails.nomineePanel.nomineeSubpanel.nomineedob, { value: formattedDate });
    globals.functions.setProperty(nomineeDetails.nomineePanel.nomineeSubpanel.nomineedob, { visible: true });
    globals.functions.setProperty(nomineeDetails.nonomineeText, { visible: false });
  } else if (nomineeName === null) {
    globals.functions.setProperty(nomineeDetails.nomineePanel, { visible: false });
    globals.functions.setProperty(nomineeDetails.nonomineeText, { visible: true });
    globals.functions.setProperty(nomineeDetails.nomineePanel.nomineeSubpanel, { visible: false });
    globals.functions.setProperty(nomineeDetails.nomineePanel.nomineeSubpanel.textnominee, { visible: false });
  }
}

function prefillCustomerDetail(response, globals) {
  const {
    personalDetails,
    fatcaDetails,
    financialDetails,

  } = globals.form.wizardPanel.wizardFragment.wizardNreNro.confirmDetails.confirmDetailsAccordion;

  // const changeDataAttrObj = { attrChange: true, value: false, disable: true };

  const setFormValue = (field, value) => {
    globals.functions.setProperty(field, { value });
  };
  // globals.functions.setProperty(globals.form.runtime.fatca_response, { value: response });
  setFormValue(personalDetails.emailID, customerDataMasking('eMail', response.refCustEmail)?.toUpperCase());
  setFormValue(personalDetails.fullName, response.customerFullName?.toUpperCase());
  setFormValue(personalDetails.mobileNumber, `+${currentFormContext.isdCode} ${maskNumber(currentFormContext.mobileNumber, 6)}`);
  setFormValue(personalDetails.pan, customerDataMasking('PANnmbr', response.refCustItNum)?.toUpperCase());
  if (!response.refCustTelex) globals.functions.setProperty(personalDetails.telephoneNumber, { visible: false });
  else setFormValue(personalDetails.telephoneNumber, response.refCustTelex?.toUpperCase());

  setFormValue(personalDetails.communicationAddress, `${response.txtCustadrAdd1.trim()}, ${response.txtCustadrAdd2.trim()}, ${response.txtCustadrAdd3.trim()}, ${response.namCustadrCity}, ${response.namCustadrState}, ${response.namCustadrCntry}, ${response.txtCustadrZip}`?.toUpperCase());

  setFormValue(personalDetails.permanentAddress, `${customerDataMasking('AddressLine', response.txtPermadrAdd1)} ${customerDataMasking('AddressLine', response.txtPermadrAdd2)}, ${customerDataMasking('AddressLine', response.txtPermadrAdd3)},
${customerDataMasking('CityState', response.namPermadrCity)}, ${customerDataMasking('CityState', response.namPermadrState)}, ${customerDataMasking('Country', response.namPermadrCntry)}, ${response.txtPermadrZip}`?.toUpperCase());

  getCountryName(response.txtCustNATNLTY)
    .then(() => setFormValue(fatcaDetails.nationality, currentFormContext.countryName?.toUpperCase()));
  getCountryName(response.customerFATCADtlsDTO[0].codTaxCntry1)
    .then(() => setFormValue(fatcaDetails.countryTaxResidence, currentFormContext.countryName?.toUpperCase()));
  getCountryName(response.customerFATCADtlsDTO[0].codCntryBirth?.toUpperCase())
    .then(() => setFormValue(fatcaDetails.countryOfBirth, currentFormContext.countryName?.toUpperCase()));
  // setFormValue(fatcaDetails.nationality, currentFormContext.countryName?.toUpperCase());
  // setFormValue(fatcaDetails.countryTaxResidence, response.customerFATCADtlsDTO[0].codTaxCntry1?.toUpperCase());
  setFormValue(fatcaDetails.taxIdNumber, response.customerFATCADtlsDTO[0].tinNo1);
  setFormValue(fatcaDetails.addressForTaxPurpose, response.customerFATCADtlsDTO[0].typAddrTax1);
  setFormValue(fatcaDetails.taxIdType, response.customerFATCADtlsDTO[0].typTinNo1);
  setFormValue(fatcaDetails.cityOfBirth, response.customerFATCADtlsDTO[0].namCityBirth?.toUpperCase());
  // setFormValue(fatcaDetails.countryOfBirth, response.customerFATCADtlsDTO[0].codCntryBirth?.toUpperCase());
  setFormValue(fatcaDetails.fathersName, response.customerFATCADtlsDTO[0].namCustFather?.toUpperCase());
  setFormValue(fatcaDetails.mothersName, response.namMotherMaiden?.toUpperCase());
  setFormValue(fatcaDetails.spousesName, response.customerFATCADtlsDTO[0].namSpouseCust?.toUpperCase());
  setFormValue(financialDetails.employeerName, response.customerFATCADtlsDTO[0].namCustEmp);
  setFormValue(financialDetails.selfEmployedSince, response.customerAMLDetailsDTO[0].selfEmpFrom);
  setFormValue(financialDetails.dateOfIncorporation, response.datIncorporated);
  setFormValue(financialDetails.currencyName, response.customerAMLDetailsDTO[0].namCcy);
  setFormValue(financialDetails.pepDeclaration, response.customerAMLDetailsDTO[0].amlCod1);
  // setFormValue(financialDetails.codeOccupation, response.customerAMLDetailsDTO[0].codOccupation);
}

function prefillAccountDetail(response, i, responseLength, globals) {
  const {
    customerName,
    customerID,
    singleAccount,
    multipleAccounts,
    custIDWithoutMasking,
  } = globals.form.wizardPanel.wizardFragment.wizardNreNro.selectAccount;

  const setFormValue = (field, value) => {
    globals.functions.setProperty(field, { value });
  };
  setFormValue(customerName, response.customerFullName?.toUpperCase());
  setFormValue(custIDWithoutMasking, response.customerId);
  if (responseLength > 1) {
    setFormValue(customerID, customerDataMasking('cutomerIDMasking', response.customerId.toString()));
    setFormValue(multipleAccounts.multipleAccountRepeatable[i].accountNumber, customerDataMasking('accountNumberMasking', response.customerAccountDetailsDTO[0].accountNumber));
    setFormValue(multipleAccounts.multipleAccountRepeatable[i].multiSubPanel.accountType, response.customerAccountDetailsDTO[i].productName?.toUpperCase());
    setFormValue(multipleAccounts.multipleAccountRepeatable[i].multiIFSCBranchPanel.branch, response.customerAccountDetailsDTO[i].branchName?.toUpperCase());
    setFormValue(multipleAccounts.multipleAccountRepeatable[i].multiIFSCBranchPanel.ifscCode, response.customerAccountDetailsDTO[i].ifscCode?.toUpperCase());
  } else {
    setFormValue(singleAccount.customerID, customerDataMasking('cutomerIDMasking', response.customerId.toString()));
    setFormValue(singleAccount.accountNumber, customerDataMasking('accountNumberMasking', response.customerAccountDetailsDTO[0].accountNumber));
    setFormValue(singleAccount.accountType, response.customerAccountDetailsDTO[0].productName?.toUpperCase());
    setFormValue(singleAccount.branch, response.customerAccountDetailsDTO[0].branchName?.toUpperCase());
    setFormValue(singleAccount.ifsc, response.customerAccountDetailsDTO[0].ifscCode?.toUpperCase());
  }
  setTimeout(() => {
    globals.functions.setProperty(globals.form.wizardPanel.wizardFragment.accountsuccessMsg, { visible: false });
  }, 5000);
  prefillCustomerDetail(currentFormContext.fatca_response, globals);
}

function multiCustomerId(response, selectAccount, singleAccountCust, multipleAccountsPanel, globals) {
  const accountDetailsList = response.customerAccountDetailsDTO;
  const responseLength = accountDetailsList.length;
  currentFormContext.journeyAccountType = response.customerAccountDetailsDTO[0].productTypeDescription;
  currentFormContext.fatca_response = response;
  if (responseLength === 1 && currentFormContext.journeyAccountType === 'NRE') {
    globals.functions.setProperty(selectAccount.nro_account_type_pannel, { visible: true });
    globals.functions.setProperty(selectAccount.nre_account_type_pannel.nreeliteSavingsAccountPanel.eliteSavingsAccount, { value: null });
  } else if (responseLength === 1 && currentFormContext.journeyAccountType === 'NRO') {
    globals.functions.setProperty(selectAccount.nre_account_type_pannel, { visible: true });
    globals.functions.setProperty(selectAccount.nro_account_type_pannel.eliteSavingsAccountPanel.eliteSavingsAccount, { value: null });
  }

  // globals.functions.setProperty(globals.form.wizardPanel.wizardFragment.wizardNreNro.selectAccount.multipleAccounts.multipleAccountRepeatable[0]?.AccountNumber, { value: accountDetailsList[0].accountNumber });
  if (responseLength > 1) {
    globals.functions.setProperty(singleAccountCust, { visible: false });
    globals.functions.setProperty(multipleAccountsPanel, { visible: true });
    globals.functions.setProperty(globals.form.wizardPanel.continue, { visible: false });
    globals.functions.setProperty(globals.form.wizardPanel.MultiAccoCountinue, { visible: true });
    accountDetailsList.forEach((accountDetail, i) => {
      if (i < accountDetailsList.length - 1) {
        globals.functions.dispatchEvent(multipleAccountsPanel.multipleAccountRepeatable, 'addItem');
      }
      setTimeout(() => {
        const radioButtons = Array.from(document.querySelectorAll('.field-multiplecustidaccount input'));
        radioButtons.forEach((radioButton, index) => {
          const setIndexValue = index;
          radioButton.setAttribute('name', 'cust-id-radio');
          radioButton.setAttribute('value', setIndexValue);
          if (index === 0) {
            radioButton.checked = true;
            currentFormContext.selectedCheckedValue = setIndexValue;
          }
          radioButton.addEventListener('click', () => {
            const checkedValue = radioButtons.find((checkVal) => checkVal.checked)?.value;
            currentFormContext.selectedCheckedValue = checkedValue;
          });
        });
        prefillAccountDetail(response, i, responseLength, globals);
      }, 1000);
    });
  } else {
    globals.functions.setProperty(globals.form.wizardPanel.MultiAccoCountinue, { visible: false });
    prefillAccountDetail(response, responseLength - 1, responseLength, globals);
  }
}

function selectSingleAccount(globals) {
  prefillCustomerDetail(currentFormContext.fatca_response, globals);
}

/**
 * @name resendOTP
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @return {PROMISE}
 */
const resendOTP = async (globals) => {
  const {
    mobileNumber,
    journeyID,
  } = currentFormContext;

  dispSec = OTP_TIMER;
  const mobileNo = globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.registeredMobileNumber;
  const panValue = globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.pan;
  const dobValue = globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.identifierPanel.dateOfBirth;
  globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.otpResend, { visible: false });
  globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.secondsPanel, { visible: true });
  globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.secondsPanel.seconds, { value: dispSec });
  globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.incorrectOTPText, { visible: false });
  globals.functions.setProperty(globals.form.otppanelwrapper.submitOTP, { enabled: false });
  if (resendOtpCount < MAX_OTP_RESEND_COUNT) {
    resendOtpCount += 1;

    const otpResult = await getOtpNRE(mobileNo, panValue, dobValue, globals);
    invokeJourneyDropOffUpdate('CUSTOMER_LEAD_QUALIFIED_SUCESS', mobileNumber, globals.form.runtime.leadProifileId.$value, journeyID, globals);
    globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.secondsPanel.seconds, { value: dispSec });
    if (otpResult && otpResult.customerIdentificationResponse.existingCustomer === 'Y') {
      sec = OTP_TIMER;
      otpTimer(globals);
    } else {
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.errorMessage, { visible: true, message: otpResult.message });
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.otpResend, { visible: true });
    }

    if (resendOtpCount === MAX_OTP_RESEND_COUNT) {
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.secondsPanel, { visible: false });
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.otpResend, { visible: false });
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.maxAttemptMessage, { visible: true });
    }
    return otpResult;
  }

  return null; // Return null if max attempts reached
};

/**
   * Creates an IdCom request object based on the provided global data.
   * @param {Object} globals - The global object containing necessary data for IdCom request.
   * @returns {Object} - The IdCom request object.
   */
const createIdComRequestObj = (globals) => {
  const formData = santizedFormDataWithContext(globals);
  const idComObj = {
    requestString: {
      CustID: globals.form.wizardPanel.wizardFragment.wizardNreNro.selectAccount.custIDWithoutMasking.$value,
      ProductCode: 'ADETBACO',
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      journeyID: formData.journeyId,
      journeyName: formData.journeyName,
      scope: 'ADOBE_ACNRI',
    },
  };
  return idComObj;
};

/**
   * Fetches an authentication code from the API.
   *
   * This function creates an idcomm request object, constructs the API endpoint URL,
   * and then sends a POST request to the endpoint to fetch the authentication code.
   * @name fetchAuthCode
   * @params {object} globals
   * @returns {Promise<Object>} A promise that resolves to the JSON response from the API.
   */
const fetchAuthCode = (globals) => {
  currentFormContext.VISIT_TYPE = 'IDCOMM';
  const idComRequest = createIdComRequestObj(globals);
  const apiEndPoint = urlPath(ENDPOINTS.fetchAuthCode);
  return fetchJsonResponse(apiEndPoint, idComRequest, 'POST');
};

function customFocus(numRetries, globals) {
  MAX_COUNT -= 1;
  if (MAX_COUNT >= resendOtpCount) {
    globals.functions.setProperty(numRetries, { value: `${MAX_COUNT}/${MAX_OTP_RESEND_COUNT}` });
  } else {
    globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel, { visible: false });
    globals.functions.setProperty(globals.form.errorPanel.errorresults.incorrectOTPPanel, { visible: true });
    globals.functions.setProperty(globals.form.otppanelwrapper.submitOTP, { visible: false });
  }
}

async function idComRedirection(globals) {
  const {
    mobileNumber,
    leadProfileId,
    journeyID,
  } = currentFormContext;
  const resp = await fetchAuthCode(globals);
  if (resp.status.errorMessage === 'Success') {
    await globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.idcom_token, { value: resp.authCode });
    await invokeJourneyDropOffUpdate('IDCOM_REDIRECTION_INITIATED', mobileNumber, leadProfileId, journeyID, globals);
    window.location.href = resp.redirectUrl;
  }
}

function parseDate(dateString) {
  if (dateString.length !== 8) {
    throw new Error("Invalid date format. Expected 'YYYYMMDD'.");
  }
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  return `${day}/${month}/${year}`;
}

/**
 * @name finalResult - constant-variables store
 */
const finalResult = {
  journeyParamState: null,
  journeyParamStateInfo: null,
};

/**
 * Prefills the Thank You page based on the DB
 * @returns {void}
 */
function prefillThankYouPage(accountres, globals) {
  const { thankyouLeftPanel } = globals.form.thankYouPanel.thankYoufragment;

  globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false });
  globals.functions.setProperty(globals.form.thankYouPanel, { visible: true });
  const journeyAccountType = finalResult.journeyParamStateInfo.currentFormContext.journeyAccountType === 'NRE' ? 'NRO' : 'NRE';
  globals.functions.setProperty(thankyouLeftPanel.successfullyText, { value: `<p>Yay! ${journeyAccountType} account opened successfully.</p>` });

  const setAccountSummaryProperties = (summary) => {
    globals.functions.setProperty(thankyouLeftPanel.accountSummary.accounttype, { value: currentFormContext.selectedAccountName });
    globals.functions.setProperty(thankyouLeftPanel.accountSummary.homeBranch, { value: currentFormContext.fatca_response.customerAccountDetailsDTO[currentFormContext.selectedCheckedValue].branchName });
    globals.functions.setProperty(thankyouLeftPanel.accountSummary.branchCode, { value: currentFormContext.fatca_response.customerAccountDetailsDTO[currentFormContext.selectedCheckedValue].branchCode });
    globals.functions.setProperty(thankyouLeftPanel.accountSummary.ifsc, { value: currentFormContext.fatca_response.customerAccountDetailsDTO[currentFormContext.selectedCheckedValue].ifscCode });
    globals.functions.setProperty(thankyouLeftPanel.accountSummary.communicationAddress, { value: summary.form.confirmDetails.personalDetails.communicationAddress });
  };

  const journeyInfo = finalResult.journeyParamStateInfo;

  if (!isNullOrEmpty(accountres?.accountNumber)) {
    globals.functions.setProperty(thankyouLeftPanel.accountNumber.accountNumber, { visible: true });
    globals.functions.setProperty(thankyouLeftPanel.accountNumber.accountNumber, { value: accountres.accountNumber }); // Setting the account number
    setAccountSummaryProperties(journeyInfo);
    invokeJourneyDropOffUpdate('CUSTOMER_ONBOARDING_COMPLETE', currentFormContext.mobileNumber, currentFormContext.leadProfileId, currentFormContext.journeyId, globals);
  } else if (!isNullOrEmpty(finalResult.journeyParamStateInfo.form.confirmDetails.crm_leadId)) {
    globals.functions.setProperty(thankyouLeftPanel.accountNumber.leadId_number, { visible: true });
    globals.functions.setProperty(thankyouLeftPanel.accountNumber.accountNumber, { visible: false });
    globals.functions.setProperty(thankyouLeftPanel.accountNumber.leadId_number, { value: finalResult.journeyParamStateInfo.form.confirmDetails.crm_leadId });
    globals.functions.setProperty(thankyouLeftPanel.accountNumber.confirmText, { value: 'Congratulations! Your online application is successfully submitted !!!' });
    setAccountSummaryProperties(journeyInfo);
    invokeJourneyDropOffUpdate('CUSTOMER_ONBOARDING_COMPLETE', currentFormContext.mobileNumber, currentFormContext.leadProfileId, currentFormContext.journeyId, globals);
  } else {
    globals.functions.setProperty(globals.form.thankYouPanel, { visible: false });
    errorHandling('', 'CUSTOMER_ONBOARDING_FAILURE', globals);
  }
}

/**
 * Call Account Opening Function
 * @returns {PROMISE}
 */
async function accountOpeningNreNro(idComToken) {
  const journeyParamStateInfo = finalResult.journeyParamStateInfo;
  const { fatca_response: response, selectedCheckedValue: accIndex } = currentFormContext;
  const jsonObj = {
    requestString: {
      journeyID: journeyParamStateInfo.currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      misCodeDetails: '',
      identifierValue: parseDate(response.datBirthCust),
      flgChqBookIssue: 'N',
      DoB: parseDate(response.datBirthCust),
      IDCOM_Token: idComToken,
      Id_token_jwt: journeyParamStateInfo.AccountOpeningNRENRO.fatcaJwtToken,
      dateofBirth: parseDate(response.datBirthCust),
      custBirthDate: parseDate(response.datBirthCust),
      identifierName: '',
      preferredChannel: '',
      territoryName: '',
      address: `${response?.txtCustadrAdd1} ${response?.txtCustadrAdd2} ${response?.txtCustadrAdd3}`,
      companyName: '',
      nomineeAge: '',
      typeOfFirm: '',
      typCompany: '',
      typeOfFirm_label: '',
      accountNumber: response.customerAccountDetailsDTO[accIndex].accountNumber,
      customerID: response.customerId.toString(),
      maskedCustID: response.customerId.toString().slice((response.customerId.toString().length - 4), response.customerId.toString().length),
      maskedAccountNumber: 'X'.repeat((response.customerAccountDetailsDTO[accIndex].accountNumber.length - 4))
                            + response.customerAccountDetailsDTO[accIndex].accountNumber.slice((response.customerAccountDetailsDTO[accIndex].accountNumber.length - 4), (response.customerAccountDetailsDTO[accIndex].accountNumber.length)),
      agriculturalIncome: '',
      sex: response.txtCustSex,
      email: response.refCustEmail,
      accountType: response.customerAccountDetailsDTO[accIndex].prodTypeDesc,
      ProductCategory: journeyParamStateInfo.currentFormContext.productCategory,
      name: response.customerFullName,
      otherThanAgriIncome: '',
      nomineeName: response.customerAccountDetailsDTO[accIndex].nomineeName || '',
      birthCertificate: '',
      PANNumber: response.refCustItNum,
      nomineeAddress: '',
      maidenName: response.namMotherMaiden,
      countryOfNominee: '',
      country: response.namHoldadrCntry,
      passpostExpiryDate: '',
      codeLC: '',
      codeLG: '',
      applicationDate: new Date().toISOString().slice(0, 19),
      DLExpiryDate: '',
      selfEmployedProfessionalCategory: '',
      selfEmployedProfessionalCategory_label: '',
      nomineeCity: '',
      stateOfBirth: '',
      cityOfBirth: response.customerFATCADtlsDTO[0].namCityBirth,
      taxCntry1: response.customerFATCADtlsDTO[0].codTaxCntry1,
      permanentAddressState: response.namPermadrState,
      permanentAddressCity: response.namPermadrCity,
      permanentAddressLM: response.txtPermadrAdd3,
      permanentAddressLine2: response.txtPermadrAdd2,
      permanentAddressLine1: response.txtPermadrAdd1 || '',
      presentAddressLM: response.txtCustadrAdd3,
      presentAddressLine2: response.txtCustadrAdd2,
      presentAddressLine1: response.txtCustadrAdd1,
      isIndianTaxResident: '',
      isTaxAddressSame: '',
      isMailIDAvailable: '',
      isPresentAddressSame: '',
      isCommunicationAddressSame: '',
      isPermanentAddressSame: '',
      isSameAddress: '',
      fatherNAme: response.customerFATCADtlsDTO[0].namCustFather,
      employeeCategory: '',
      employeeCategory_label: '',
      otherEmployeeCategory: '',
      otherEmployeeCategory_label: '',
      occupationType: '',
      permanentAddressPin: response.txtPermadrZip,
      presentAddressPin: response.txtPermadrZip,
      maritalStatus: response.maritalStatusDescription,
      marital_Status: '',
      spouseName: response.customerFATCADtlsDTO[0].namCustSpouse,
      declareNominee: '',
      otherTypeOfFirm: '',
      otherTypeOfFirm_label: '',
      otherSourceOfFunds: '',
      nomineeAddressLine2: '',
      nomineeLandmark: '',
      nomAdrCity: '',
      nomAdrCntry: '',
      nomAdrState: '',
      nomAdrZip: '',
      nomRelation: '',
      nomineeDoB: response.customerAccountDetailsDTO[accIndex].nomineeDOB ? parseDate(response.customerAccountDetailsDTO[accIndex].nomineeDOB) : '',
      isForm60Attached: '',
      PANAckNo: '',
      doaInput: '',
      grossAnnualIncome: response.customerAMLDetailsDTO[0].grossIncome || '',
      grossAnnualIncome_range: '',
      monthlyIncome: '',
      selfServiceAnnualIncome: '',
      sourceOfFunds: response.customerAMLDetailsDTO[0].incomeSource || '',
      sourceOfFunds_label: response.customerAMLDetailsDTO[0].incomeSource || '',
      displayProductName: journeyParamStateInfo.currentFormContext.productAccountName,
      state: response.namPermadrState,
      city: response.namPermadrCity,
      residenceType: response.customerAMLDetailsDTO[0].typResidence || '',
      residenceType_label: '',
      doYouHavePAN: response.refCustItNum ? 'Y' : 'N',
      voterIDNo: '',
      drivingLicenseNo: '',
      isSeniorCitizen: '',
      countryOfTaxResidency: response.customerFATCADtlsDTO[0].codTaxCntry1,
      AadharFSDocument: '',
      PANFSDocument: '',
      passportFSDocument: '',
      voterIDFSDocument: '',
      DLFSDocument: '',
      otherDocumentFS: '',
      proofOfAddress: '',
      passportNumber: '',
      existingCustomer: 'Y',
      motherMaidenName: response.namMotherMaiden,
      declarationforRequiredBalance: '',
      incorporationDate: '',
      nationality: response.namHoldadrCntry,
      custNationality: response.txtCustNATNLTY,
      addressTypeOtherThanResidential: '',
      AadharBSDocument: '',
      passportBSDocument: '',
      votersIDBSDocument: '',
      DLBSDocument: '',
      otherProfileImage: '',
      otherBSDocument: '',
      AadharConsentTaken: '',
      aadharConsentDataTime: new Date().toISOString().slice(0, 19),
      utilityBillsFSDocument: '',
      utilityBillsBSDocument: '',
      municipalBSDocument: '',
      familyPPSFSDocument: '',
      familyPPSBSDocument: '',
      allotmentLetterFSDocument: '',
      allotmentLEtterBSDocument: '',
      firstName: response.customerFirstName || '',
      gender: response.txtCustSex,
      lastName: response.customerLastName || '',
      layout: '',
      customerFullName: response.customerFullName,
      leadParentLame: '',
      leadRating: '',
      leadSource: 'NRI Insta ETB STP', // TODO: Check in Backend if it is being picked from Backend
      leadSourceKey: '33609',
      middleName: response.customerMiddleName || '',
      mobileNo: journeyParamStateInfo.currentFormContext.mobileNumber,
      multipleTaxResidencyID: '',
      employmentType: '',
      employmentTypeOthers: '',
      phone: journeyParamStateInfo.currentFormContext.mobileNumber,
      productCategory: journeyParamStateInfo.currentFormContext.productCategory,
      productName: journeyParamStateInfo.currentFormContext.productAccountName,
      ratingKey: '',
      residentialStatus: '',
      residentialStatus_label: '',
      salutationKey: '',
      salutationName: response.txtCustPrefix,
      statusCodeInOn: new Date().toISOString().slice(0, 19),
      territoryCode: '',
      territoryKey: '',
      zipCode: response.txtPermadrZip,
      videoKYCConsent: '',
      transcriptLatLong: '',
      videoKYCFinalStatus: '',
      isAadharBasedAccountOpening: '',
      AMBStamping: '',
      companyCode: '',
      occupationTypeOther: '',
      natureOfBusinessOther: '',
      natureOfBus: '',
      natureOfBusinessOther_label: '',
      genderCode: '',
      genderID: '',
      lastModifiedBy: '',
      lastModifiedOn: '',
      occupationTypeCode: '',
      occupationTypeID: '',
      ownerCode: '',
      productCategoryID: journeyParamStateInfo.currentFormContext.productCategoryID,
      productCode: journeyParamStateInfo.currentFormContext.productAccountType,
      productKey: journeyParamStateInfo.currentFormContext.productKey,
      ItemKey: journeyParamStateInfo.form.confirmDetails.crm_leadId,
      leadCustomerID: '',
      residentialStatusID: '',
      websiteUrl: '',
      expirayDateVideo: '',
      custPrefix: response.txtCustPrefix,
      cc_RequestType: '',
      cc_Fraudnet: '',
      cc_Hunter: '',
      cc_Final_Status: '',
      cc_HU_Sec_Status: '',
      cc_Error_Msg: '',
      browserName: '',
      browserVersion: '',
      osVersion: '',
      osName: '',
      browserFingerprint: '',
      cookieSource: '',
      cookieTime: '',
      cookieVintage: '',
      cookieID: '',
      cookieName: '',
      customerEligibilityCheckFlag: 'true',
      customerEligibilityStatus: 'success',
      promoCode: null,
      accountTitle: response.customerFullName,
      codCCBrn: '',
      codProd: '',
      codOccupation: '',
      codProfession: '',
      selfEmpFrom: '',
      incomeSource: '',
      typEmployer: '',
      typResidence: '',
      typResidence_label: '',
      addr1: response.txtPermadrAdd1 || '',
      custFirstName: response.customerFirstName || '',
      custFullName: response.customerFullName,
      custLastName: response.customerLastName || '',
      custSex: response.txtCustSex,
      custType: response.flgCustTyp,
      permAddr1: response.txtPermadrAdd1 || '',
      permAddr2: response.txtPermadrAdd2,
      permAddr3: response.txtPermadrAdd3,
      permAddrCity: response.namPermadrCity,
      permAddrState: response.namPermadrState,
      zip: response.txtPermadrZip,
      addrProof: '',
      addressType: '',
      branchCode: response.customerAccountDetailsDTO[accIndex].branchCode.toString(),
      branchId: '',
      custFatherName: response.customerFATCADtlsDTO[0].namCustFather,
      docNumber: response.customerFATCADtlsDTO[0].idDocNum,
      ADVRefrenceKey: '',
      RRN: '',
      validPAN: response.refCustItNum ? 'Y' : 'N',
      oneAadhaarOneAcStatus: '',
      docType: '',
      resStatus: '',
      mandateFlag: '',
      acctOperInstrs: response.customerAccountDetailsDTO[accIndex].accountOperatingInstructions,
      amtShareFixed: '',
      codRel: response.customerAccountDetailsDTO[accIndex].codRel.toString(),
      AMBDateTime: new Date().toISOString().slice(0, 19),
      guardianName: null,
      namGuardian: null,
      guardianDob: '',
      guardianAge: '',
      nomineeAddressLine1: '',
      selfEmployedSinceMonths: '',
      selfEmployedSinceYears: '',
      guardAdrAdd1: '',
      guardAdrAdd2: '',
      guardAdrAdd3: '',
      guardAdrCity: '',
      guardAdrState: '',
      guardAdrZip: '',
      addressIndicator: '',
      partnerId: '',
      referenceNo: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmMcId: '',
      pep: '',
      isAccountCreated: 'No',
      annualTurnOver: '',
    },
  };

  // Calling the fetch IDComToken API
  const apiEndPoint = urlPath(NRENROENDPOINTS.accountOpening);
  const fetchResult = fetchJsonResponse(apiEndPoint, jsonObj, 'POST', false);
  // res =  {
  //   accountOpening: {
  //     errorCode: '0',
  //     accountNumber: '50919394857273',
  //   },
  // };

  // prefillThankYouPage(res, globals);

  prefillThankYouPage(res, globals);

  // Promise.resolve(fetchResult).then((res) => {
  //   prefillThankYouPage(res, globals);
  // }).catch((err) => {
  //   console.log(err);
  //   errorHandling('', 'CUSTOMER_ONBOARDING_FAILURE', globals);
  // });

  /* if (typeof window !== 'undefined') {
    hideLoaderGif();
  }
  return {
    accountOpening: {
      errorCode: '0',
      accountNumber: '50919394857273',
    },
  }; */
}

/**
 * Call Account Opening Function
 * @returns {PROMISE}
 */
async function accountOpeningNreNro1(idComToken) {
  const journeyParamStateInfo = finalResult.journeyParamStateInfo;
  const { fatca_response: response, selectedCheckedValue: accIndex } = currentFormContext;
  const jsonObj = {
    requestString: {
      journeyID: journeyParamStateInfo.currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      misCodeDetails: '',
      identifierValue: parseDate(response.datBirthCust),
      flgChqBookIssue: 'N',
      DoB: parseDate(response.datBirthCust),
      IDCOM_Token: idComToken,
      Id_token_jwt: journeyParamStateInfo.AccountOpeningNRENRO.fatcaJwtToken,
      dateofBirth: parseDate(response.datBirthCust),
      custBirthDate: parseDate(response.datBirthCust),
      identifierName: '',
      preferredChannel: '',
      territoryName: '',
      address: `${response?.txtCustadrAdd1} ${response?.txtCustadrAdd2} ${response?.txtCustadrAdd3}`,
      companyName: '',
      nomineeAge: '',
      typeOfFirm: '',
      typCompany: '',
      typeOfFirm_label: '',
      accountNumber: response.customerAccountDetailsDTO[accIndex].accountNumber,
      customerID: response.customerId.toString(),
      maskedCustID: response.customerId.toString().slice((response.customerId.toString().length - 4), response.customerId.toString().length),
      maskedAccountNumber: 'X'.repeat((response.customerAccountDetailsDTO[accIndex].accountNumber.length - 4))
                            + response.customerAccountDetailsDTO[accIndex].accountNumber.slice((response.customerAccountDetailsDTO[accIndex].accountNumber.length - 4), (response.customerAccountDetailsDTO[accIndex].accountNumber.length)),
      agriculturalIncome: '',
      sex: response.txtCustSex,
      email: response.refCustEmail,
      accountType: response.customerAccountDetailsDTO[accIndex].prodTypeDesc,
      ProductCategory: journeyParamStateInfo.currentFormContext.productCategory,
      name: response.customerFullName,
      otherThanAgriIncome: '',
      nomineeName: response.customerAccountDetailsDTO[accIndex].nomineeName || '',
      birthCertificate: '',
      PANNumber: response.refCustItNum,
      nomineeAddress: '',
      maidenName: response.namMotherMaiden,
      countryOfNominee: '',
      country: response.namHoldadrCntry,
      passpostExpiryDate: '',
      codeLC: '',
      codeLG: '',
      applicationDate: new Date().toISOString().slice(0, 19),
      DLExpiryDate: '',
      selfEmployedProfessionalCategory: '',
      selfEmployedProfessionalCategory_label: '',
      nomineeCity: '',
      stateOfBirth: '',
      cityOfBirth: response.customerFATCADtlsDTO[0].namCityBirth,
      taxCntry1: response.customerFATCADtlsDTO[0].codTaxCntry1,
      permanentAddressState: response.namPermadrState,
      permanentAddressCity: response.namPermadrCity,
      permanentAddressLM: response.txtPermadrAdd3,
      permanentAddressLine2: response.txtPermadrAdd2,
      permanentAddressLine1: response.txtPermadrAdd1 || '',
      presentAddressLM: response.txtCustadrAdd3,
      presentAddressLine2: response.txtCustadrAdd2,
      presentAddressLine1: response.txtCustadrAdd1,
      isIndianTaxResident: '',
      isTaxAddressSame: '',
      isMailIDAvailable: '',
      isPresentAddressSame: '',
      isCommunicationAddressSame: '',
      isPermanentAddressSame: '',
      isSameAddress: '',
      fatherNAme: response.customerFATCADtlsDTO[0].namCustFather,
      employeeCategory: '',
      employeeCategory_label: '',
      otherEmployeeCategory: '',
      otherEmployeeCategory_label: '',
      occupationType: '',
      permanentAddressPin: response.txtPermadrZip,
      presentAddressPin: response.txtPermadrZip,
      maritalStatus: response.maritalStatusDescription,
      marital_Status: '',
      spouseName: response.customerFATCADtlsDTO[0].namCustSpouse,
      declareNominee: '',
      otherTypeOfFirm: '',
      otherTypeOfFirm_label: '',
      otherSourceOfFunds: '',
      nomineeAddressLine2: '',
      nomineeLandmark: '',
      nomAdrCity: '',
      nomAdrCntry: '',
      nomAdrState: '',
      nomAdrZip: '',
      nomRelation: '',
      nomineeDoB: response.customerAccountDetailsDTO[accIndex].nomineeDOB ? parseDate(response.customerAccountDetailsDTO[accIndex].nomineeDOB) : '',
      isForm60Attached: '',
      PANAckNo: '',
      doaInput: '',
      grossAnnualIncome: response.customerAMLDetailsDTO[0].grossIncome || '',
      grossAnnualIncome_range: '',
      monthlyIncome: '',
      selfServiceAnnualIncome: '',
      sourceOfFunds: response.customerAMLDetailsDTO[0].incomeSource || '',
      sourceOfFunds_label: response.customerAMLDetailsDTO[0].incomeSource || '',
      displayProductName: journeyParamStateInfo.currentFormContext.productAccountName,
      state: response.namPermadrState,
      city: response.namPermadrCity,
      residenceType: response.customerAMLDetailsDTO[0].typResidence || '',
      residenceType_label: '',
      doYouHavePAN: response.refCustItNum ? 'Y' : 'N',
      voterIDNo: '',
      drivingLicenseNo: '',
      isSeniorCitizen: '',
      countryOfTaxResidency: response.customerFATCADtlsDTO[0].codTaxCntry1,
      AadharFSDocument: '',
      PANFSDocument: '',
      passportFSDocument: '',
      voterIDFSDocument: '',
      DLFSDocument: '',
      otherDocumentFS: '',
      proofOfAddress: '',
      passportNumber: '',
      existingCustomer: 'Y',
      motherMaidenName: response.namMotherMaiden,
      declarationforRequiredBalance: '',
      incorporationDate: '',
      nationality: response.namHoldadrCntry,
      custNationality: response.txtCustNATNLTY,
      addressTypeOtherThanResidential: '',
      AadharBSDocument: '',
      passportBSDocument: '',
      votersIDBSDocument: '',
      DLBSDocument: '',
      otherProfileImage: '',
      otherBSDocument: '',
      AadharConsentTaken: '',
      aadharConsentDataTime: new Date().toISOString().slice(0, 19),
      utilityBillsFSDocument: '',
      utilityBillsBSDocument: '',
      municipalBSDocument: '',
      familyPPSFSDocument: '',
      familyPPSBSDocument: '',
      allotmentLetterFSDocument: '',
      allotmentLEtterBSDocument: '',
      firstName: response.customerFirstName || '',
      gender: response.txtCustSex,
      lastName: response.customerLastName || '',
      layout: '',
      customerFullName: response.customerFullName,
      leadParentLame: '',
      leadRating: '',
      leadSource: 'NRI Insta ETB STP', // TODO: Check in Backend if it is being picked from Backend
      leadSourceKey: '33609',
      middleName: response.customerMiddleName || '',
      mobileNo: journeyParamStateInfo.currentFormContext.mobileNumber,
      multipleTaxResidencyID: '',
      employmentType: '',
      employmentTypeOthers: '',
      phone: journeyParamStateInfo.currentFormContext.mobileNumber,
      productCategory: journeyParamStateInfo.currentFormContext.productCategory,
      productName: journeyParamStateInfo.currentFormContext.productAccountName,
      ratingKey: '',
      residentialStatus: '',
      residentialStatus_label: '',
      salutationKey: '',
      salutationName: response.txtCustPrefix,
      statusCodeInOn: new Date().toISOString().slice(0, 19),
      territoryCode: '',
      territoryKey: '',
      zipCode: response.txtPermadrZip,
      videoKYCConsent: '',
      transcriptLatLong: '',
      videoKYCFinalStatus: '',
      isAadharBasedAccountOpening: '',
      AMBStamping: '',
      companyCode: '',
      occupationTypeOther: '',
      natureOfBusinessOther: '',
      natureOfBus: '',
      natureOfBusinessOther_label: '',
      genderCode: '',
      genderID: '',
      lastModifiedBy: '',
      lastModifiedOn: '',
      occupationTypeCode: '',
      occupationTypeID: '',
      ownerCode: '',
      productCategoryID: journeyParamStateInfo.currentFormContext.productCategoryID,
      productCode: journeyParamStateInfo.currentFormContext.productAccountType,
      productKey: journeyParamStateInfo.currentFormContext.productKey,
      ItemKey: journeyParamStateInfo.form.confirmDetails.crm_leadId,
      leadCustomerID: '',
      residentialStatusID: '',
      websiteUrl: '',
      expirayDateVideo: '',
      custPrefix: response.txtCustPrefix,
      cc_RequestType: '',
      cc_Fraudnet: '',
      cc_Hunter: '',
      cc_Final_Status: '',
      cc_HU_Sec_Status: '',
      cc_Error_Msg: '',
      browserName: '',
      browserVersion: '',
      osVersion: '',
      osName: '',
      browserFingerprint: '',
      cookieSource: '',
      cookieTime: '',
      cookieVintage: '',
      cookieID: '',
      cookieName: '',
      customerEligibilityCheckFlag: 'true',
      customerEligibilityStatus: 'success',
      promoCode: null,
      accountTitle: response.customerFullName,
      codCCBrn: '',
      codProd: '',
      codOccupation: '',
      codProfession: '',
      selfEmpFrom: '',
      incomeSource: '',
      typEmployer: '',
      typResidence: '',
      typResidence_label: '',
      addr1: response.txtPermadrAdd1 || '',
      custFirstName: response.customerFirstName || '',
      custFullName: response.customerFullName,
      custLastName: response.customerLastName || '',
      custSex: response.txtCustSex,
      custType: response.flgCustTyp,
      permAddr1: response.txtPermadrAdd1 || '',
      permAddr2: response.txtPermadrAdd2,
      permAddr3: response.txtPermadrAdd3,
      permAddrCity: response.namPermadrCity,
      permAddrState: response.namPermadrState,
      zip: response.txtPermadrZip,
      addrProof: '',
      addressType: '',
      branchCode: response.customerAccountDetailsDTO[accIndex].branchCode.toString(),
      branchId: '',
      custFatherName: response.customerFATCADtlsDTO[0].namCustFather,
      docNumber: response.customerFATCADtlsDTO[0].idDocNum,
      ADVRefrenceKey: '',
      RRN: '',
      validPAN: response.refCustItNum ? 'Y' : 'N',
      oneAadhaarOneAcStatus: '',
      docType: '',
      resStatus: '',
      mandateFlag: '',
      acctOperInstrs: response.customerAccountDetailsDTO[accIndex].accountOperatingInstructions,
      amtShareFixed: '',
      codRel: response.customerAccountDetailsDTO[accIndex].codRel.toString(),
      AMBDateTime: new Date().toISOString().slice(0, 19),
      guardianName: null,
      namGuardian: null,
      guardianDob: '',
      guardianAge: '',
      nomineeAddressLine1: '',
      selfEmployedSinceMonths: '',
      selfEmployedSinceYears: '',
      guardAdrAdd1: '',
      guardAdrAdd2: '',
      guardAdrAdd3: '',
      guardAdrCity: '',
      guardAdrState: '',
      guardAdrZip: '',
      addressIndicator: '',
      partnerId: '',
      referenceNo: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmMcId: '',
      pep: '',
      isAccountCreated: 'No',
      annualTurnOver: '',
    },
  };

  // Calling the fetch IDComToken API
  const apiEndPoint = urlPath(NRENROENDPOINTS.accountOpening);
  return fetchJsonResponse(apiEndPoint, jsonObj, 'POST', false);
}

/**
   * Fetch IDCom Token
   * @param {Object} globals - The global object containing necessary data for IdComToken request.
   * @returns {Object} - The IDCom Response
   */
async function fetchIdComToken() {
  // Making the IDComToken request
  const idComTokenObj = {
    requestString: {
      mobileNumber: currentFormContext.mobileNumber,
      scope: 'ADOBE_ACNRI',
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      authCode: currentFormContext.idComAuthCode,
      journeyID: currentFormContext.journeyId,
      journeyName: currentFormContext.journeyName,
    },
  };

  // Calling the fetch IDComToken API
  const apiEndPoint = urlPath(ENDPOINTS.fetchIDComToken);
  return fetchJsonResponse(apiEndPoint, idComTokenObj, 'POST');
}

/**
 * @name validateJourneyParams - Validates the last Journey state
 * @returns {PROMISE}
 */
async function validateJourneyParams(formData, globals) {
  currentFormContext.mobileNumber = globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.registeredMobileNumber.$value;
  currentFormContext.leadProfileId = globals.form.runtime.leadProifileId.$value;
  try {
    const journeyDropOffParamLast = formData.journeyStateInfo[formData.journeyStateInfo.length - 1];
    finalResult.journeyParamState = journeyDropOffParamLast.state;
    finalResult.journeyParamStateInfo = JSON.parse(journeyDropOffParamLast.stateInfo);
    if (journeyDropOffParamLast.state === 'CUSTOMER_ONBOARDING_COMPLETE' || journeyDropOffParamLast.state === 'CUSTOMER_REVIEW_SUBMITTED') {
      globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.toDo, { value: 'showErrorPage' });
      globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: '1' }); // Setting the account number
      globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false });
      globals.functions.setProperty(globals.form.errorPanel.errorresults.errorConnection, { visible: true });
    }
    // eslint-disable-next-line no-unused-vars
    const checkFinalSuccess = (journeyDropOffParamLast.state === 'IDCOM_REDIRECTION_INITIATED');
    if (checkFinalSuccess) {
      if (currentFormContext.idComSuccess === 'TRUE') {
        if (finalResult.journeyParamStateInfo.currentFormContext && finalResult.journeyParamStateInfo.currentFormContext.fatca_response) {
          currentFormContext.fatca_response = finalResult.journeyParamStateInfo.currentFormContext.fatca_response;
          currentFormContext.selectedAccountName = finalResult.journeyParamStateInfo.currentFormContext.selectedAccountName;
        }
        invokeJourneyDropOffUpdate('CUSTOMER_ONBOARDING_STARTED', globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.registeredMobileNumber.$value, globals.form.runtime.leadProifileId.$value, currentFormContext.journeyId, globals);
        globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.toDo, { value: 'fetchIdComToken' });
        return {
          status: 'fetchIdComToken',
          journeyParamStateInfo: finalResult.journeyParamStateInfo,
        };
      }
    }
  } catch (error) {
    globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.toDo, { value: 'showErrorPage' });
    globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: '1' }); // Setting the account number
    return {
      status: 'showErrorPage',
    };
  }

  return {
    status: 'showErrorPage',
  };
}
// // eslint-disable-next-line no-unused-vars
// const nreNroFetchRes = async (globals) => {
//   try {
//     globals.functions.setProperty(globals.form.runtime.journeyId, { value: currentFormContext.journeyId });
//     const data = await nreNroInvokeJourneyDropOffByParam('', '', currentFormContext.journeyId);
//     // debugger;
//     if (data && data.errorCode === 'FJ0000') {
//       const journeyDropOffParamLast = data.formData.journeyStateInfo[data.formData.journeyStateInfo.length - 1];
//       finalResult.journeyParamState = journeyDropOffParamLast.state;
//       finalResult.journeyParamStateInfo = JSON.parse(journeyDropOffParamLast.stateInfo);
//       let leadId = '';
//       let mobileNumber = '';
//       if (data.leadProfile && data.leadProfile.mobileNumber) {
//         mobileNumber = data.leadProfile.mobileNumber;
//         currentFormContext.mobileNumber = mobileNumber;
//       }
//       if (data.leadProfile && data.leadProfile.leadProfileId) {
//         leadId = data.leadProfile.leadProfileId;
//       }
//       if (journeyDropOffParamLast.state === 'CUSTOMER_ONBOARDING_COMPLETE') {
//         // globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: '1' }); // Setting the account number
//         globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false }); // TODO: Needs to be changed from otpPanelWrapper to LandingPanel when onInit issue is fixed.
//         globals.functions.setProperty(globals.form.errorPanel.errorresults.itsNotYouPanel, { visible: true });
//       }
//       // eslint-disable-next-line no-unused-vars
//       const checkFinalSuccess = (journeyDropOffParamLast.state === 'IDCOM_REDIRECTION_INITIATED');
//       if (checkFinalSuccess) {
//         if (currentFormContext.idComSuccess === 'true') {
//           if (finalResult.journeyParamStateInfo.currentFormContext && finalResult.journeyParamStateInfo.currentFormContext.fatca_response) {
//             currentFormContext.fatca_response = finalResult.journeyParamStateInfo.currentFormContext.fatca_response;
//           }
//           invokeJourneyDropOffUpdate('IDCOM_AUTHENTICATION_SUCCESS', mobileNumber, leadId, currentFormContext.journeyId, globals);
//           invokeJourneyDropOffUpdate('CUSTOMER_ONBOARDING_STARTED', mobileNumber, leadId, currentFormContext.journeyId, globals);
//           prefillAccountDetail(currentFormContext.fatca_response, currentFormContext.selectedCheckedValue, 1, globals);
//           // Fetching IDComToken
//           const idComTokenResponse = await fetchIdComToken();
//           currentFormContext.IDCOMSuccessToken = idComTokenResponse.IDCOMtoken;
//           if (currentFormContext.IDCOMSuccessToken !== null || currentFormContext.IDCOMSuccessToken !== undefined || currentFormContext.IDCOMSuccessToken !== '') {
//             // Calling Account Opening Functions
//             const eningResponse = await accountOpeningNreNro(finalResult.journeyParamStateInfo);
//             // let accountOpeningResponse = {
//             //   accountOpening: {
//             //     errorCode: '0',
//             //     accountNumber: '50919394857273',
//             //   }
//             // };
//             if (accountOpeningResponse.accountOpening.errorCode === '0') {
//               // hideLoaderGif(); // TODO : Uncomment
//               currentFormContext.accountNumber = accountOpeningResponse.accountOpening.accountNumber;
//               globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false }); // TODO: Needs to be changed from otpPanelWrapper to LandingPanel when onInit issue is fixed.
//               globals.functions.setProperty(globals.form.thankYouPanel, { visible: true });
//               globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: '0' }); // Setting the account number
//               prefillThankYouPage(finalResult.journeyParamStateInfo, globals);
//             } else {
//               globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false }); // TODO: Needs to be changed from otpPanelWrapper to LandingPanel when onInit issue is fixed.
//               globals.functions.setProperty(globals.form.errorPanel.errorresults.itsNotYouPanel, { visible: true });
//               globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: '1' }); // Setting the account number
//             }
//             // Else journey drop off update onboarding failure, generic error page show here.
//           } else {
//             await invokeJourneyDropOffUpdate('IDCOM_AUTHENTICATION_FAILURE', mobileNumber, leadId, currentFormContext.journeyId, globals);
//             globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false }); // TODO: Needs to be changed from otpPanelWrapper to LandingPanel when onInit issue is fixed.
//             globals.functions.setProperty(globals.form.errorPanel.errorresults.itsNotYouPanel, { visible: true });
//             globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: '1' }); // Setting the account number
//           }
//         } else {
//           await invokeJourneyDropOffUpdate('IDCOM_AUTHENTICATION_FAILURE', mobileNumber, leadId, currentFormContext.journeyId, globals);
//           globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false }); // TODO: Needs to be changed from otpPanelWrapper to LandingPanel when onInit issue is fixed.
//           globals.functions.setProperty(globals.form.errorPanel.errorresults.itsNotYouPanel, { visible: true });
//           globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: '1' }); // Setting the account number
//         }
//       } else {
//         const err = 'Bad response';
//         throw err;
//       }
//     } else {
//       const err = 'Journey Drop Off Params Update response failed';
//       throw err;
//     }
//   } catch (error) {
//     globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false }); // TODO: Needs to be changed from otpPanelWrapper to LandingPanel when onInit issue is fixed.
//     globals.functions.setProperty(globals.form.errorPanel.errorresults.itsNotYouPanel, { visible: true });
//     globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: '1' }); // Setting the account number
//     // eslint-disable-next-line no-unused-vars
//     const errorCase = (finalResult.journeyParamState === 'CUSTOMER_FINAL_FAILURE');
//     // eslint-disable-next-line no-unused-vars
//     const stateInfoData = finalResult.journeyParamStateInfo;
//     // if (errorCase) {
//     //   console.log("Error Case : " , errorCase);
//     // }
//   }
// };

/**
 * Function to show hide page
 * @name nreNroShowHidePage
 * @param {Object} globals - The global object containing necessary data.
 */
function nreNroShowHidePage(globals) {
  globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false });
  return {
    payload: {
      response: globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable.$value,
    },
  };
}

/**
 * Function to prefill a hidden field, invoking nreNroPageRedirected.
 * @name nreNroInit
 * @param {Object} globals - The global object containing necessary data.
 */
function nreNroInit(globals) {
  globals.functions.setProperty(globals.form.runtime.journeyName, { value: JOURNEY_NAME }); // Setting the hidden field
  globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.init_hidden_field, { value: 'INIT' }); // Setting the hidden field
  onPageLoadAnalytics();
}

/**
 * Function to check whether we have been redirected from Idcom
 * @name nreNroPageRedirected
 * @param {Object} globals - The global object containing necessary data.
 */
function nreNroPageRedirected(globals) {
  const queryParams = globals.functions.exportData().queryParams;
  currentFormContext.authModeParam = queryParams?.authmode;
  currentFormContext.journeyId = queryParams?.journeyId;
  currentFormContext.idComAuthCode = queryParams?.authcode;
  currentFormContext.idComErrorCode = queryParams?.errorCode;
  currentFormContext.idComErrorMessage = queryParams?.errorMessage;
  currentFormContext.idComSuccess = queryParams?.success.toUpperCase();
  currentFormContext.idComRedirect = currentFormContext?.authModeParam && ((currentFormContext?.authModeParam === 'DebitCard') || (currentFormContext?.authModeParam === 'NetBanking')); // debit card or net banking flow
  if (currentFormContext.idComRedirect) {
    sendAnalytics('idcom redirection check', { validationMethod: currentFormContext?.authModeParam, status: currentFormContext?.idComSuccess }, 'ON_IDCOM_REDIRECTION', globals);
  }
  if (currentFormContext.idComRedirect && currentFormContext.idComSuccess === 'TRUE') {
    globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.nreNroPageRedirectedResp, { value: 'true' });
    globals.functions.setProperty(globals.form.runtime.journeyId, { value: currentFormContext.journeyId });
    // displayLoader(); // TODO : Uncomment : Error popping up
    // await nreNroFetchRes(globals);
  } else if (currentFormContext.idComSuccess === 'FALSE') {
    globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.nreNroPageRedirectedResp, { value: 'false' });
    globals.functions.setProperty(globals.form.otppanelwrapper, { visible: false });
    globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false });
    globals.functions.setProperty(globals.form.wizardPanel, { visible: false });
    globals.functions.setProperty(globals.form.errorPanel.errorresults.itsNotYouPanel, { visible: true });
  } else {
    globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.nreNroPageRedirectedResp, { value: 'false' });
  }
}

const addPageNameClassInBody = (pageName) => {
  if (pageName === 'Get_OTP_Page' || pageName === 'Submit_OTP') {
    document.body.classList.add('errorPageBody');
  }
  if (pageName === 'Select_Account') {
    document.body.classList.add('wizardPanelBody');
  }
  if (pageName === 'ThankYou_Page') {
    document.body.classList.add('nreThankYouPage');
  }
};

const switchWizard = (globals) => {
  const {
    mobileNumber,
    leadProfileId,
    journeyID,
  } = currentFormContext;

  invokeJourneyDropOffUpdate('CUSTOMER_ACCOUNT_VARIANT_SELECTED', mobileNumber, leadProfileId, journeyID, globals);
  moveWizardView('wizardNreNro', 'confirmDetails');
  currentFormContext.action = 'Confirm Details';
};

const onPageLoadAnalytics = async (globals) => {
  sendAnalytics('page load-Step 1 : Identify Yourself', { }, 'ON_PAGE_LOAD', globals);
};

setTimeout(() => {
  onPageLoadAnalytics();
}, 5000);

const crmLeadIdDetail = () => {
  const { fatca_response: response, selectedCheckedValue: accIndex } = currentFormContext;

  const jsonObj = {
    requestString: {
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      misCodeDetails: '',
      identifierValue: parseDate(response.datBirthCust),
      DoB: parseDate(response.datBirthCust),
      dateofBirth: parseDate(response.datBirthCust),
      custBirthDate: parseDate(response.datBirthCust),
      identifierName: 'DOB',
      preferredChannel: '',
      territoryName: 'Khanda Colony - Panvel',
      address: `${response?.txtCustadrAdd1} ${response?.txtCustadrAdd2} ${response?.txtCustadrAdd3}`,
      companyName: 'ADOBE SYSTEMS INDIA PVT LTD',
      nomineeAge: '60',
      typeOfFirm: '',
      typCompany: '',
      typeOfFirm_label: '',
      accountNumber: response.customerAccountDetailsDTO[accIndex].accountNumber,
      customerID: response.customerId.toString(),
      agriculturalIncome: '',
      sex: response.txtCustSex,
      email: response.refCustEmail,
      accountType: response.customerAccountDetailsDTO[accIndex].prodTypeDesc,
      ProductCategory: currentFormContext.productCategory,
      name: response.customerFullName,
      otherThanAgriIncome: '',
      nomineeName: response.customerAccountDetailsDTO[accIndex].nomineeName || '',
      birthCertificate: '',
      PANNumber: response.refCustItNum,
      nomineeAddress: '',
      maidenName: response.namMotherMaiden,
      countryOfNominee: '',
      country: response.namHoldadrCntry,
      passpostExpiryDate: '',
      codeLC: '',
      codeLG: '',
      applicationDate: new Date().toISOString().slice(0, 19),
      DLExpiryDate: '',
      selfEmployedProfessionalCategory: '',
      selfEmployedProfessionalCategory_label: '',
      nomineeCity: '',
      stateOfBirth: '',
      cityOfBirth: response.customerFATCADtlsDTO[0].namCityBirth,
      taxCntry1: response.customerFATCADtlsDTO[0].codTaxCntry1,
      permanentAddressState: response.namPermadrState,
      permanentAddressCity: response.namPermadrCity,
      permanentAddressLM: response.txtPermadrAdd3,
      permanentAddressLine2: response.txtPermadrAdd2,
      permanentAddressLine1: response.txtPermadrAdd1 || '',
      presentAddressLM: response.txtCustadrAdd3,
      presentAddressLine2: response.txtCustadrAdd2,
      presentAddressLine1: response.txtCustadrAdd1,
      isIndianTaxResident: '',
      isTaxAddressSame: '',
      isMailIDAvailable: '',
      isPresentAddressSame: '',
      isCommunicationAddressSame: '',
      isPermanentAddressSame: '',
      isSameAddress: '',
      fatherNAme: response.customerFATCADtlsDTO[0].namCustFather,
      employeeCategory: '',
      employeeCategory_label: '',
      otherEmployeeCategory: '',
      otherEmployeeCategory_label: '',
      occupationType: '',
      permanentAddressPin: response.txtPermadrZip,
      presentAddressPin: response.txtPermadrZip,
      maritalStatus: response.maritalStatusDescription,
      marital_Status: '',
      spouseName: response.customerFATCADtlsDTO[0].namCustSpouse,
      declareNominee: '',
      otherTypeOfFirm: '',
      otherTypeOfFirm_label: '',
      otherSourceOfFunds: '',
      nomineeAddressLine2: '',
      nomineeLandmark: '',
      nomAdrCity: '',
      nomAdrCntry: '',
      nomAdrState: '',
      nomAdrZip: '',
      nomRelation: '',
      nomineeDoB: response.customerAccountDetailsDTO[accIndex].nomineeDOB ? parseDate(response.customerAccountDetailsDTO[accIndex].nomineeDOB) : '',
      isForm60Attached: '',
      PANAckNo: '',
      doaInput: '',
      grossAnnualIncome: response.customerAMLDetailsDTO[0].grossIncome || '',
      grossAnnualIncome_range: '',
      monthlyIncome: '',
      selfServiceAnnualIncome: '',
      sourceOfFunds: response.customerAMLDetailsDTO[0].incomeSource || '',
      sourceOfFunds_label: response.customerAMLDetailsDTO[0].incomeSource || '',
      displayProductName: currentFormContext.productAccountName,
      state: response.namPermadrState,
      city: response.namPermadrCity,
      residenceType: response.customerAMLDetailsDTO[0].typResidence || '',
      residenceType_label: '',
      doYouHavePAN: response.refCustItNum ? 'Y' : 'N',
      voterIDNo: '',
      drivingLicenseNo: '',
      isSeniorCitizen: '',
      countryOfTaxResidency: response.customerFATCADtlsDTO[0].codTaxCntry1,
      AadharFSDocument: '',
      PANFSDocument: '',
      passportFSDocument: '',
      voterIDFSDocument: '',
      DLFSDocument: '',
      otherDocumentFS: '',
      proofOfAddress: '',
      passportNumber: '',
      existingCustomer: 'Y',
      motherMaidenName: response.namMotherMaiden,
      declarationforRequiredBalance: '',
      incorporationDate: '',
      nationality: response.namHoldadrCntry,
      custNationality: response.txtCustNATNLTY,
      addressTypeOtherThanResidential: '',
      AadharBSDocument: '',
      passportBSDocument: '',
      votersIDBSDocument: '',
      DLBSDocument: '',
      otherProfileImage: '',
      otherBSDocument: '',
      AadharConsentTaken: '',
      aadharConsentDataTime: new Date().toISOString().slice(0, 19),
      utilityBillsFSDocument: '',
      utilityBillsBSDocument: '',
      municipalBSDocument: '',
      familyPPSFSDocument: '',
      familyPPSBSDocument: '',
      allotmentLetterFSDocument: '',
      allotmentLEtterBSDocument: '',
      firstName: response.customerFirstName || '',
      gender: response.txtCustSex,
      lastName: response.customerLastName || 'test',
      layout: '',
      customerFullName: response.customerFullName,
      leadParentLame: '',
      leadRating: '',
      leadSource: 'NRI Insta ETB STP',
      leadSourceKey: '33609',
      middleName: response.customerMiddleName || '',
      mobileNo: currentFormContext.mobileNumber,
      multipleTaxResidencyID: '',
      employmentType: '',
      employmentTypeOthers: '',
      phone: currentFormContext.mobileNumber,
      productCategory: currentFormContext.productCategory,
      productName: currentFormContext.productAccountName,
      ratingKey: '',
      residentialStatus: '',
      residentialStatus_label: '',
      salutationKey: '',
      salutationName: response.txtCustPrefix,
      statusCodeInOn: new Date().toISOString().slice(0, 19),
      territoryCode: '',
      territoryKey: '',
      zipCode: response.txtPermadrZip,
      videoKYCConsent: '',
      transcriptLatLong: '',
      videoKYCFinalStatus: '',
      isAadharBasedAccountOpening: '',
      AMBStamping: '',
      companyCode: '',
      occupationTypeOther: '',
      natureOfBusinessOther: '',
      natureOfBus: '',
      natureOfBusinessOther_label: '',
      genderCode: '',
      genderID: '',
      lastModifiedBy: '',
      lastModifiedOn: '',
      occupationTypeCode: '',
      occupationTypeID: '',
      ownerCode: '',
      productCategoryID: currentFormContext.productCategoryID,
      productCode: currentFormContext.productAccountType,
      productKey: currentFormContext.productKey,
      residentialStatusID: '',
      websiteUrl: '',
      expirayDateVideo: '',
      custPrefix: response.txtCustPrefix,
      cc_RequestType: '',
      cc_Fraudnet: '',
      cc_Hunter: '',
      cc_Final_Status: '',
      cc_HU_Sec_Status: '',
      cc_Error_Msg: '',
      browserName: '',
      browserVersion: '',
      osVersion: '',
      osName: '',
      browserFingerprint: '',
      cookieSource: '',
      cookieTime: '',
      cookieVintage: '',
      cookieID: '',
      cookieName: '',
      customerEligibilityCheckFlag: 'true',
      customerEligibilityStatus: 'success',
      promoCode: null,
      accountTitle: response.customerFullName,
      codCCBrn: '',
      codProd: '',
      codOccupation: '',
      codProfession: '',
      selfEmpFrom: '',
      incomeSource: '',
      typEmployer: '',
      typResidence: '',
      typResidence_label: '',
      addr1: response.txtPermadrAdd1 || '',
      custFirstName: response.customerFirstName || '',
      custFullName: response.customerFullName,
      custLastName: response.customerLastName || '',
      custSex: response.txtCustSex,
      custType: response.flgCustTyp,
      permAddr1: response.txtPermadrAdd1 || '',
      permAddr2: response.txtPermadrAdd2,
      permAddr3: response.txtPermadrAdd3,
      permAddrCity: response.namPermadrCity,
      permAddrState: response.namPermadrState,
      zip: response.txtPermadrZip,
      addrProof: '',
      addressType: '',
      branchCode: response.customerAccountDetailsDTO[accIndex].branchCode.toString(),
      branchId: '',
      custFatherName: response.customerFATCADtlsDTO[0].namCustFather,
      docNumber: response.customerFATCADtlsDTO[0].idDocNum,
      ADVRefrenceKey: '',
      RRN: '',
      validPAN: response.refCustItNum ? 'Y' : 'N',
      docType: '',
      resStatus: '',
      mandateFlag: '',
      acctOperInstrs: response.customerAccountDetailsDTO[accIndex].accountOperatingInstructions,
      amtShareFixed: '',
      codRel: response.customerAccountDetailsDTO[accIndex].codRel.toString(),
      AMBValue: '',
      TPTConsent: '',
      AMBDateTime: new Date().toISOString().slice(0, 19),
      guardianName: null,
      namGuardian: null,
      guardianDob: '',
      guardianAge: '',
      nomineeAddressLine1: '',
      selfEmployedSinceMonths: '',
      selfEmployedSinceYears: '',
      guardAdrAdd1: '',
      guardAdrAdd2: '',
      guardAdrAdd3: '',
      guardAdrCity: '',
      guardAdrState: '',
      guardAdrZip: '',
      addressIndicator: '',
      partnerId: '',
      referenceNo: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmMcId: '',
      pep: '',
      isAccountCreated: '',
      annualTurnOver: '',
      seedingBankName: '',
      bankIinNumber: '',
      dbtConsentDateTime: '',
      isGigaCard: '',
      dbtConsent: '',
    },
  };

  const path = urlPath(ENDPOINTS.crmLeadGenerate);
  formRuntime?.otpValLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
};

function confirmDetailsConsent(firstConsent, secondConsent, globals) {
  globals.functions.setProperty(globals.form.wizardPanel.confirmButton, { enabled: false });
  const firstConsents = firstConsent.$value;
  const secondConsents = secondConsent.$value;
  if ((firstConsents && secondConsents) === 'on') {
    globals.functions.setProperty(globals.form.wizardPanel.confirmButton, { enabled: true });
  } else {
    globals.functions.setProperty(globals.form.wizardPanel.confirmButton, { enabled: false });
  }
}

function crmProductID(crmProductPanel, response, globals) {
  const productID = response.customerAccountDetailsDTO[0].productCode;
  const productvarient = response.customerAccountDetailsDTO[0].productTypeDescription;
  const changeDataAttrObj = { attrChange: true, value: false, disable: true };

  const setFormValue = (field, value) => {
    const fieldUtil = formUtil(globals, field);
    fieldUtil.setValue(value, changeDataAttrObj);
  };
  if (productID === 201 && productvarient === 'NRO') {
    setFormValue(crmProductPanel.productName, 'NRO current account');
    // setFormValue(crmProductPanel.productCategory, 'Current');
    // setFormValue(crmProductPanel.productCategoryID, '484');
    // setFormValue(crmProductPanel.productKey, '604');
  } else if (productID === 218 && productvarient === 'NRE') {
    setFormValue(crmProductPanel.productName, 'NRE Current account');
    // setFormValue(crmProductPanel.productCategory, 'Current');
    // setFormValue(crmProductPanel.productCategoryID, '484');
    // setFormValue(crmProductPanel.productKey, '605');
  } else if (productvarient === 'NRO') {
    setFormValue(crmProductPanel.productName, 'NRO savings account');
    // setFormValue(crmProductPanel.productKey, '602');
    // setFormValue(crmProductPanel.productCategory, 'Savings');
    // setFormValue(crmProductPanel.productCategoryID, '483');
  } else if (productvarient === 'NRE') {
    setFormValue(crmProductPanel.productName, 'NRE savings account');
    // setFormValue(crmProductPanel.productCategory, 'Savings');
    // setFormValue(crmProductPanel.productCategoryID, '483');
    // setFormValue(crmProductPanel.productKey, '601');
  }
}

function nreNroAccountType(nroAccountTypePanel, nreAccountTypePanel, globals) {
  const nroEliteSavingsAcco = nroAccountTypePanel.eliteSavingsAccountPanel.eliteSavingsAccount.$value;
  const nroRegularSavingsAcco = nroAccountTypePanel.regularSavingsAccountPanel.regularSavingsAccount.$value;
  const nroCurrentAcco = nroAccountTypePanel.currentAccountPanel.currentAccount.$value;
  const nreEliteSavingsAcco = nreAccountTypePanel.nreeliteSavingsAccountPanel.eliteSavingsAccount.$value;
  const nreRegularSavingsAcco = nreAccountTypePanel.NreregularSavingsAccountPanel.regularSavingsAccount.$value;
  const nreCurrentAcco = nreAccountTypePanel.nreCurrentAccountPanel.currentAccount.$value;
  if (nroEliteSavingsAcco === 'on') {
    currentFormContext.productAccountName = 'NRO savings account';
    currentFormContext.productAccountType = '1345';
    currentFormContext.productCategory = 'Savings';
    currentFormContext.productCategoryID = '483';
    currentFormContext.productKey = '602';
    currentFormContext.selectedAccountName = 'NRO - Elite Savings Account';
  } else if (nroRegularSavingsAcco === 'on') {
    currentFormContext.productAccountName = 'NRO savings account';
    currentFormContext.productAccountType = '101';
    currentFormContext.productCategory = 'Savings';
    currentFormContext.productCategoryID = '483';
    currentFormContext.productKey = '602';
    currentFormContext.selectedAccountName = 'NRO - Regular Savings Account';
  } else if (nroCurrentAcco === 'on') {
    currentFormContext.productAccountName = 'NRO current account';
    currentFormContext.productAccountType = '201';
    currentFormContext.productCategory = 'Current';
    currentFormContext.productCategoryID = '484';
    currentFormContext.productKey = '605';
    currentFormContext.selectedAccountName = 'NRO - Current Account';
  } else if (nreRegularSavingsAcco === 'on') {
    currentFormContext.productAccountName = 'NRE savings account';
    currentFormContext.productAccountType = '106';
    currentFormContext.productCategory = 'Savings';
    currentFormContext.productCategoryID = '483';
    currentFormContext.productKey = '601';
    currentFormContext.selectedAccountName = 'NRE - Regular Savings Account';
  } else if (nreEliteSavingsAcco === 'on') {
    currentFormContext.productAccountName = 'NRE savings account';
    currentFormContext.productAccountType = '1350';
    currentFormContext.productCategory = 'Savings';
    currentFormContext.productCategoryID = '483';
    currentFormContext.productKey = '601';
    currentFormContext.selectedAccountName = 'NRE - Elite Savings Account';
  } else if (nreCurrentAcco === 'on') {
    currentFormContext.productAccountName = 'NRE  current account';
    currentFormContext.productAccountType = '218';
    currentFormContext.productCategory = 'Current';
    currentFormContext.productCategoryID = '484';
    currentFormContext.productKey = '604';
    currentFormContext.selectedAccountName = 'NRE - Current Account';
  }

  sendAnalytics('select account type click', { productAccountType: currentFormContext?.productAccountType ?? '' }, 'ON_SELECT_ACCOUNT_TYPE', globals);
}

function multiAccountVarient(selectAccount, globals) {
  const varientType = currentFormContext.journeyAccountType;
  globals.functions.setProperty(selectAccount.multipleAccounts, { visible: false });
  globals.functions.setProperty(globals.form.wizardPanel.continue, { visible: true });
  globals.functions.setProperty(globals.form.wizardPanel.MultiAccoCountinue, { visible: false });
  globals.functions.setProperty(selectAccount.text, { visible: false });
  globals.functions.setProperty(selectAccount.customerName, { visible: false });
  if (varientType === 'NRE') {
    globals.functions.setProperty(selectAccount.nro_account_type_pannel, { visible: true });
    globals.functions.setProperty(selectAccount.nre_account_type_pannel.nreeliteSavingsAccountPanel.eliteSavingsAccount, { value: null });
  } else if (varientType === 'NRO') {
    globals.functions.setProperty(selectAccount.nre_account_type_pannel, { visible: true });
    globals.functions.setProperty(selectAccount.nro_account_type_pannel.eliteSavingsAccountPanel.eliteSavingsAccount, { value: null });
  }

  currentFormContext.existingAccountType = varientType;
  sendAnalytics('continue btn select account', { varientType }, 'SELECT_ACCOUNT_ON_CONTINUE_CLICK', globals);
}

function submitThankYou(globals) {
  invokeJourneyDropOffUpdate('CUSTOMER_REVIEW_SUBMITTED', globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.registeredMobileNumber.$value, globals.form.runtime.leadProifileId.$value, globals.form.runtime.journeyId.$value, globals);
}

const feedbackButton = () => {
  const thankyouSubmit = document.querySelector('button[name="tqSubmitButton"]');
  setTimeout(() => {
    document.querySelectorAll('.field-ratingbuttons .button').forEach((button) => {
      button.addEventListener('click', function ratingClick() {
        document.querySelectorAll('.field-ratingbuttons .button').forEach((btn) => {
          btn.classList.remove('active');
        });
        this.classList.add('active');
        const ratingValue = this.textContent;
        const captureRatingInput = document.querySelector('input[name="captureRating"]');
        if (captureRatingInput) {
          captureRatingInput.value = ratingValue;
          thankyouSubmit.removeAttribute('disabled');
        }
      });
    });
  }, 100);
};

export {
  validateLogin,
  getOtpNRE,
  otpTimer,
  otpValidationNRE,
  updateOTPHelpText,
  getCountryCodes,
  resendOTP,
  customFocus,
  validFDPan,
  switchWizard,
  setupBankUseSection,
  idComRedirection,
  addPageNameClassInBody,
  showFinancialDetails,
  showNomineeDetails,
  multiCustomerId,
  crmLeadIdDetail,
  selectSingleAccount,
  confirmDetailsConsent,
  crmProductID,
  nreNroPageRedirected,
  nreNroAccountType,
  multiAccountVarient,
  nreNroInit,
  nreNroInvokeJourneyDropOffByParam,
  prefillAccountDetail,
  fetchIdComToken,
  prefillThankYouPage,
  accountOpeningNreNro,
  validateJourneyParams,
  errorHandling,
  getCountryName,
  postIdCommRedirect,
  nreNroShowHidePage,
  submitThankYou,
  reloadPage,
  accountOpeningNreNro1,
  feedbackButton,
};