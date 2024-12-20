/* eslint no-bitwise: ["error", { "allow": ["^", ">>", "&"] }] */

import {
  santizedFormDataWithContext,
  urlPath,
  generateUUID,
} from '../../common/formutils.js';
import {
  fetchJsonResponse,
  displayLoader,
} from '../../common/makeRestAPI.js';
import * as NRE_CONSTANT from './constant.js';
import * as CONSTANT from '../../common/constants.js';

const { ENDPOINTS, CURRENT_FORM_CONTEXT: currentFormContext } = CONSTANT;
const { CHANNEL, JOURNEY_NAME, VISIT_MODE } = NRE_CONSTANT;

/**
     * generates the journeyId
     * @param {string} visitMode - The visit mode (e.g., "online", "offline").
     * @param {string} journeyAbbreviation - The abbreviation for the journey.
     * @param {string} channel - The channel through which the journey is initiated.
     * @param {object} globals
     */
function createJourneyId(visitMode, journeyAbbreviation, channel, globals) {
  const dynamicUUID = generateUUID();
  // var dispInstance = getDispatcherInstance();
  const journeyId = globals.functions.exportData().journeyId || `${dynamicUUID}_01_${journeyAbbreviation}_${visitMode}_${channel}`;
  globals.functions.setProperty(globals.form.runtime.journeyId, { value: journeyId });
  return journeyId;
}

const getCurrentContext = () => currentFormContext;

/**
     * @name invokeJourneyDropOff to log on success and error call backs of api calls
     * @param {state} state
     * @param {string} mobileNumber
     * @param {Object} globals - globals variables object containing form configurations.
     * @return {PROMISE}
     */
const invokeJourneyDropOff = async (state, mobileNumber, globals) => {
  const isdCode = (globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.countryCode.$value)?.replace(/[^a-zA-Z0-9]+/g, '');
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      leadProfile: {
        mobileNumber: isdCode + mobileNumber,
        isCountryCodeappended: 'true',
        countryCode: isdCode,
      },
      formData: {
        channel: CHANNEL,
        journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
        journeyID: globals.form.runtime.journeyId.$value || createJourneyId(VISIT_MODE, JOURNEY_NAME, CHANNEL, globals),
        journeyStateInfo: [
          {
            state,
            stateInfo: JSON.stringify(santizedFormDataWithContext(globals)),
            timeinfo: new Date().toISOString(),
          },
        ],
      },
    },
  };
  const url = urlPath(ENDPOINTS.journeyDropOff);
  const method = 'POST';
  // return globals.functions.exportData().queryParams.leadId ? fetchJsonResponse(url, journeyJSONObj, method) : null;
  return journeyJSONObj.RequestPayload.formData.journeyID ? fetchJsonResponse(url, journeyJSONObj, method) : null;
};

/**
     * @name invokeJourneyDropOffUpdate
     * @param {string} state
     * @param {string} mobileNumber
     * @param {string} leadProfileId
     * @param {string} journeyId
     * @param {Object} globals - globals variables object containing form configurations.
     * @return {PROMISE}
     */
const invokeJourneyDropOffUpdate = async (state, mobileNumber, leadProfileId, journeyId, globals) => {
  const isdCode = (globals.form.parentLandingPagePanel.landingPanel.loginFragmentNreNro.mobilePanel.countryCode.$value)?.replace(/[^a-zA-Z0-9]+/g, '');
  const sanitizedFormData = santizedFormDataWithContext(globals, currentFormContext);
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : '',
      leadProfile: {
        mobileNumber: isdCode + mobileNumber,
        isCountryCodeappended: 'true',
        leadProfileId: leadProfileId?.toString(),
        countryCode: isdCode,
      },
      formData: {
        channel: CHANNEL,
        journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
        journeyID: journeyId,
        journeyStateInfo: [
          {
            state,
            stateInfo: JSON.stringify(sanitizedFormData),
            timeinfo: new Date().toISOString(),
          },
        ],
      },
    },
  };
  // sendSubmitClickEvent(mobileNumber, linkName, sanitizedFormData);
  const url = urlPath(ENDPOINTS.journeyDropOffUpdate);
  const method = 'POST';
  return fetchJsonResponse(url, journeyJSONObj, method);
};

/**
     * @name printPayload
     * @param {string} payload.
     * @param {object} formContext.
     * @returns {object} currentFormContext.
     */
function journeyResponseHandlerUtil(payload, formContext) {
  formContext.leadProfile = {};
  formContext.leadProfile.leadProfileId = String(payload);
  return formContext;
}

/**
    * @name nreNroInvokeJourneyDropOffByParam
    * @param {string} mobileNumber
    * @param {string} leadProfileId
    * @param {string} journeyId
    * @return {PROMISE}
    */
// eslint-disable-next-line
const nreNroInvokeJourneyDropOffByParam = async (mobileNumber, leadProfileId, journeyID, globals) => {
  const journeyJSONObj = {
    RequestPayload: {
      leadProfile: {
      },
      journeyInfo: {
        journeyID: currentFormContext.journeyId,
      },
    },
  };
  const url = urlPath(ENDPOINTS.journeyDropOffParam);
  const method = 'POST';
  if (typeof window !== 'undefined') {
    displayLoader();
  }
  return fetchJsonResponse(url, journeyJSONObj, method);
};

/**
 * @name postIdCommRedirect - functionality after IDCOMM redirect
 * @param {String} mobileNumber
 * @param {String} leadProfileId
 * @param {String} journeyID
 * @param {Object} globals
 * @returns {Promise}
 */
const postIdCommRedirect = async (globals) => {
  const journeyJSONObj = {
    RequestPayload: {
      leadProfile: {
      },
      journeyInfo: {
        journeyID: currentFormContext.journeyId,
      },
    },
  };
  const url = urlPath(ENDPOINTS.journeyDropOffParam);
  const method = 'POST';
  const dropOffPromise = fetchJsonResponse(url, journeyJSONObj, method);
  dropOffPromise.then((response) => {
    if (response && response.errorCode === 'FJ0000') {
      globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.page_to_show_variable, { value: 'thankYouPage' });
      globals.functions.setProperty(globals.form.parentLandingPagePanel, { visible: false });
    }
  }).catch((error) => {
    console.log(error);
  });
};

export {
  invokeJourneyDropOff,
  invokeJourneyDropOffUpdate,
  getCurrentContext,
  createJourneyId,
  journeyResponseHandlerUtil,
  nreNroInvokeJourneyDropOffByParam,
  postIdCommRedirect,
};
