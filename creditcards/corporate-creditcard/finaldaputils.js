import { ENDPOINTS, CURRENT_FORM_CONTEXT as currentFormContext } from '../../common/constants.js';
import { santizedFormDataWithContext, urlPath } from '../../common/formutils.js';
import { invokeJourneyDropOffUpdate } from './journey-utils.js';
import { restAPICall } from '../../common/makeRestAPI.js';
import { sendPageloadEvent } from './analytics.js';

const getCurrentDateAndTime = (dobFormatNo) => {
  /*
      dobFormatNo: 1 (DD-MM-YYYY HH:MM:SS)
      dobFormatNo: 2 (YYYYMMDDHHMMSS)
      dobFormatNo: 3 (DDMMYYYYHHMMSS)
  */
  const newDate = new Date();
  const year = newDate.getFullYear();
  const month = newDate.getMonth() + 1;
  const todaySDate = newDate.getDate();
  const hours = newDate.getHours();
  const minutes = newDate.getMinutes();
  const seconds = newDate.getSeconds();
  let formatedTime = '';
  switch (dobFormatNo) {
    case 1:
      formatedTime = `${todaySDate}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      break;
    case 2:
      formatedTime = `${year}${month}${todaySDate}${hours}${minutes}${seconds}`;
      break;
    case 3:
      formatedTime = `${todaySDate}${month}${year.toString().substring(2, 4)}${hours}${minutes}${seconds}`;
      break;
    default:
      formatedTime = '';
  }
  return formatedTime;
};

const fetchFiller4 = (mobileMatch, kycStatus, journeyType, kycFillers) => {
  let filler4Value = null;
  if (kycFillers === null) {
    filler4Value = `NVKYC${getCurrentDateAndTime(3)}`;
  } else {
    switch (kycStatus) {
      case 'aadhaar':
        // eslint-disable-next-line no-nested-ternary
         if (journeyType === 'NTB') {
          filler4Value = `VKYC${getCurrentDateAndTime(3)}`;
        }
        if (journeyType === 'ETB') {
          filler4Value = (mobileMatch === 'y') ? `NVKYC${getCurrentDateAndTime(3)}` : `VKYC${getCurrentDateAndTime(3)}`;
        }
        //filler4Value = `${(mobileMatch === 'y') ? 'NVKYC' : 'VKYC'}${getCurrentDateAndTime(3)}`;

        break;
      case 'bioKYC':
        filler4Value = 'bioKYC';
        break;
      case 'OVD':
        filler4Value = 'OVD';
        break;
      default:
        filler4Value = null;
    }
  }
  return filler4Value;
};

const kycFillCheck = (customerInfo, kycFill) => {
  let kycFillerVal;
  if ((customerInfo.journeyFlag === 'ETB')) {
    kycFillerVal = (customerInfo.addressEditFlag === 'Y') ? kycFill.KYC_STATUS : null;
  }
  if ((customerInfo.journeyFlag === 'NTB')) {
    kycFillerVal = kycFill.KYC_STATUS;
  }
  return kycFillerVal;
};
/**
 * Creates a DAP request object based on the provided global data.
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @returns {Object} - The DAP request object.
 */
const createDapRequestObj = (globals) => {
  const formContextCallbackData = globals.functions.exportData()?.currentFormContext || currentFormContext;
  const segment = formContextCallbackData?.breDemogResponse?.SEGMENT || currentFormContext;
  const customerInfo = currentFormContext?.executeInterfaceReqObj?.requestString || formContextCallbackData?.executeInterfaceReqObj?.requestString;
  // const { prefilledEmploymentDetails } = employmentDetails;
  const { selectKYCMethodOption1: { aadharEKYCVerification }, selectKYCMethodOption2: { aadharBiometricVerification }, selectKYCMethodOption3: { officiallyValidDocumentsMethod } } = globals.form.corporateCardWizardView.selectKycPanel.selectKYCOptionsPanel;
  const formData = globals.functions.exportData();
  const radioBtnValues = globals.functions.exportData()?.currentFormContext?.radioBtnValues;
  const kycFill = {
    KYC_STATUS:
        ((aadharEKYCVerification.$value || formData?.form?.aadharEKYCVerification || radioBtnValues?.kycMethod?.aadharEKYCVerification) && 'aadhaar')
        || ((aadharBiometricVerification.$value || formData?.form?.aadharBiometricVerification || radioBtnValues?.kycMethod?.aadharBiometricVerification) && 'bioKYC')
        || ((officiallyValidDocumentsMethod.$value || formData?.form?.officiallyValidDocumentsMethod || radioBtnValues?.kycMethod?.officiallyValidDocumentsMethod) && 'OVD')
        || null,
  };

  const kycFillers = kycFillCheck(customerInfo, kycFill);
  const journeyType = formContextCallbackData?.breDemogResponse?.BREFILLER2 === 'D101' ? 'ETB' : 'NTB';
  const mobileMatch = globals.functions.exportData()?.aadhaar_otp_val_data?.result?.mobileValid !== undefined;
  const biometricStatus = kycFillers ?? '';
  const ekycConsent = ((kycFillers === 'aadhaar')) ? `${getCurrentDateAndTime(3)}YEnglishxeng1x0` : '';
  const mobileMatchAadharData = globals.functions.exportData()?.aadhaar_otp_val_data?.result?.mobileValid;
  const VKYCConsent = fetchFiller4(mobileMatchAadharData, kycFill.KYC_STATUS, journeyType, kycFillers);
  const ekycSuccess = mobileMatch ? `${formData?.aadhaar_otp_val_data?.result?.ADVRefrenceKey}X${formData?.aadhaar_otp_val_data.result?.RRN}` : '';
  const finalDapPayload = {
    requestString: {
      applRefNumber: formContextCallbackData?.applRefNumber,
      eRefNumber: formContextCallbackData?.eRefNumber,
      customerId: customerInfo.customerID,
      communicationCity: customerInfo.communicationCity,
      idcomStatus: 'N',
      id_token_jwt: formContextCallbackData?.jwtToken || currentFormContext.jwtToken,
      motherFirstName: globals.functions.exportData()?.form?.mothersFirstName ?? '',
      motherMiddleName: globals.functions.exportData()?.form?.mothersMiddleName ?? '',
      motherLastName: globals.functions.exportData()?.form?.mothersLastName ?? '',
      ckycNumber: '',
      motherNameTitle: '',
      mobileNumber: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
      userAgent: navigator.userAgent,
      journeyID: formContextCallbackData.journeyID || currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      filler7: '',
      Segment: segment,
      biometricStatus,
      ekycSuccess,
      VKYCConsent,
      ekycConsent,
      idcom_token: formData?.queryParams?.idcom_token ?? '',
      journeyType,
    },
  };
  return finalDapPayload;
};

const throughDomSetArnNum = (arnNumRef, mobileNumber, leadProfileId, journeyId, globals) => {
  const nameOfArnRefPanel = 'arnRefNumPanel';
  const classNamefieldArnNo = '.field-newarnnumber';
  const arnRefNumPanel = document?.querySelector(`[name= ${nameOfArnRefPanel}]`);
  const arnNumberElement = arnRefNumPanel.querySelector(classNamefieldArnNo);
  if (arnNumberElement) {
    // Manipulate the content of the <p> tag inside '.field-newarnnumber'
    const para = arnNumberElement.querySelector('p');
    if (para) {
      para.textContent = arnNumRef;
    } else {
      arnNumberElement.textContent = arnNumRef;
    }
    invokeJourneyDropOffUpdate('CUSTOMER_ONBOARDING_COMPLETE', mobileNumber, leadProfileId, journeyId, globals);
  } else {
    invokeJourneyDropOffUpdate('CUSTOMER_ONBOARDING_FAILURE', mobileNumber, leadProfileId, journeyId, globals);
  }
};

const finalDap = (userRedirected, globals) => {
  const apiEndPoint = urlPath(ENDPOINTS.finalDap);
  const payload = createDapRequestObj(globals);
  const formData = globals.functions.exportData();
  const formContextCallbackData = formData?.currentFormContext || currentFormContext;
  const mobileNumber = formData.form.login.registeredMobileNumber || globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
  const leadProfileId = formData.leadProifileId || globals.form.runtime.leadProifileId.$value;
  const journeyId = formContextCallbackData.journeyID;
  const journeyName = formContextCallbackData?.executeInterfaceReqObj?.requestString?.journeyFlag || formContextCallbackData?.journeyType;
  const kycStatus = payload?.requestString.biometricStatus;
  const eventHandlers = {
    successCallBack: async (response) => {
      if (response?.errorCode === '0000') {
        currentFormContext.finalDapRequest = JSON.parse(JSON.stringify(payload));
        currentFormContext.finalDapResponse = response;
        currentFormContext.VKYC_URL = response.vkycUrl;
        currentFormContext.ARN_NUM = response.applicationNumber;
        currentFormContext.action = 'confirmation';
        await Promise.resolve(invokeJourneyDropOffUpdate('CUSTOMER_FINAL_DAP_SUCCESS', mobileNumber, leadProfileId, journeyId, globals));
        if (!userRedirected) {
          globals.functions.setProperty(globals.form.corporateCardWizardView, { visible: false });
          globals.functions.setProperty(globals.form.resultPanel, { visible: true });
          globals.functions.setProperty(globals.form.resultPanel.errorResultPanel, { visible: false });
          globals.functions.setProperty(globals.form.resultPanel.successResultPanel, { visible: true });
          // 👇 it is not setting the value.
          globals.functions.setProperty(globals.form.resultPanel.successResultPanel.arnRefNumPanel.newARNNumber, { value: response.applicationNumber });
          // setting through DomApi using throughDomSetArnNum function.
          if (journeyName === 'NTB' && (kycStatus === 'aadhaar')) {
            globals.functions.setProperty(globals.form.resultPanel.successResultPanel.vkycCameraConfirmation, { visible: true });
            globals.functions.setProperty(globals.form.resultPanel.successResultPanel.cameraConfirmationPanelInstruction, { visible: true });
            globals.functions.setProperty(globals.form.resultPanel.successResultPanel.vkycProceedButton, { visible: true });
            currentFormContext.isVideoKyc = true;
          }
          throughDomSetArnNum(response.applicationNumber, mobileNumber, leadProfileId, journeyId, globals);
          setTimeout(async (globalObj) => {
            const santizedFormData = santizedFormDataWithContext(globalObj);
            await Promise.resolve(sendPageloadEvent('CONFIRMATION_JOURNEY_STATE', santizedFormData, 'CONFIRMATION_PAGE_NAME'));
          }, 5000, globals);
        }
      } else {
        invokeJourneyDropOffUpdate('CUSTOMER_FINAL_DAP_FAILURE', mobileNumber, leadProfileId, journeyId, globals);
        if (!userRedirected) {
          globals.functions.setProperty(globals.form.corporateCardWizardView, { visible: false });
          globals.functions.setProperty(globals.form.resultPanel, { visible: true });
          globals.functions.setProperty(globals.form.resultPanel.errorResultPanel, { visible: true });
        }
      }
    },
    errorCallback: (response, globalObj) => {
      globalObj.functions.setProperty(globalObj.form.corporateCardWizardView, { visible: false });
      globalObj.functions.setProperty(globalObj.form.resultPanel, { visible: true });
      globalObj.functions.setProperty(globalObj.form.resultPanel.errorResultPanel, { visible: true });
      invokeJourneyDropOffUpdate('CUSTOMER_FINAL_DAP_FAILURE', mobileNumber, leadProfileId, journeyId, globalObj);
    },
  };
  // const res = {};
  // updatePanelVisibility(res, globals);
  restAPICall(globals, 'POST', payload, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallback);
};
export default finalDap;
