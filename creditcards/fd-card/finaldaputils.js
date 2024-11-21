import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';
import {
  fetchFiller3, fetchFiller4, getCurrentDateAndTime, urlPath,
} from '../../common/formutils.js';
import { restAPICall } from '../../common/makeRestAPI.js';
import { invokeJourneyDropOffUpdate } from '../corporate-creditcard/journey-utils.js';
import { FD_ENDPOINTS } from './constant.js';
import { finalPagePanelVisibility } from './thankyouutil.js';
import creditCardSummary from './creditcardsumaryutil.js';

const fdFiller4 = (userRedirected, mobileMatch = '', selectedKyc = '') => {
  let filler4 = '';
  if (!userRedirected && !CURRENT_FORM_CONTEXT.aadhaarFailed) {
    filler4 = 'bioInperson';
  } else {
    filler4 = fetchFiller4(
      mobileMatch,
      selectedKyc,
      'ETB',
    );
  }
  return filler4 === null ? '' : filler4;
};

/**
 * Creates a DAP request object based on the provided global data.
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @returns {Object} - The DAP request object.
 */
const createDapRequestObj = (userRedirected, globals) => {
  const formData = globals.functions.exportData() || {};
  const formContextCallbackData = globals.functions.exportData()?.currentFormContext || CURRENT_FORM_CONTEXT;
  const aadhaarData = formData.aadhaar_otp_val_data?.result || {};
  const aadhaarMobileMatch = formData?.aadhaar_otp_val_data?.result?.mobileValid === 'y';
  const selectedKyc = CURRENT_FORM_CONTEXT.aadhaarFailed ? CURRENT_FORM_CONTEXT?.selectedKyc : formContextCallbackData?.selectedKyc;
  let ekycSuccess = (!aadhaarMobileMatch && aadhaarData.ADVRefrenceKey !== undefined && selectedKyc === 'aadhaar')
    ? `${aadhaarData?.ADVRefrenceKey}X${aadhaarData?.RRN}`
    : '';
  let VKYCConsent = fetchFiller4(
    aadhaarMobileMatch,
    selectedKyc,
    'ETB',
  );
  let ekycConsent = selectedKyc === 'aadhaar' ? `${getCurrentDateAndTime(3)}YEnglishxeng1x0` : '';
  let filler4 = fdFiller4(userRedirected, aadhaarMobileMatch, selectedKyc);
  if (globals.functions.exportData()?.queryParams?.visitType === 'EKYC_AUTH_FAILED') {
    VKYCConsent = '';
    ekycSuccess = '';
    ekycConsent = '';
    if (selectedKyc === 'bioinperson') {
      filler4 = selectedKyc;
    }
  }
  const filler8 = selectedKyc === 'biokyc' || selectedKyc === 'bioinperson' ? '' : 'IDCOMSUCCESS';
  const filler3 = fetchFiller3(formData?.queryParams?.authmode, formData?.queryParams?.success);
  return {
    requestString: {
      applRefNumber: formContextCallbackData?.executeInterfaceResponse?.APS_APPL_REF_NUM,
      eRefNumber: formContextCallbackData?.executeInterfaceResponse?.APS_E_REF_NUM,
      customerId: formContextCallbackData?.executeInterfaceRequest?.requestString?.customerID,
      communicationCity: formContextCallbackData?.executeInterfaceRequest?.requestString?.communicationCity,
      motherFirstName: '',
      motherMiddleName: '',
      motherLastName: '',
      ckycNumber: '',
      motherNameTitle: '',
      mobileNumber: globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber.$value,
      journeyID: formContextCallbackData?.journeyID || CURRENT_FORM_CONTEXT?.journeyID,
      journeyName: formContextCallbackData?.journeyName || CURRENT_FORM_CONTEXT?.journeyName,
      filler2: ekycSuccess,
      filler7: '',
      filler1: '',
      filler3,
      filler4,
      filler8,
      biometricStatus: selectedKyc || '',
      ekycConsent,
      ekycSuccess,
      VKYCConsent,
    },
  };
};

const finalDap = (userRedirected, globals) => {
  const { resultPanel, fdBasedCreditCardWizard } = globals.form;

  const apiEndPoint = urlPath(FD_ENDPOINTS.hdfccardsexecutefinaldap);
  const formData = globals.functions.exportData();
  const payload = createDapRequestObj(userRedirected, globals);
  if (globals?.functions?.exportData()?.queryParams?.success === 'false') {
    payload.requestString.filler8 = 'IDCOMFAIL';
    payload.requestString.filler4 = 'bioKYC';
    payload.requestString.VKYCConsent = '';
  }
  const mobileNumber = formData?.form?.login?.registeredMobileNumber || globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber.$value;
  const leadProfileId = formData?.leadProifileId || globals?.form?.runtime?.leadProifileId.$value;
  const { journeyId } = formData;
  const eventHandlers = {
    successCallBack: async (response) => {
      if (response?.ExecuteFinalDAPResponse?.APS_ERROR_CODE === '0000') {
        CURRENT_FORM_CONTEXT.finalDapRequest = JSON.parse(JSON.stringify(payload));
        CURRENT_FORM_CONTEXT.finalDapResponse = response?.ExecuteFinalDAPResponse;
        CURRENT_FORM_CONTEXT.VKYC_URL = response?.ExecuteFinalDAPResponse?.vkycUrl;
        CURRENT_FORM_CONTEXT.ARN_NUM = response?.ExecuteFinalDAPResponse?.APS_APPL_REF_NUM;
        CURRENT_FORM_CONTEXT.action = 'confirmation';
        await Promise.resolve(invokeJourneyDropOffUpdate('CUSTOMER_FINAL_DAP_SUCCESS', mobileNumber, leadProfileId, journeyId, globals));
        if (!userRedirected) {
          finalPagePanelVisibility('success', CURRENT_FORM_CONTEXT.ARN_NUM, globals);
          creditCardSummary(globals);
        }
      } else {
        invokeJourneyDropOffUpdate('CUSTOMER_FINAL_DAP_FAILURE', mobileNumber, leadProfileId, journeyId, globals);
        if (!userRedirected) {
          finalPagePanelVisibility('error', '', globals);
        }
      }
    },
    errorCallback: (response, globalObj) => {
      globalObj.functions.setProperty(fdBasedCreditCardWizard, { visible: false });
      globalObj.functions.setProperty(resultPanel, { visible: true });
      globalObj.functions.setProperty(resultPanel.errorResultPanel, { visible: true });
      invokeJourneyDropOffUpdate('CUSTOMER_FINAL_DAP_FAILURE', mobileNumber, leadProfileId, journeyId, globalObj);
    },
  };
  restAPICall(globals, 'POST', payload, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallback);
};
export default finalDap;
