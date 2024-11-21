import { CURRENT_FORM_CONTEXT, ENDPOINTS } from '../../common/constants.js';
import { urlPath } from '../../common/formutils.js';
import { fetchJsonResponse } from '../../common/makeRestAPI.js';
import { IDCOM } from './constant.js';

/**
 * Creates an IdCom request object based on the provided global data.
 * @param {Object} globals - The global object containing necessary data for IdCom request.
 * @returns {Object} - The IdCom request object.
 */
const createIdComRequestObj = (globals) => {
  const {
    personalDetails,
  } = globals.form.fdBasedCreditCardWizard.basicDetails.reviewDetailsView;
  const addressChanged = globals.functions.exportData()?.currentFormContext?.executeInterfaceRequest?.requestString?.addressEditFlag || CURRENT_FORM_CONTEXT?.executeInterfaceRequest?.requestString?.addressEditFlag || '';
  const scope = addressChanged === 'Y' ? IDCOM.scope.addressChanged : IDCOM.scope.addressNotChanged;
  const idComObj = {
    requestString: {
      mobileNumber: `${globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber._data.$_value}`,
      ProductCode: IDCOM.productCode,
      PANNo: personalDetails.panNumberPersonalDetails._data.$_value.replace(/\s+/g, ''),
      userAgent: navigator.userAgent,
      journeyID: CURRENT_FORM_CONTEXT?.journeyID || globals.functions.exportData()?.currentFormContext?.journeyID,
      journeyName: CURRENT_FORM_CONTEXT.journeyName,
      scope,
    },
  };
  return idComObj;
};

/**
 * Fetches an authentication code from the API.
 *
 * This function creates an idcomm request object, constructs the API endpoint URL,
 * and then sends a POST request to the endpoint to fetch the authentication code.
 * @name idcomm
 * @params {object} globals
 * @returns {Promise<Object>} A promise that resolves to the JSON response from the API.
 */
const idcomm = async (globals) => {
  if (CURRENT_FORM_CONTEXT.executeInterfaceRequest === undefined) {
    Object.assign(CURRENT_FORM_CONTEXT, JSON.parse(globals?.functions?.exportData()?.formContext));
  }
  const idComRequest = createIdComRequestObj(globals);
  CURRENT_FORM_CONTEXT.idComRequest = idComRequest;
  const apiEndPoint = urlPath(ENDPOINTS.fetchAuthCode);
  return fetchJsonResponse(apiEndPoint, idComRequest, 'POST');
};

const idcomSuccessHandler = async (authCode, redirectUrl) => new Promise((resolve) => {
  setTimeout(() => {
    CURRENT_FORM_CONTEXT.authCode = authCode;
    CURRENT_FORM_CONTEXT.ID_COM_URL = redirectUrl;
    resolve({ success: 'true' });
  }, 100);
});

const idcomRetry = (globals) => {
  const idComRequest = createIdComRequestObj(globals);
  const apiEndPoint = urlPath(ENDPOINTS.fetchAuthCode);
  return fetchJsonResponse(apiEndPoint, idComRequest, 'POST');
};

export {
  idcomm,
  idcomSuccessHandler,
  idcomRetry,
};
