import { fetchJsonResponse } from './makeRestAPI.js';
import {
  urlPath,
  convertDateToDdMmYyyy,
} from './formutils.js';
import {
  ENDPOINTS as endpoints,
  DEAD_PAN_STATUS as deadPanStatus,
  CURRENT_FORM_CONTEXT as currentFormContext,
  FORM_RUNTIME as formRuntime,
} from './constants.js';

/**
 * validatePan - creates PAN validation request and executes API.
 * @param {string} mobileNumber
 * @param {string} panNumber
 * @param {object} dob
 * @param {string} firstName
 * @param {boolean} showLoader
 * @param {boolean} hideLoader
 * @returns {Promise} - pan validation response
 */
const validatePan = (mobileNumber, panNumber, dob, firstName, showLoader, hideLoader) => {
  const validatePanRequest = {
    journeyName: currentFormContext.journeyName,
    journeyID: currentFormContext.journeyID,
    mobileNumber,
    panInfo: {
      panNumber: panNumber.replace(/\s+/g, ''),
      panType: 'P',
      dob: convertDateToDdMmYyyy(new Date(dob)),
      name: firstName ? firstName.split(' ')[0] : '',
    },
  };
  if (showLoader) formRuntime?.validatePanLoader();
  const apiEndPoint = urlPath(endpoints.panValNameMatch);
  return fetchJsonResponse(apiEndPoint, validatePanRequest, 'POST', hideLoader);
};

/**
 * validatePan - creates PAN validation request and executes API.
 * @param {string} mobileNumber
 * @param {string} panNumber
 * @param {object} dob
 * @param {string} firstName
 * @param {boolean} showLoader
 * @param {boolean} hideLoader
 * @returns {Promise} - pan validation response
 */
const fullNamePanValidation = (mobileNumber, panNumber, dob, name, showLoader, hideLoader) => {
  const validatePanRequest = {
    journeyName: currentFormContext.journeyName,
    journeyID: currentFormContext.journeyID,
    mobileNumber,
    panInfo: {
      panNumber: panNumber.replace(/\s+/g, ''),
      panType: 'P',
      dob: convertDateToDdMmYyyy(new Date(dob)),
      name,
    },
  };
  if (showLoader) formRuntime?.validatePanLoader();
  const apiEndPoint = urlPath(endpoints.panValNameMatch);
  return fetchJsonResponse(apiEndPoint, validatePanRequest, 'POST', hideLoader);
};

/**
* panAPISuccesHandler
* @param {string} panStatus
* @returns {Promise} panResponse
*/
function panAPISuccesHandler(panStatus) {
  let panSuccess = false;
  const journeyType = currentFormContext?.journeyType;
  if (panStatus === 'E') {
    panSuccess = true;
  } else if (journeyType === 'ETB' && !deadPanStatus.includes(panStatus)) {
    panSuccess = true;
  }

  const returnObj = {
    panSuccess,
  };
  return returnObj;
}

export {
  validatePan,
  panAPISuccesHandler,
  fullNamePanValidation,
};
