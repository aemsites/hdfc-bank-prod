/* eslint-disable no-console */
import {
  validatePan,
  panAPISuccesHandler,
} from './panvalidation.js';

import fetchAuthCode from './idcomutils.js';

import {
  urlPath,
  santizedFormDataWithContext,
  createLabelInElement,
  decorateStepper,
} from './formutils.js';

import {
  fetchJsonResponse, hideLoaderGif,
} from './makeRestAPI.js';

import { initRestAPIDataSecurityServiceES6 } from './apiDataSecurity.js';

import * as CONSTANT from './constants.js';

const {
  ENDPOINTS,
  CURRENT_FORM_CONTEXT: currentFormContext,
} = CONSTANT;

/**
  * @name isValidJson
  * @param {string} str
  */
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Detects the operating system of the user's device.
 *
 * @returns {string|null} The name of the operating system (e.g., 'Mac OS', 'iOS', 'Windows', 'Android', 'Linux') or null if the operating system cannot be determined.
 */
function getOS() {
  const { userAgent } = window.navigator;
  const { platform } = window.navigator;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
  let os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'Mac OS';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'iOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (!os && /Linux/.test(platform)) {
    os = 'Linux';
  }
  return os;
}

/**
 * Detects the type of device the user is using (mobile or desktop).
 *
 * @returns {string} 'mobile' if the user is on a mobile device, 'desktop' otherwise.
 */
function getDevice() {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Detects the user's browser name and version.
 *
 * @returns {Object} An object containing the browser name and version.
 * @returns {string} return.name The name of the browser (e.g., 'Chrome', 'Firefox', 'Safari', 'IE', 'Opera').
 * @returns {string} return.version The version of the browser.
 */
function getBrowser() {
  const ua = navigator.userAgent; let tem; let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return { name: 'IE', version: (tem[1] || '') };
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\bOPR|Edge\/(\d+)/);
    if (tem != null) { return { name: 'Opera', version: tem[1] }; }
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  // eslint-disable-next-line no-cond-assign
  if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
  return {
    name: M[0],
    version: M[1],
    majver: '',
  };
}

/**
 * Adds a hidden input element with the specified name and value to the given form.
 *
 * @param {HTMLFormElement} form - The form element to which the hidden input will be added.
 * @param {string} key - The name attribute for the hidden input element.
 * @param {string} value - The value attribute for the hidden input element.
 */
function updateFormElement(form, key, value) {
  const field = document.createElement('input');
  field.setAttribute('type', 'hidden');
  field.setAttribute('name', key);
  field.setAttribute('value', value);
  form.appendChild(field);
}

/**
 * aadharInit
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @param {object} globals - The global object containing necessary globals form data.
 * @return {PROMISE}
 */
async function aadharInit(mobileNumber, pan, dob, globals) {
  currentFormContext.VISIT_TYPE = 'AADHAR';
  const jsonObj = {
    requestString: {
      initParameters: {
        journeyId: currentFormContext.journeyID,
        transactionId: currentFormContext.journeyID.replace(/-/g, '').replace(/_/g, ''),
        journeyName: currentFormContext.journeyName,
        userAgent: window.navigator.userAgent,
        mobileNumber: mobileNumber.$value,
        leadProfileId: globals?.form.runtime.leadProifileId.$value,
        additionalParam1: '',
        additionalParam2: '',
        identifierValue: pan?.$value?.replace(/\s+/g, '') || dob.$value,
        identifierName: pan.$value ? 'PAN' : 'DOB',
      },
      auth: {
        journey_key: currentFormContext.journeyID,
        service_code: 'XX2571ER',
      },
      existingCustomer: currentFormContext?.journeyType === 'NTB' ? 'N' : 'Y',
      data_otp_gen: {
        UID_NO: '',
      },
      data_app: {
        journey_id: currentFormContext.journeyID,
        lead_profile_id: globals?.form.runtime.leadProifileId.$value,
        callback: urlPath(ENDPOINTS.aadhaarCallBack?.[currentFormContext.journeyName]),
        lead_profile: {
          leadProfileId: globals?.form.runtime.leadProifileId.$value,
          mobileNumber: mobileNumber.$value,
          Addresses: '',
        },
        journeyStateInfo: {
          state: 'CUSTOMER_AADHAR_VALIDATION',
          stateInfo: currentFormContext.journeyName,
          formData: santizedFormDataWithContext(globals, currentFormContext),
        },
        auditData: {
          action: 'CUSTOMER_AADHAR_VALIDATION',
          auditType: 'Regulatory',
        },
        filler1: 'filler1',
        filler2: 'filler2',
        filler3: 'filler3',
        filler4: 'filler4',
        filler5: 'filler5',
        filler6: 'filler6',
        filler7: 'filler7',
        filler8: 'filler8',
        filler9: 'filler9',
        filler10: 'filler10',
      },
      client_info: {
        browser: getBrowser(),
        cookie: {
          source: 'AdobeForms',
          name: 'NTBCC',
          ProductShortname: 'IS',
        },
        client_ip: '',
        device: {
          type: getDevice(),
          name: 'Samsung G5',
          os: getOS(),
          os_ver: '637.38383',
        },
        isp: {
          ip: '839.893.89.89',
          provider: 'AirTel',
          city: 'Mumbai',
          state: 'Maharashrta',
          pincode: '400828',
        },
        geo: {
          lat: '72.8777° E',
          long: '19.0760° N',
        },
      },
    },
  };

  let path = urlPath(ENDPOINTS.aadhaarInit?.[currentFormContext.journeyName]);
  const finalPayload = btoa(unescape(encodeURIComponent(JSON.stringify(jsonObj))));
  const decodedData = decodeURIComponent(escape(atob(finalPayload)));
  if (!isValidJson(decodedData)) {
    path = `https://hdfc-dev-04.adobecqms.net${ENDPOINTS.aadhaarInit?.[currentFormContext.journeyName]}`;
  }
  const response = fetchJsonResponse(path, jsonObj, 'POST');
  response
    .then((res) => {
      // var aadharValidationForm = "<form action=" + res.RedirectUrl + " method='post'></form>";
      const aadharValidationForm = document.createElement('form');
      aadharValidationForm.setAttribute('action', res.RedirectUrl);
      aadharValidationForm.setAttribute('method', 'POST');
      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (const key in res) {
        updateFormElement(aadharValidationForm, key, res[key]);
      }
      document.querySelector('body').append(aadharValidationForm);
      // aadharValidationForm.appendTo('body');
      aadharValidationForm.submit();
    }).catch((err) => console.error(err));
}

/**
 * Redirects the browser to the specified URL.
 *
 * @name redirect
 * @param {string} redirectUrl - The URL to redirect the browser to.
 */
function redirect(redirectUrl) {
  let urlLink = redirectUrl;
  if (redirectUrl === 'VKYCURL' && currentFormContext.VKYC_URL) {
    urlLink = currentFormContext.VKYC_URL;
    window.open(urlLink, '_blank');
  } else {
    window.location.href = urlLink;
  }
}

/**
 * Reloads the current page.
 * lead idParam is been strored in current formContext after otpGen btn click
 * @name reloadPage
 * @param {object} globals
 */
function reloadPage(globals) {
  const leadIdParam = globals.functions.exportData()?.currentFormContext?.leadIdParam || currentFormContext?.leadIdParam;
  const { origin, pathname } = window.location;
  const homeUrl = `${origin}${pathname}?leadId=${leadIdParam?.leadId}${(leadIdParam?.mode === 'dev') ? '&mode=dev' : ''} `;
  if (leadIdParam?.leadId) {
    window.location.href = homeUrl;
  } else {
    window.location.reload();
  }
}

const loadHomePage = (globals) => {
  const homePage = window.location.origin + window.location.pathname;
  const formUrl = globals.functions.exportData()?.formUrl;

  if (formUrl) {
    window.location.href = formUrl;
  } else {
    window.location.href = homePage;
  }
};

/**
 * set the value of idcom url in current form context
 * @name idcomUrlSet
 * @param {string} IdComUrl - idcomurl url parameter in string format.
 */

function idcomUrlSet(IdComUrl) {
  currentFormContext.ID_COM_URL = IdComUrl;
}

/**
 * @name idcomRedirection
 * redirect the idcomurl by taking the url got saved in current form context
 */
function idcomRedirection() {
  window.location.href = currentFormContext.ID_COM_URL;
}

/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */

function getFullName(firstname, lastname) {
  // eslint-disable-next-line no-param-reassign
  firstname = firstname == null ? '' : firstname;
  // eslint-disable-next-line no-param-reassign
  lastname = lastname == null ? '' : lastname;
  return firstname.concat(' ').concat(lastname);
}

/**
 * On Wizard Init.
 * @name onWizardInit Runs on initialization of wizard
 */
function onWizardInit() {
  createLabelInElement('.field-permanentaddresstoggle', 'permanent-address-toggle__label');
  decorateStepper();
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

const localJsonCompatibleTime = () => {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date - timezoneOffset).toISOString();
  return localISOTime;
};

export {
  hideLoaderGif,
  validatePan,
  panAPISuccesHandler,
  fetchAuthCode,
  aadharInit,
  redirect,
  reloadPage,
  idcomUrlSet,
  idcomRedirection,
  getFullName,
  onWizardInit,
  days,
  initRestAPIDataSecurityServiceES6,
  loadHomePage,
  localJsonCompatibleTime,
};
