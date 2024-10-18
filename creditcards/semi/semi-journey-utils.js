import { santizedFormDataWithContext, urlPath } from '../../common/formutils.js';
import * as CONSTANT from './constant.js';
import { ENDPOINTS } from '../../common/constants.js';
import { fetchJsonResponse } from '../../common/makeRestAPI.js';

/* temproraily added this journey utils for SEMI , journey utils common file has to be changed to generic */
const CHANNEL = 'ADOBE_WEBFORMS';

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
} = CONSTANT;
/**
   * @name invokeJourneyDropOff to log on success and error call backs of api calls
   * @param {state} state
   * @param {string} mobileNumber
   * @param {Object} globals - globals variables object containing form configurations.
   * @return {PROMISE}
   */
const invokeJourneyDropOff = async (state, mobileNumber, globals) => {
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      leadProfile: {
        mobileNumber,
      },
      formData: {
        channel: CHANNEL,
        journeyName: globals.form.runtime.journeyName.$value,
        journeyID: globals.form.runtime.journeyId.$value,
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
  return fetchJsonResponse(url, journeyJSONObj, method);
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
  const sanitizedFormData = santizedFormDataWithContext(globals, currentFormContext);
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : '',
      leadProfile: {
        mobileNumber,
        leadProfileId: leadProfileId?.toString(),
      },
      formData: {
        channel: CHANNEL,
        journeyName: globals.form.runtime.journeyName.$value,
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
  const url = urlPath(ENDPOINTS.journeyDropOffUpdate);
  const method = 'POST';
  return fetchJsonResponse(url, journeyJSONObj, method);
};

export {
  invokeJourneyDropOff,
  invokeJourneyDropOffUpdate,
};
