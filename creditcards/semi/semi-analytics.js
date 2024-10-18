/* eslint-disable no-undef */
import {
  createDeepCopyFromBlueprint,
  santizedFormDataWithContext,
} from '../../common/formutils.js';
import {
  JOURNEY_NAME as FORM_NAME,
  CURRENT_FORM_CONTEXT as currentFormContext,
} from './constant.js';
import {
  ANALYTICS_JOURNEY_STATE,
  ANALYTICS_LINK_BTN,
  ANALYTICS_OBJECT_SEMI,
  ANALYTICS_PAGE_LOAD_OBJECT_SEMI,
  ANALYTICS_PAGE_NAME,
} from './semi-analytics-constant.js';

const currentState = {
  pageName: '',
};

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

const setAnalyticPageLoadProps = (journeyState, formData, digitalData) => {
  digitalData.user.pseudoID = '';// Need to check
  digitalData.user.journeyName = formData?.journeyName || formData?.smartemi?.journeyName;
  digitalData.user.journeyID = formData?.journeyId || formData?.smartemi?.journeyId;
  digitalData.user.journeyState = journeyState;
  digitalData.user.casa = '';
  digitalData.user.aan = '';
  digitalData.form.name = 'SmartEMI';
  digitalData.form.emiCategory = '';
};

/**
   * set analytics generic props for click event
   * @name setAnalyticClickGenericProps
   * @param {string} linkName - linkName
   * @param {string} linkType - linkName
   * @param {object} formContext - currentFormContext.
   * @param {object} digitalData
   */

const setAnalyticClickGenericProps = (linkName, linkType, formData, journeyState, digitalData) => {
  digitalData.link = {};
  digitalData.link.linkName = ANALYTICS_LINK_BTN[linkName].linkName;
  digitalData.link.linkType = ANALYTICS_LINK_BTN[linkName].linkType;
  digitalData.link.linkPosition = ANALYTICS_LINK_BTN[linkName].linkPosition;
  digitalData.user.pseudoID = '';
  digitalData.user.journeyName = currentFormContext?.journeyName || formData?.smartemi?.journeyName;
  digitalData.user.journeyID = currentFormContext?.journeyID || formData?.smartemi?.journeyId;
  digitalData.user.journeyState = journeyState;
  if (linkName === 'otp click') {
    digitalData.form.name = FORM_NAME;
    digitalData.user.casa = '';
  }
};

/**
   * Sends analytics event on page load.
   * @name sendPageloadEvent
   * @param {string} journeyState.
   * @param {object} formData.
   * @param {string} pageName.
   */
const sendPageloadEvent = (journeyState, formData, pageName) => {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_PAGE_LOAD_OBJECT_SEMI);
  digitalData.page.pageInfo.pageName = pageName;
  setAnalyticPageLoadProps(journeyState, formData, digitalData);
  if (currentState.pageName === ANALYTICS_PAGE_NAME['transaction view']) {
    digitalData.formDetails = {};
    digitalData.formDetails.eligibleTransactions = ''; // eligible transaction on load of transaction page
    currentState.pageName = null;
  }
  if (currentState.pageName === ANALYTICS_PAGE_NAME['tenure page']) {
    /* default selected on load of this page */
    const selectedData = formData?.aem_tenureSelectionRepeatablePanel?.find((el) => el.aem_tenureSelection);
    digitalData.formDetails = {};
    digitalData.formDetails.installment = selectedData?.aem_tenureSelectionEmi ?? '';
    digitalData.formDetails.tenure = selectedData?.aem_tenure_display ?? '';
    digitalData.formDetails.roi = selectedData?.aem_roi_monthly ?? '';
    currentState.pageName = null;
  }
  if (currentState.pageName === ANALYTICS_PAGE_NAME['thank you']) {
    digitalData.formDetails = {};
    digitalData.formDetails.reference = formData?.smartemi?.originAcct ?? '';
    digitalData.formDetails.amtCreditedDealer = formData?.smartemi?.SmartEMIAmt ?? '';
    digitalData.user.casa = 'YES';
    digitalData.user.aan = formData?.smartemi?.originAcct;
    currentState.pageName = null;
  }
  if (window) {
    window.digitalData = digitalData || {};
  }
  _satellite.track('pageload');
};

/**
   *Creates digital data for otp click event.
   * @param {string} validationType
   * @param {string} eventType
   * @param {object} formContext
   * @param {object} digitalData
   */
const sendSubmitClickEvent = async (eventType, linkType, formData, journeyState, digitalData) => {
  setAnalyticClickGenericProps(eventType, linkType, formData, journeyState, digitalData);
  digitalData.page.pageInfo.pageName = ANALYTICS_PAGE_NAME[eventType];
  switch (eventType) {
    case 'otp click': {
      digitalData.event = {
        phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
        validationMethod: 'credit card',
        status: '1',
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      setTimeout(() => {
        sendPageloadEvent(ANALYTICS_JOURNEY_STATE['otp click'], formData, ANALYTICS_PAGE_NAME['submit otp']);
      }, 1000);
      break;
    }

    case 'submit otp': {
      digitalData.event = {
        phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
        validationMethod: 'credit card',
        status: '1',
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      setTimeout(() => {
        currentState.pageName = ANALYTICS_PAGE_NAME['transaction view'];
        sendPageloadEvent(ANALYTICS_JOURNEY_STATE['submit otp'], formData, ANALYTICS_PAGE_NAME['transaction view']);
      }, 1000);
      break;
    }

    case 'resend otp': {
      digitalData.event = {
        phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
        validationMethod: 'credit card',
        status: '1',
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }

    case 'transaction view': {
      digitalData.event.status = {
        phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
        validationMethod: 'credit card',
        status: '1',
      };
      digitalData.formDetails = {};
      digitalData.formDetails.amt = formData?.smartemi?.SmartEMIAmt || currentFormContext.SMART_EMI_AMOUNT; // total amount
      digitalData.formDetails.eligibleTransactions = ''; // eligible transaction ?. no of eligible transaction available
      digitalData.formDetails.selectedTransactions = currentFormContext?.TXN_SELECTED_COUNTS?.total; // no of selected
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      setTimeout(() => {
        currentState.pageName = ANALYTICS_PAGE_NAME['tenure page'];
        sendPageloadEvent(ANALYTICS_JOURNEY_STATE['transaction view'], formData, ANALYTICS_PAGE_NAME['tenure page']);
      }, 1000);
      break;
    }

    case 'tenure page': {
      digitalData.event = {
        phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
        validationMethod: 'credit card',
        status: '1',
      };
      const selectedData = formData?.aem_tenureSelectionRepeatablePanel?.find((el) => el.aem_tenureSelection);
      digitalData.formDetails = {};
      digitalData.formDetails.installment = selectedData?.aem_tenureSelectionEmi ?? '';
      digitalData.formDetails.tenure = selectedData?.aem_tenure_display ?? '';
      digitalData.formDetails.roi = selectedData?.aem_roi_monthly ?? '';
      digitalData.formDetails.amt = formData?.smartemi?.SmartEMIAmt || currentFormContext.SMART_EMI_AMOUNT; // total amount
      digitalData.assisted = {};
      digitalData.assisted.flag = formData?.aem_bankAssistedToggle;
      digitalData.assisted.lg = formData?.aem_lgCode ?? '';
      digitalData.assisted.lc = formData?.aem_lcCode ?? '';
      const EMI_CATEGORY = (formData?.smartemi?.TransactionType === 'Both') ? 'Billed / Unbilled ' : formData?.smartemi?.TransactionType;
      const ccBilledData = currentFormContext?.EligibilityResponse?.ccBilledTxnResponse?.responseString ? currentFormContext?.EligibilityResponse?.ccBilledTxnResponse?.responseString : [];
      const ccUnBilledData = currentFormContext?.EligibilityResponse?.ccUnBilledTxnResponse?.responseString ? currentFormContext?.EligibilityResponse?.ccUnBilledTxnResponse?.responseString : [];
      const errorMessages = {
        noBilled: 'No transactions available in billed category',
        noUnBilled: 'No transactions available in unbilled category',
        noTransactions: 'No transactions to convert',
      };
      if ((ccUnBilledData?.length === 0) && (ccBilledData?.length === 0)) {
        digitalData.page.pageInfo.errorMessage = errorMessages.noTransactions;
      } else if ((ccUnBilledData?.length === 0)) {
        digitalData.page.pageInfo.errorMessage = errorMessages.noUnBilled;
      } else if ((ccBilledData?.length === 0)) {
        digitalData.page.pageInfo.errorMessage = errorMessages.noBilled;
      }
      digitalData.form.emiCategory = EMI_CATEGORY;
      if (window) {
        window.digitalData = digitalData || {};
      }
      const trackingEvent = ((ccUnBilledData?.length === 0) && (ccBilledData?.length === 0)) ? 'unbilled_clicked' : 'submit';
      _satellite.track(trackingEvent);
      setTimeout(() => {
        sendPageloadEvent(ANALYTICS_JOURNEY_STATE['tenure page'], formData, ANALYTICS_PAGE_NAME['confirm tenure']);
      }, 1000);
      break;
    }

    case 'confirm tenure': {
      digitalData.event = {
        phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
        validationMethod: 'credit card',
        status: '1',
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      setTimeout(() => {
        currentState.pageName = ANALYTICS_PAGE_NAME['thank you'];
        sendPageloadEvent(ANALYTICS_JOURNEY_STATE['thank you'], formData, ANALYTICS_PAGE_NAME['thank you']);
      }, 7000);
      break;
    }

    case 'resendOtp confirmTenure': {
      digitalData.event = {
        phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
        validationMethod: 'credit card',
        status: '1',
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }
    case 'submit review': {
      digitalData.event = {};
      digitalData.event.rating = formData?.ratingvalue || formData.rating;
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }
    default:
        // do nothing
  }
};

const populateResponse = (payload, eventType, digitalData) => {
  switch (eventType) {
    case 'otp click':
    case 'transaction view':
    case 'tenure page':
      if (payload === 'Record successfully updated!') {
        digitalData.page.pageInfo.errorCode = '0';
        digitalData.page.pageInfo.errorMessage = 'success';
      } else {
        digitalData.page.pageInfo.errorCode = payload?.errorCode ?? '';
        digitalData.page.pageInfo.errorMessage = payload?.errorMsg ?? '';
      }
      break;
    case 'confirm tenure':
    case 'resend otp':
    case 'resendOtp confirmTenure':
    case 'submit review':
    case 'submit otp': {
      digitalData.page.pageInfo.errorCode = payload?.errorCode ?? '';
      digitalData.page.pageInfo.errorMessage = payload?.errorMsg ?? '';
      break;
    }
    default:
      // do nothing
  }
};

/**
   * Send analytics events.
   * @param {string} eventType
   * @param {object} payload
   * @param {string} journeyState
   * @param {object} formData
   * @param {object} currentFormContext
   */
const sendAnalyticsEvent = (eventType, payload, journeyState, formData) => {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_OBJECT_SEMI);
  const attributes = ANALYTICS_LINK_BTN[eventType];
  populateResponse(payload, eventType, digitalData);
  sendSubmitClickEvent(eventType, attributes?.linkType, formData, journeyState, digitalData);
};

/**
  * sendErrorAnalytics
  * @param {string} errorCode
  * @param {string} errorMsg
  * @param {string} journeyState
  * @param {object} globals
  */
function sendErrorAnalytics(errorCode, errorMsg, journeyState, globals) {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_PAGE_LOAD_OBJECT_SEMI);
  setAnalyticPageLoadProps(journeyState, santizedFormDataWithContext(globals), digitalData);
  digitalData.page.pageInfo.errorCode = errorCode;
  digitalData.page.pageInfo.errorMessage = errorMsg;
  digitalData.page.pageInfo.errorAPI = ''; // "OTP_Validation|EligibilityCheck"
  digitalData.page.pageInfo.pageName = ANALYTICS_PAGE_NAME['Error Page'];
  if (window) {
    window.digitalData = digitalData || {};
  }
  _satellite.track('pageload');
}

/**
  * sendAnalytics
  * @param {string} eventType
  * @param {string} payload
  * @param {string} journeyState
  * @param {object} globals
  */
function sendAnalytics(eventType, payload, journeyState, globals) {
  const formData = santizedFormDataWithContext(globals);
  if (eventType.includes('page load')) {
    const pageName = ANALYTICS_PAGE_NAME['page load'];
    sendPageloadEvent(journeyState, formData, pageName);
  } else {
    sendAnalyticsEvent(eventType, payload, journeyState, formData);
  }
}

export {
  sendAnalytics,
  sendErrorAnalytics,
};
