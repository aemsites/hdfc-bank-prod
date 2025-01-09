import { CHANNEL, ENDPOINTS } from '../../common/constants.js';
import { santizedFormDataWithContext, urlPath } from '../../common/formutils.js';
import { localJsonCompatibleTime } from '../../common/functions.js';
import { fetchJsonResponse } from '../../common/makeRestAPI.js';

/**
 * @name invokeJourneyDropOff to log on success and error call backs of api calls
 * @param {state} state
 * @param {string} mobileNumber
 * @param {string} journeyName
 * @param {Object} globals - globals variables object containing form configurations.
 * @return {PROMISE}
 */

// Can be used from common if mobile and journey name passed from the form
// this change needs to be done in future
const invokeJourneyDropOff = async (state, mobileNumber, journeyName, globals) => {
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      leadProfile: {
        mobileNumber,
      },
      formData: {
        channel: CHANNEL,
        journeyName,
        journeyID: globals.form.runtime.journeyId.$value,
        journeyStateInfo: [
          {
            state,
            stateInfo: JSON.stringify(santizedFormDataWithContext(globals)),
            timeinfo: localJsonCompatibleTime(),
          },
        ],
      },
    },
  };
  const url = urlPath(ENDPOINTS.journeyDropOff);
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
  * @name invokeJourneyDropOffByParam
  * @param {string} mobileNumber
  * @param {string} leadProfileId
  * @param {string} journeyId
  * @return {PROMISE}
  */
const invokeJourneyDropOffByParam = async (mobileNumber, leadProfileId, journeyID) => {
  const journeyJSONObj = {
    RequestPayload: {
      leadProfile: {
        mobileNumber,
      },
      journeyInfo: {
        journeyID,
      },
    },
  };
  const url = urlPath(ENDPOINTS.journeyDropOffParam);
  const method = 'POST';
  return fetchJsonResponse(url, journeyJSONObj, method);
};

const invokeJourneyDropOffByJourneyId = async (journeyID) => {
  const journeyJSONObj = {
    RequestPayload: {
      leadProfile: {
      },
      journeyInfo: {
        journeyID,
      },
    },
  };
  const url = urlPath(ENDPOINTS.journeyDropOffParam);
  const method = 'POST';
  return fetchJsonResponse(url, journeyJSONObj, method);
};
export {
  invokeJourneyDropOff,
  journeyResponseHandlerUtil,
  invokeJourneyDropOffByParam,
  invokeJourneyDropOffByJourneyId,
};
