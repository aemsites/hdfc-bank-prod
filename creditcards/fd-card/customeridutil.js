/* eslint-disable no-underscore-dangle */
import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';
import { FD_ENDPOINTS } from './constant.js';
import { fetchJsonResponseWithDelay, fetchRecursiveResponse } from '../../common/makeRestAPI.js';
import { dateFormat, urlPath } from '../../common/formutils.js';
import { invokeResumeJourneyApi } from './fd-resumejourney.js';

const SELECTED_CUSTOMER_ID = {};
let selectedCustIndex = -1;

const createPayload = (mobileNumber, panNumber, dob, jwtToken) => {
  const payload = {
    requestString: {
      mobileNumber,
      dateOfBirth: dob ? dateFormat(dob, 'YYYYMMDD') : '',
      panNumber: panNumber ? panNumber?.replace(/\s+/g, '')?.toUpperCase() : '',
      journeyID: CURRENT_FORM_CONTEXT.journeyID,
      journeyName: CURRENT_FORM_CONTEXT.journeyName,
      jwtToken,
    },
  };
  return payload;
};

/**
 * Fetches the customer ID
 *
 * @param {string} mobileNumber
 * @param {string} pan
 * @param {string} dob
 * @param {object} response
 * @param {Object} globals
 * @returns {Promise<Object>} A promise that resolves to the JSON response of the customer account details.
 */
const fetchCustomerId = (mobileNumber, pan, dob, response, globals) => {
  const dateOfBirth = globals?.form?.loginMainPanel?.loginPanel?.identifierPanel?.dateOfBirth?._data?.$_value || '';
  const payload = createPayload(mobileNumber, pan, dateOfBirth, response?.jwtToken);
  payload.requestString.referenceNumber = response.referenceNo;
  const apiEndPoint = urlPath(FD_ENDPOINTS.hdfccardsgetfdeligibilitystatus);
  const duration = 50;
  const timer = 10;
  const fieldName = ['fdEligibilityStatusResponse', 'status'];
  return fetchRecursiveResponse('customerId', apiEndPoint, payload, 'POST', duration, timer, fieldName, true);
};

/**
 *
 * @name fetchReferenceId
 * @param {string} mobileNumber
 * @param {string} pan
 * @param {string} dob
 * @param {string} jwtToken
 * @returns {Promise<Object>}
 */
const fetchReferenceId = (mobileNumber, pan, dob, jwtToken, globals) => {
  const dateOfBirth = globals?.form?.loginMainPanel?.loginPanel?.identifierPanel?.dateOfBirth?._data?.$_value || '';
  const payload = createPayload(mobileNumber, pan, dateOfBirth, jwtToken);
  return fetchJsonResponseWithDelay(urlPath(FD_ENDPOINTS.hdfccardsgetrefidfdcc), payload, 'POST', 1000, false);
};

const updateData = (globals, customerData, panel) => {
  globals.functions.setProperty(panel.maskedAccNo, { value: customerData.customerID.slice(-4).padStart(customerData.customerID.length, 'X') });
  globals.functions.setProperty(panel.customerID, { value: customerData.customerID });
  globals.functions.setProperty(panel.noofFDs, { value: customerData.eligibleFDCount });
};

/**
 *
 * @name customerIdSuccessHandler
 * @param {Object} payload
 * @param {Object} globals
 */
const customerIdSuccessHandler = (payload, globals) => {
  const customerData = payload?.responseString?.customerDetailsDTO;
  if (!customerData?.length) return;
  CURRENT_FORM_CONTEXT.customerInfo = payload?.responseString;
  if (customerData?.length === 1) {
    const [selectedCustId] = customerData;
    SELECTED_CUSTOMER_ID.selectedCustId = selectedCustId;
  } else {
    const panel = globals.form.multipleCustIDPanel.multipleCustIDSelectionPanel.multipleCustIDRepeatable;

    customerData.forEach((custItem, i) => {
      if (i < customerData.length - 1) {
        globals.functions.dispatchEvent(panel, 'addItem');
      }
      setTimeout(() => {
        updateData(globals, custItem, panel[i]);
      }, i * 40);
    });
  }
  invokeResumeJourneyApi(globals);
};

/**
 * Handles on select of customer ID radio button.
 * @name customerIdClickHandler
 * @param {Object} customerIds
 * @param {Object} globals
 */
const customerIdClickHandler = (customerIds, globals) => {
  const { mutipleCustIDProcced } = globals.form.multipleCustIDPanel.multipleCustIDSelectionPanel;
  globals.functions.setProperty(mutipleCustIDProcced, { enabled: true });
  if (selectedCustIndex !== -1) {
    globals.functions.setProperty(customerIds[selectedCustIndex].multipleCustIDSelect, { value: undefined });
    setTimeout(() => {
      selectedCustIndex = customerIds.findIndex((item) => item.multipleCustIDSelect._data.$value === '0');
      const selectedCustId = customerIds[selectedCustIndex].customerID._data.$_value;
      SELECTED_CUSTOMER_ID.selectedCustId = CURRENT_FORM_CONTEXT.customerInfo.customerDetailsDTO.filter((item) => item.customerID === selectedCustId)?.[0];
    }, 50);
  } else {
    selectedCustIndex = customerIds.findIndex((item) => item.multipleCustIDSelect._data.$value === '0');
    const selectedCustId = customerIds[selectedCustIndex].customerID._data.$_value;
    SELECTED_CUSTOMER_ID.selectedCustId = CURRENT_FORM_CONTEXT.customerInfo.customerDetailsDTO.filter((item) => item.customerID === selectedCustId)?.[0];
  }
};

export {
  fetchCustomerId,
  customerIdSuccessHandler,
  customerIdClickHandler,
  SELECTED_CUSTOMER_ID,
  fetchReferenceId,
};
