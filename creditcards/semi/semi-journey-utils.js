import { santizedFormDataWithContext } from '../../common/formutils.js';
import * as CONSTANT from './constant.js';
import { ENDPOINTS } from '../../common/constants.js';
import { fetchJsonResponse } from '../../common/makeRestAPI.js';

/* temproraily added this journey utils for SEMI , journey utils common file has to be changed to generic */
const CHANNEL = 'ADOBE_WEBFORMS';
const isNodeEnv = typeof process !== 'undefined' && process.versions && process.versions.node;

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
} = CONSTANT;

const BASEURL = 'https://applyonline.hdfcbank.com';
const urlPath = (path) => `${BASEURL}${path}`;

/* Restructures sanitizedFormData adding URL parameters and missing properties for the journey state:CUSTOMER_ONBOARDING_COMPLETE
 *
 * @param {Object} data - The original form data to be restructured.
 * @param {Object} formContextObject - Contains current form context-specific parameters, such as UTM tracking values.
 * @param {Object} globals - Global object.
 * @returns {Object} The restructured form data with additional fields for URL parameters, channel, and audit data.
 */
const restructFormData = (data, formContextObject, globals) => {
  const formData = structuredClone(data);
  const utmParams = formContextObject?.UTM_PARAMS;
  const utmChannel = globals.form.aem_semiWizard.aem_selectTenure.aem_employeeAssistancePanel.aem_channel.$value || formContextObject?.UTM_PARAMS?.channel;
  const allURLParams = {
    LGCODE: (formData?.smartemi?.LGTSECode || formData?.smartemi?.BranchEmployeeTseLGCode || utmParams?.lgcode) ?? '',
    DSACODE: (formData?.smartemi?.DSACode || utmParams?.dsacode) ?? '',
    utm_campaign: utmParams?.utm_campaign ?? '',
    utm_medium: utmParams?.utm_medium ?? '',
    ICID: utmParams?.icid ?? '',
    utmTerm: utmParams?.term ?? '',
    utm_term: utmParams?.term ?? '',
    utm_creative: utmParams?.utm_creative ?? '',
    utm_content: utmParams?.utm_content ?? '',
    utm_source: utmParams?.utm_source ?? '',
    BRANCHCODE: (formData?.smartemi?.BranchCode || utmParams?.branchcode) ?? '',
  };
  formData.allURLParams = allURLParams ?? '';
  formData.channel = utmChannel ?? '';
  formData.DSAName = formData?.smartemi?.DSAName ?? '';
  formData.BranchName = formData?.smartemi?.BranchName ?? '';
  formData.BranchCity = formData?.smartemi?.BranchCity ?? '';
  formData.CardBDRLC1Code = (formData?.smartemi?.LC1Code || utmParams?.lc1) ?? '';
  formData.NetAmountPayable = formData?.smartemi.SmartEMIAmt ?? '';
  const auditData = {
    params: {
      utm_source: allURLParams?.utm_source,
      utm_content: allURLParams?.utm_content,
      utm_campaign: allURLParams?.utm_campaign,
      utm_medium: allURLParams?.utm_medium,
    },
    // clientIPAddress: '',
  };
  formData.auditData = auditData;
  const formSmartEmiData = structuredClone(formData?.smartemi);
  formSmartEmiData.LC1Code = (formSmartEmiData.LC1Code || utmParams?.lc1) ?? '';
  formSmartEmiData.LC2Code = (formSmartEmiData.LC1Code || utmParams?.lc2) ?? '';
  formSmartEmiData.SMCode = (formSmartEmiData.SMCode || utmParams?.smcode) ?? '';
  formSmartEmiData.LGTSECode = allURLParams?.LGCODE ?? '';
  formData.smartemi = formSmartEmiData;
  return formData;
};

/**
 * For Web returing currentFormContext as defined in variable
 * Ideally every custom function should be pure function, i.e it should not have any side effect
 * As per current implementation `currentFormContext` is a state outside of the function,
 * so for Flow we have did special handling by storing strigified value in `globals.form.runtime.currentFormContext`
 *
 * @param {scope} globals
 * @returns
 */
const getCurrentFormContext = (globals) => {
  if (isNodeEnv) {
    return JSON.parse(globals.form.runtime.currentFormContext.$value || '{}');
  }
  return currentFormContext;
};

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
  const formContext = getCurrentFormContext(globals);
  if (state === 'CUSTOMER_ONBOARDING_COMPLETE') {
    formContext.LoanReferenceNumber = journeyId?.loanNbr;
  }
  const sanitizedFormData = santizedFormDataWithContext(globals, formContext);
  const formDataSanitized = (state === 'CUSTOMER_ONBOARDING_COMPLETE' || state === 'CUSTOMER_ONBOARDING_FAILED') ? restructFormData(sanitizedFormData, formContext, globals) : sanitizedFormData;
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
        journeyID: globals.form.runtime.journeyId.$value,
        journeyStateInfo: [
          {
            state,
            stateInfo: JSON.stringify(formDataSanitized),
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
        ...(mobileNumber?.trim()?.length < 10 ? {} : { mobileNumber: mobileNumber?.trim() }),
      },
      journeyInfo: {
        journeyID,
      },
    },
  };

  const url = urlPath('/content/hdfc_commonforms/api/whatsappdata.json');
  const method = 'POST';
  return fetchJsonResponse(url, journeyJSONObj, method);
};

export {
  invokeJourneyDropOff,
  invokeJourneyDropOffUpdate,
  invokeJourneyDropOffByParam,
};
