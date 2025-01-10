/* eslint-disable no-undef */
import {
  data,
  ANALYTICS_CLICK_OBJECT,
  ANALYTICS_PAGE_LOAD_OBJECT,
  PAGE_NAME,
} from './nreNroAnalyticsConstants.js';
import {
  createDeepCopyFromBlueprint,
  santizedFormDataWithContext,
} from '../../common/formutils.js';
import { FORM_NAME } from './constant.js';
import { CURRENT_FORM_CONTEXT as currentFormContext } from '../../common/constants.js';

/**
 * Hashes a phone number using SHA-256 algorithm.
 *
 * @function hashInSha256
 * @param {string}  - The phone number to be hashed.
 * @returns {Promise<string>} A promise that resolves to the hashed phone number in hexadecimal format.
 */
const hashInSha256 = async (inputString) => {
  const encoder = new TextEncoder();
  const rawdata = encoder.encode(inputString);
  const hash = await crypto.subtle.digest('SHA-256', rawdata);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const hashPhNo = async (phoneNumber) => {
  const hashed = await hashInSha256(String(phoneNumber));
  return hashed;
};

/**
 * set analytics generic props for page load
 * @name setAnalyticPageLoadProps
 * @param {string} linkName - linkName
 * @param {string} linkType - linkName
 * @param {object} formContext - currentFormContext.
 * @param {object} digitalData
 */

function setAnalyticPageLoadProps(journeyState, formData, digitalData) {
  digitalData.user.pseudoID = '';// Need to check
  digitalData.user.journeyName = currentFormContext?.journeyName;
  digitalData.user.journeyID = formData?.journeyId;
  digitalData.user.journeyState = journeyState;
  digitalData.user.casa = '';
  digitalData.form.name = FORM_NAME;
}

/**
 * set analytics generic props for click event
 * @name setAnalyticClickGenericProps
 * @param {string} linkName - linkName
 * @param {string} linkType - linkName
 * @param {object} formContext - currentFormContext.
 * @param {object} digitalData
 */

function setAnalyticClickGenericProps(linkName, linkType, formData, journeyState, digitalData) {
  digitalData.link = {
    linkName,
    linkType,
  };
  digitalData.link.linkPosition = data[linkName].linkPosition;
  digitalData.user.pseudoID = '';
  digitalData.user.journeyName = currentFormContext?.journeyName;
  digitalData.user.journeyID = currentFormContext?.journeyID;
  digitalData.user.journeyState = journeyState;
  digitalData.form.name = FORM_NAME;
  digitalData.user.casa = '';
}

function getValidationMethod(formContext) {
  return formContext?.form?.login?.panDobSelection === '0' ? 'DOB' : 'PAN';
}

/**
 * Sends analytics event on page load.
 * @name sendPageloadEvent
 * @param {string} journeyState.
 * @param {object} formData.
 * @param {string} pageName.
 * @param {string} errorAPI.
 */
function sendPageloadEvent(journeyState, formData, pageName, errorAPI, errorMessage, errorCode) {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_PAGE_LOAD_OBJECT);
  digitalData.page.pageInfo.pageName = pageName ?? '';
  digitalData.page.pageInfo.errorAPI = errorAPI ?? '';
  digitalData.page.pageInfo.errorCode = errorCode ?? '';
  digitalData.page.pageInfo.errorMessage = errorMessage ?? '';
  
  if(String(formData?.form?.login?.registeredMobileNumber) !== 'undefined' && String(formData?.countryCode) !== 'undefined'){
    hashPhNo(String(formData?.countryCode.substring(1,)) + String(formData?.form?.login?.registeredMobileNumber)).then((hashedMobile) => {
      digitalData.event.mobileWith = hashedMobile;
      hashPhNo(String(formData?.countryCode) + String(formData?.form?.login?.registeredMobileNumber)).then((hashedMobileWithPlus) => {
          digitalData.event.mobileWithPlus = hashedMobileWithPlus;
      });
    });
  } else if(String(currentFormContext?.mobileNumber) !== 'undefined' && String(currentFormContext?.isdCode) !== 'undefined'){
    hashPhNo(String(currentFormContext?.isdCode) + String(currentFormContext?.mobileNumber)).then((hashedMobile) => {
      digitalData.event.mobileWith = hashedMobile;
      hashPhNo('+' + String(currentFormContext?.isdCode) + String(currentFormContext?.mobileNumber)).then((hashedMobileWithPlus) => {
          digitalData.event.mobileWithPlus = hashedMobileWithPlus;
      });
    });
  }


  // digitalData.page.event.status = eventStatus;
  setAnalyticPageLoadProps(journeyState, formData, digitalData);
  if(typeof window !== 'undefined' && typeof _satellite !== 'undefined'){
    switch (pageName) {
      case 'Step 3 - Account Type': {
        digitalData.formDetails.bankBranch = currentFormContext?.fatca_response?.customerAccountDetailsDTO[currentFormContext.selectedCheckedValue]?.branchName ?? '';
        digitalData.formDetails.existingAccountType = currentFormContext?.journeyAccountType ?? '';
        digitalData.formDetails.accountType = currentFormContext?.productAccountName ?? '';
        break;
      }
      case 'Step 4 - Confirm Details': {
        digitalData.formDetails.city = currentFormContext?.fatca_response?.namCustadrCity ?? '';
        digitalData.formDetails.state = currentFormContext?.fatca_response?.namCustadrState ?? '';
        digitalData.formDetails.pincode = currentFormContext?.fatca_response?.txtCustadrZip ?? '';
        digitalData.formDetails.nationality = formData?.form?.confirmDetails?.countryOfBirth ?? '';
        digitalData.formDetails.countryTaxResidence = formData?.form?.confirmDetails?.countryTaxResidence ?? '';
        digitalData.formDetails.countryofBirth = formData?.form?.confirmDetails?.countryOfBirth ?? '';
        digitalData.formDetails.nomineeRelation = formData?.form?.confirmDetails?.nomineeDetails?.relation ?? '';
        digitalData.formDetails.companyName = formData?.form?.confirmDetails?.financialDetails?.employeerName ?? '';
        digitalData.formDetails.AnnualIncome = formData?.form?.confirmDetails?.financialDetails?.grossAnnualIncome ?? '';
        digitalData.formDetails.currency = formData?.form?.confirmDetails?.financialDetails?.currencyName ?? '';
        digitalData.formDetails.residenceType = formData?.form?.confirmDetails?.financialDetails?.residenceType ?? '';
        digitalData.formDetails.sourceoffunds = formData?.form?.confirmDetails?.financialDetails?.sourceOfFunds ?? '';
        digitalData.formDetails.selfemployeddate = formData?.form?.confirmDetails?.financialDetails?.selfEmployedSince ?? '';
        digitalData.formDetails.natureofbusiness = formData?.form?.confirmDetails?.financialDetails?.natureOfBusiness ?? '';
        digitalData.formDetails.typeofcompany = formData?.form?.confirmDetails?.financialDetails?.typeOfCompoanyFirm ?? '';
        digitalData.formDetails.typeofprofessional = formData?.form?.confirmDetails?.financialDetails?.selfEmployedProfessional ?? '';
        break;
      }
      case 'Step 5 - Confirmation': {
        digitalData.formDetails.accountType = currentFormContext.accountType ?? '';
        digitalData.formDetails.branchCode = currentFormContext.fatca_response.customerAccountDetailsDTO[currentFormContext.selectedCheckedValue].branchCode ?? '';
        digitalData.formDetails.bankBranch = currentFormContext.fatca_response.customerAccountDetailsDTO[currentFormContext.selectedCheckedValue].branchName ?? '';
        break;
      }
      default:
      // do nothing
    }
    
    window.digitalData = digitalData || {};
    _satellite.track('pageload');
  }
}

// /**
//  *Creates digital data for otp click event.
//  * @param {string} phone
//  * @param {string} validationType
//  * @param {string} eventType
//  * @param {object} formContext
//  * @param {object} digitalData
//  */
async function sendSubmitClickEvent(phone, eventType, linkType, formData, journeyState, digitalData) {
  setAnalyticClickGenericProps(eventType, linkType, formData, journeyState, digitalData);
  digitalData.page.pageInfo.pageName = PAGE_NAME.nrenro[eventType];
  if((formData?.countryCode ?? '' !== '') && (formData?.form?.login?.registeredMobileNumber ?? '' !== '')){
    digitalData.event.mobileWith = await hashPhNo(String(formData?.countryCode.substring(1,)) + String(formData?.form?.login?.registeredMobileNumber));
    digitalData.event.mobileWithPlus = await hashPhNo(String(formData?.countryCode)+String(formData?.form?.login?.registeredMobileNumber));
  } else if((currentFormContext?.isdCode ?? '' !== '') && (currentFormContext?.mobileNumber ?? '' !== '')){
    digitalData.event.mobileWith = await hashPhNo(String(currentFormContext?.isdCode) + String(currentFormContext?.mobileNumber));
    digitalData.event.mobileWithPlus = await hashPhNo('+' + String(currentFormContext?.isdCode)+String(currentFormContext?.mobileNumber));
  }
  
  switch (eventType) {
    case 'otp click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.link.linkName = 'otp click';
        digitalData.event.status = 1;
        digitalData.event.phone = await hashPhNo(String(formData?.form?.login?.registeredMobileNumber));
        _satellite.track('submit');
      }
      currentFormContext.action = 'otp click';
      setTimeout(() => {
        sendPageloadEvent(journeyState, formData, PAGE_NAME.nrenro['confirm otp']);
      }, 1000);
      break;
    }
    case 'privacy consent click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        _satellite.track('submit');
      }
      break;
    }
    case 'resend otp click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 2 - Verify with OTP';
        digitalData.link.linkName = 'Resend OTP';
        _satellite.track('submit');
      }
      break;
    }
    case 'mandatory I understand click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        _satellite.track('submit');
      }
      break;
    }
    case 'optional I understand click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        _satellite.track('submit');
      }
      break;
    }
    case 'submit otp click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 2 - Verify with OTP';
        _satellite.track('submit');
      }
      break;
    }
    case 'continue btn select account': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        _satellite.track('submit');
      }

      setTimeout(() => {
        sendPageloadEvent(journeyState, formData, PAGE_NAME.nrenro['select account type click']);
      }, 1000);
      break;
    }
    case 'select account type click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = PAGE_NAME.nrenro['select account type click'];
        _satellite.track('submit');
      }

      setTimeout(() => {
        sendPageloadEvent(journeyState, formData, PAGE_NAME.nrenro['confirm details']);
      }, 1000);
      break;
    }
    case 'thankyou page click': {
      setTimeout(() => {
        sendPageloadEvent(journeyState, formData, PAGE_NAME.nrenro['thank you screen']);
      }, 1000);
      break;
    }
    case 'confirm details click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        _satellite.track('submit');
      }
      break;
    }
    case 'confirm otp': {
      setTimeout(() => {
        sendPageloadEvent('CUSTOMER_IDENTITY_RESOLVED', formData, PAGE_NAME.ccc['check offers']);
      }, 1000);
      break;
    }
    case 'Fatca Details accordion collapse click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Fatca Details accordion expand click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Personal Details accordion collapse click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Personal Details accordion expand click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Financial Details accordion collapse click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Financial Details accordion expand click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Nominee Details accordion collapse click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Nominee Details accordion expand click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Confirm Details accordion collapse click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'privacy click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'apply for click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        _satellite.track('submit');
      }
      break;
    }
    case 'hdfc website click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        _satellite.track('submit');
      }
      break;
    }
    case 'requested product click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'other products click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.event.status = 1;
        _satellite.track('submit');
      }
      break;
    }
    case 'Nominee Details click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.page.pageInfo.pageName = 'Step 4 - Confirm Details';
        digitalData.event.status = 1;
        _satellite.track('event');
      }
      break;
    }
    case 'Fatca Details click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        _satellite.track('event');
      }
      break;
    }
    case 'on submit click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.event.status = '1';
        digitalData.formDetails.facingIssue = (formData?.form?.thankyou?.facingIssue === '0') ? 'No' : 'Yes';
        digitalData.event.rating = formData?.AccountOpeningNRENRO?.feedbackrating ?? '';
        digitalData.page.pageInfo.pageName = 'Step 5 - Confirmation';
        _satellite.track('survey');
      }
      break;
    }
    case 'nine_rating_cta_click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.event.status = '1';
        digitalData.formDetails.facingIssue = (formData?.form?.thankyou?.facingIssue === '0') ? 'No' : 'Yes';
        digitalData.event.rating = '9';
        digitalData.page.pageInfo.pageName = 'Step 5 - Confirmation';
        _satellite.track('survey');
      }
      break;
    }
    case 'ten_rating_cta_click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        digitalData.event.status = '1';
        digitalData.formDetails.facingIssue = (formData?.form?.thankyou?.facingIssue === '0') ? 'No' : 'Yes';
        digitalData.event.rating = '10';
        digitalData.page.pageInfo.pageName = 'Step 5 - Confirmation';
        _satellite.track('survey');
      }
      break;
    }
    case 'on apply for CTA click': {
      if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
        window.digitalData = digitalData || {};
        _satellite.track('event');
      }
      break;
    }
    default:
    // do nothing
  }
}

function populateResponse(payload, eventType, digitalData, formData) {
  switch (eventType) {
    case 'otp click': {
      digitalData.formDetails.privacyContent = formData?.form?.consent?.checkboxConsent1Label ? 'Yes' : 'No';;
      digitalData.formDetails.callSmsWhatsappConsent = formData?.form?.consent?.checkboxConsent2Label ? 'Yes' : 'No';
      digitalData.event.validationMethod = getValidationMethod(formData);
      digitalData.formDetails.country = formData?.countryCode ?? '';;
      break;
    }
    case 'privacy consent click': {
      digitalData.event.status = 1;
      break;
    }
    case 'mandatory I understand click': {
      digitalData.event.status = 1;
      break;
    }
    case 'optional I understand click': {
      digitalData.event.status = 1;
      break;
    }
    case 'resend otp click': {
      digitalData.event.status = 1;
      break;
    }
    case 'submit otp click': {
      digitalData.event.status = 1;
      break;
    }
    case 'continue btn select account': {
      digitalData.formDetails.existingAccountType = currentFormContext?.journeyAccountType ?? '';
      digitalData.formDetails.bankBranch = currentFormContext?.fatca_response?.customerAccountDetailsDTO[currentFormContext.selectedCheckedValue]?.branchName ?? '';
      break;
    }
    case 'select account type click': {
      digitalData.formDetails.accountType = currentFormContext?.productAccountName ?? '';
      digitalData.formDetails.existingAccountType = currentFormContext?.journeyAccountType ?? '';
      digitalData.formDetails.bankBranch = currentFormContext?.fatca_response?.customerAccountDetailsDTO[currentFormContext.selectedCheckedValue]?.branchName ?? '';
      digitalData.event.status = 1;
      break;
    }
    case 'confirm details click': {
      digitalData.assisted.flag = (currentFormContext.flag === 'off') ? 1 : 0;
      digitalData.assisted.lg = currentFormContext.lgCode ?? '';
      digitalData.assisted.lc = currentFormContext.lcCode ?? '';
      digitalData.formDetails.TAndCConsent = formData?.needBankHelp?.confirmDetailsConsent1 ?? '';
      digitalData.formDetails.detailsConsent = formData?.needBankHelp?.confirmDetailsConsent2 ?? '';
      digitalData.event.status = 1;
      break;
    }
    case 'idcom redirection check': {
      digitalData.event.validationMethod = payload?.validationMethod ?? '';
      digitalData.event.status = payload?.status ?? '';
      break;
    }
    default:
    // do nothing
  }
}

/**
 * Send analytics events.
 * @param {string} eventType
 * @param {object} payload
 * @param {string} journeyState
 * @param {object} formData
 * @param {object} currentFormContext
 */
function sendAnalyticsEvent(eventType, payload, journeyState, formData) {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_CLICK_OBJECT);
  const attributes = data[eventType];
  populateResponse(payload, eventType, digitalData, formData);
  sendSubmitClickEvent(formData?.login?.registeredMobileNumber, eventType, attributes?.linkType, formData, journeyState, digitalData);
}

/**
* sendErrorAnalytics
* @param {string} errorCode
* @param {string} errorMsg
* @param {string} journeyState
* @param {object} globals
*/
function sendErrorAnalytics(errorCode, errorMsg, journeyState, globals) {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_PAGE_LOAD_OBJECT);
  setAnalyticPageLoadProps(journeyState, santizedFormDataWithContext(globals), digitalData);
  digitalData.page.pageInfo.errorCode = errorCode;
  digitalData.page.pageInfo.errorMessage = errorMsg;
  if (typeof window !== 'undefined' && typeof _satellite !== 'undefined') {
    window.digitalData = digitalData || {};
    _satellite.track('pageload');
  }
}

/**
* sendAnalytics
* @param {string} eventType
* @param {string} payload
* @param {string} journeyState
* @param {object} globals
*/
function sendAnalytics(eventType, payload, journeyState, globals) {
  let formData = santizedFormDataWithContext(globals);
  currentFormContext.lgCode = globals?.form?.wizardPanel.wizardFragment.wizardNreNro.confirmDetails.needBankHelp.bankUseFragment.mainBankUsePanel.lgCode.$value;
  currentFormContext.lcCode = globals?.form?.wizardPanel.wizardFragment.wizardNreNro.confirmDetails.needBankHelp.bankUseFragment.mainBankUsePanel.lcCode.$value;
  currentFormContext.flag = globals?.form?.wizardPanel.wizardFragment.wizardNreNro.confirmDetails.needBankHelp.bankUseFragment.mainBankUsePanel.bankUseToggle.$value;
  if (typeof formData === 'undefined' || formData === null) {
    formData = {};
    formData.currentFormContext = currentFormContext;
  }
  if (eventType.includes('page load')) {
    const pageName = eventType.split('_')[1];
    const errorAPI = formData?.AccountOpeningNRENRO?.apiDetails?.APIName ?? '';
    const errorMessage = formData?.AccountOpeningNRENRO?.apiDetails?.errorMessage ?? '';
    const errorCode = formData?.AccountOpeningNRENRO?.apiDetails?.errorCode ?? '';
    // const eventStatus = formData?.AccountOpeningNRENRO?.apiDetails?.status;
    sendPageloadEvent(journeyState, formData, pageName, errorAPI, errorMessage, errorCode);
  } else {
    // console.log('elsesssssss', eventType);
    sendAnalyticsEvent(eventType, payload, journeyState, formData);
  }
}

/**
 * Sends an analytics event and performs additional asynchronous operations.
 *
 * @param {string} eventType - The type of the event to be sent.
 * @param {string} payload - The data to be sent with the event.
 * @param {string} journeyState - The state of the current journey.
 * @param {Object} globals - Global context or data required for the event.
 * @returns {Promise<object>} A promise that resolves with 1 if the operation is successful, or rejects with an error.
 */
function asyncAnalytics(eventType, payload, journeyState, globals) {
  return new Promise((resolve) => {
    try {
      sendAnalyticsEvent(eventType, payload, journeyState, santizedFormDataWithContext(globals));
      setTimeout(() => resolve({ response: 'success' }), 2000);
    } catch (ex) {
      // no console.
    }
  });
}

function enableAccordionClick(globals) {
  const accordions = document.querySelectorAll('.panel-wrapper .nre-style-accordian');
  accordions.forEach((accordion) => {
    if (!accordion.dataset.listenerAdded) {
      accordion.addEventListener('click', (event) => {
        event.stopPropagation();
        const legendElement = accordion.querySelector('.field-label.nrenro-accordian');
        if (event.target === legendElement) {
          event.stopPropagation();
          const accordionName = legendElement.textContent.trim();
          if(accordionName !== 'Confirm Details'){
            setTimeout(() => {
              if (legendElement.classList.contains('accordion-collapse')) {
                sendAnalytics(accordionName + ' accordion expand click', {}, '', globals);
              } else{
                sendAnalytics(accordionName + ' accordion collapse click', {}, '', globals);
              }
            }, 1000);
          }
        }
      });
      accordion.dataset.listenerAdded = 'true';
    }
  });
}

function attachPrivacyPolicyAnalytics(globals) {
  const privacyPolicyLink = document.querySelector('.checkbox-wrapper a');
  if (privacyPolicyLink && privacyPolicyLink.textContent.includes('Privacy Policy')) {
    privacyPolicyLink.addEventListener('click', (event) => {
      event.preventDefault();
      sendAnalytics('privacy click', {}, '', globals);
      setTimeout(() => {
        window.open(privacyPolicyLink.href, '_blank');
      }, 100);
    });
  }
  const applyForLinks = document.querySelectorAll('a');
  applyForLinks.forEach((link) => {
    if (link.textContent.trim() === 'Apply for a') {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        sendAnalytics('apply for click', {}, '', globals);
        setTimeout(() => {
          window.open(link.href, '_blank');
        }, 100);
      });
    }
  });
  const hdfcBankWebsiteLinks = document.querySelectorAll('a');
  hdfcBankWebsiteLinks.forEach((link) => {
    if (link.textContent.trim() === 'HDFC Bank Website') {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        sendAnalytics('hdfc website click', {}, '', globals);
        setTimeout(() => {
          window.open(link.href, '_blank');
        }, 100);
      });
    }
  });
  const requestedProduct = document.querySelector('.field-checkboxconsent1label b');
  if (requestedProduct) {
    requestedProduct.addEventListener('click', (event) => {
      event.preventDefault();
      sendAnalytics('requested product click', {}, '', globals);
    });
  }
  const otherProducts = document.querySelector('.field-checkboxconsent2label b');
  if (otherProducts) {
    otherProducts.addEventListener('click', (event) => {
      event.preventDefault();
      sendAnalytics('other products click', {}, '', globals);
      setTimeout(() => {
      }, 100);
    });
  }
}

export {
  sendPageloadEvent,
  sendAnalyticsEvent,
  sendErrorAnalytics,
  sendAnalytics,
  asyncAnalytics,
  enableAccordionClick,
  attachPrivacyPolicyAnalytics,
};
