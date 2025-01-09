/* eslint-disable no-underscore-dangle */
import {
  ageValidator,
  clearString,
  generateErefNumber,
  maskNumber,
  parseCustomerAddress,
  pincodeCheck,
  pinCodeMasterCheck,
  urlPath,
} from '../../common/formutils.js';
import * as FD_CONSTANT from './constant.js';
import * as CONSTANT from '../../common/constants.js';
import { displayLoader, fetchJsonResponse } from '../../common/makeRestAPI.js';
import { addGaps } from './fd-dom-functions.js';
import { executeInterfacePostRedirect } from './executeinterfaceutil.js';
import creditCardSummary from './creditcardsumaryutil.js';
import { invokeJourneyDropOffUpdate } from './fd-journey-util.js';

const { FORM_RUNTIME: formRuntime, CURRENT_FORM_CONTEXT } = CONSTANT;
const { JOURNEY_NAME, FD_ENDPOINTS } = FD_CONSTANT;

let resendOtpCount = 0;
CURRENT_FORM_CONTEXT.journeyName = JOURNEY_NAME;
formRuntime.getOtpLoader = displayLoader;
formRuntime.otpValLoader = displayLoader;
formRuntime.validatePanLoader = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.executeInterface = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.ipa = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.aadharInit = (typeof window !== 'undefined') ? displayLoader : false;

const validFDPan = (val) => {
  // Check if the input length is exactly 10 characters
  if (val?.length !== 10) return false;

  // Check the first 5 characters for alphabets
  if (![...val.slice(0, 5)]?.every((c) => /[a-zA-Z]/.test(c))) return false;

  // Check the next 4 characters for digits
  if (![...val.slice(5, 9)]?.every((c) => /\d/.test(c))) return false;

  // Check the last character for an alphabet
  if (!/[a-zA-Z]/.test(val[9])) return false;

  return true;
};
/**
 * Validates the date of birth field to ensure the age is between 18 and 70.
 * @param {Object} globals - The global object containing necessary data for DAP request.
*/
const validateLogin = (globals) => {
  const dobValue = globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value;
  const panValue = (globals.form.loginMainPanel.loginPanel.identifierPanel.pan.$value)?.replace(/\s+/g, ''); // remove white space
  const panDobSelection = globals.form.loginMainPanel.loginPanel.identifierPanel.panDobSelection.$value;
  const mobileNo = globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber.$value;
  const radioSelect = (panDobSelection === '0') ? 'DOB' : 'PAN';
  const panErrorText = FD_CONSTANT.ERROR_MSG.panError;

  const panInput = document.querySelector(`[name=${'pan'} ]`);
  const panWrapper = panInput.parentElement;

  const panIsValid = validFDPan(panValue);
  const dobIsValid = ageValidator(FD_CONSTANT.AGE_LIMIT.min, FD_CONSTANT.AGE_LIMIT.max, dobValue);
  const mobIsValid = (mobileNo && mobileNo?.length === 10);

  switch (radioSelect) {
    case 'DOB':
      if (dobValue && String(new Date(dobValue).getFullYear()).length === 4) {
        const dobErrorText = FD_CONSTANT.ERROR_MSG.ageLimit;
        if (dobIsValid && (mobIsValid)) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: true });
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', '', { useQualifiedName: true });
        }
        if (dobIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth, { valid: true });
        }
        if (!dobIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', dobErrorText, { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
        if (!(mobIsValid)) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
      } else if (!dobIsValid) {
        const dobErrorText = FD_CONSTANT.ERROR_MSG.ageLimit;
        globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', dobErrorText, { useQualifiedName: true });
        globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
      }
      break;
    case 'PAN':
      panWrapper.setAttribute('data-empty', true);
      if (panValue) {
        panWrapper.setAttribute('data-empty', false);
        if (panIsValid && (mobIsValid)) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: true });
        }
        if (panIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.pan, { valid: true });
        }
        if (!panIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', panErrorText, { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
        if (!(mobIsValid)) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
      }
      break;
    default:
      globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
  }
};

/**
 * Starts the timer for resending OTP.
 * @param {Object} globals - The global object containing necessary data for DAP request.
*/
function otpTimer(globals) {
  let sec = FD_CONSTANT.OTP_TIMER;
  let dispSec = FD_CONSTANT.OTP_TIMER;
  const { otpPanel } = globals.form.otpPanelWrapper;
  const timer = setInterval(() => {
    globals.functions.setProperty(otpPanel.otpPanel.secondsPanel.seconds, { value: dispSec });
    sec -= 1;
    dispSec = sec;
    if (sec < 10) {
      dispSec = `0${dispSec}`;
    }
    if (sec < 0) {
      clearInterval(timer);
      globals.functions.setProperty(otpPanel.otpPanel.secondsPanel, { visible: false });
      if (resendOtpCount < FD_CONSTANT.MAX_OTP_RESEND_COUNT) globals.functions.setProperty(otpPanel.otpPanel.otpResend, { visible: true });
    }
  }, 1000);
}

/**
 * Starts the timer for resending OTP.
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @param {string} mobileNo - Registered mobile number
*/
const maskedMobNum = (mobileNo, globals) => {
  if (!(mobileNo?.length === 10)) return;
  globals.functions.setProperty(globals.form.loginMainPanel.maskedMobileNumber, { value: `${maskNumber(mobileNo, 6)}.` });
};

/**
 * generates the otp
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @param {object} globals
 * @return {PROMISE}
 */
const getOTP = (mobileNumber, pan, dob, globals) => {
  CURRENT_FORM_CONTEXT.journeyType = 'ETB';
  if (typeof window !== 'undefined') globals.functions.setProperty(globals.form.runtime.formUrl, { value: window.location.href });
  const { otpPanel } = globals.form.otpPanelWrapper.otpPanel;
  if (resendOtpCount < FD_CONSTANT.MAX_OTP_RESEND_COUNT) {
    globals.functions.setProperty(otpPanel.secondsPanel, { visible: true });
    globals.functions.setProperty(otpPanel.otpResend, { visible: false });
  } else {
    globals.functions.setProperty(otpPanel.secondsPanel, { visible: false });
  }
  CURRENT_FORM_CONTEXT.action = 'getOTP';
  // eslint-disable-next-line no-restricted-globals
  CURRENT_FORM_CONTEXT.journeyID = globals.form.runtime.journeyId.$value;
  CURRENT_FORM_CONTEXT.leadIdParam = globals.functions.exportData().queryParams;
  const panValue = (pan.$value)?.replace(/\s+/g, '');
  const jsonObj = {
    requestString: {
      dateOfBirth: clearString(dob.$value) || '',
      mobileNumber: mobileNumber.$value,
      panNumber: panValue?.toUpperCase() || '',
      journeyID: globals.form.runtime.journeyId.$value,
      journeyName: globals.form.runtime.journeyName.$value || CURRENT_FORM_CONTEXT.journeyName,
      identifierValue: panValue || dob.$value,
      identifierName: panValue ? 'PAN' : 'DOB',
    },
  };
  const path = urlPath(FD_ENDPOINTS.otpGen);
  formRuntime?.getOtpLoader();

  return fetchJsonResponse(path, jsonObj, 'POST', true);
};

/**
 * @name resendOTP
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @return {PROMISE}
 */
const resendOTP = async (globals) => {
  const { otpPanel } = globals.form.otpPanelWrapper.otpPanel;
  const mobileNo = globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber;
  const panValue = (globals.form.loginMainPanel.loginPanel.identifierPanel.pan);
  const dobValue = globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth;
  if (resendOtpCount < FD_CONSTANT.MAX_OTP_RESEND_COUNT) {
    resendOtpCount += 1;
    if (resendOtpCount === FD_CONSTANT.MAX_OTP_RESEND_COUNT) {
      globals.functions.setProperty(otpPanel.secondsPanel, { visible: false });
      globals.functions.setProperty(otpPanel.otpResend, { visible: false });
      globals.functions.setProperty(otpPanel.maxAttemptMessage, { visible: true });
    }
    return getOTP(mobileNo, panValue, dobValue, globals);
  }
  return null;
};

/**
 * validates the otp
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @return {PROMISE}
 */
const otpValidation = (mobileNumber, pan, dob, otpNumber, globals) => {
  addGaps('.field-pannumberpersonaldetails input');
  const referenceNumber = generateErefNumber() ?? '';
  CURRENT_FORM_CONTEXT.referenceNumber = referenceNumber;
  const panValue = (pan.$value)?.replace(/\s+/g, ''); // remove white space
  const jsonObj = {
    requestString: {
      mobileNumber: mobileNumber.$value,
      passwordValue: otpNumber.$value,
      dateOfBirth: clearString(dob.$value) || '',
      panNumber: panValue?.toUpperCase() || '',
      channelSource: '',
      journeyID: CURRENT_FORM_CONTEXT.journeyID,
      journeyName: globals.form.runtime.journeyName.$value || CURRENT_FORM_CONTEXT.journeyName,
      dedupeFlag: 'N',
      referenceNumber: referenceNumber ?? '',
    },
  };
  const path = urlPath(FD_ENDPOINTS.otpVal);
  formRuntime?.otpValLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', false);
};

/**
 * does the custom show hide of panel or screens in resend otp.
 * @param {string} errorMessage
 * @param {number} numRetries
 * @param {object} globals
 */
function customSetFocus(errorMessage, numRetries, globals) {
  if (typeof numRetries === 'number' && numRetries < 1) {
    globals.functions.setProperty(globals.form.otpPanelWrapper, { visible: false });
    globals.functions.setProperty(globals.form.bannerImagePanel, { visible: false });
    globals.functions.setProperty(globals.form.resultPanel, { visible: true });
    globals.functions.setProperty(globals.form.resultPanel.errorResultPanel, { visible: true });
    globals.functions.setProperty(globals.form.resultPanel.errorResultPanel.errorMessageText, { value: errorMessage });
  }
}

/**
 * Reloads the current page.
 * lead idParam is been strored in current formContext after otpGen btn click
 * @name reloadPage
 */
function reloadPage() {
  window.location.reload();
}

/**
 * @name pincodeChangeHandler
 * @param {string} pincode
 * @param {object} globals
 */
const pincodeChangeHandler = (pincode, globals) => {
  const {
    newCurentAddressPin,
    newCurentAddressCity,
    newCurentAddressState,

  } = globals.form.fdBasedCreditCardWizard.basicDetails.reviewDetailsView.addressDetails.newCurentAddressPanel;
  pinCodeMasterCheck(globals, newCurentAddressCity, newCurentAddressState, newCurentAddressPin, pincode);
};

/**
 * @name checkModeFd
 * @param {object} globals
 */
const checkModeFd = async (globals) => {
  const formData = globals.functions.exportData();
  const { authmode: idcomVisit, visitType: aadhaarVisit } = formData?.queryParams || {};
  if (!idcomVisit && !aadhaarVisit) return;

  const {
    addressDeclarationPanel,
    resultPanel,
    selectKYCOptionsPanel,
    bannerImagePanel,
    loginMainPanel,
  } = globals.form;
  globals.functions.setProperty(bannerImagePanel, { visible: false });
  globals.functions.setProperty(loginMainPanel, { visible: false });
  creditCardSummary(globals);

  if (idcomVisit) {
    if (formData?.queryParams?.errorCode === FD_CONSTANT.IDCOM.response.sessionExpired.errorCode || globals?.functions?.exportData()?.queryParams?.errorCode === FD_CONSTANT.IDCOM.response.cancelledByUser.errorCode) {
      const { errorMessageText, errResDealerPanel } = resultPanel.errorResultPanel;
      globals.functions.setProperty(resultPanel, { visible: true });
      globals.functions.setProperty(resultPanel.errorResultPanel, { visible: true });
      const { idcomRedirectAttempt } = addressDeclarationPanel;
      const attemptCount = parseInt(idcomRedirectAttempt.$value, 10);
      if (attemptCount < FD_CONSTANT.IDCOM.maxRetry) {
        if (formData?.queryParams?.errorCode === FD_CONSTANT.IDCOM.response.sessionExpired.errorCode) {
          globals.functions.setProperty(resultPanel.errorResultPanel.idcomRetry, { visible: true });
          globals.functions.setProperty(errorMessageText, { value: FD_CONSTANT.ERROR_MSG.sessionExpired });
          globals.functions.setProperty(resultPanel.errorResultPanel.tryAgainButtonErrorPanel, { visible: false });
          globals.functions.setProperty(errResDealerPanel.errResDealerText1, { value: FD_CONSTANT.ERROR_MSG.pleaseRetry });
          globals.functions.setProperty(errResDealerPanel.errResDealerText2, { value: FD_CONSTANT.ERROR_MSG.sessionExpiredDescription });
          globals.functions.setProperty(errResDealerPanel, { visible: true });
        } else {
          globals.functions.setProperty(resultPanel.errorResultPanel.idcomRetry, { visible: true });
          globals.functions.setProperty(errorMessageText, { value: FD_CONSTANT.ERROR_MSG.idcomCancelledByUser });
          globals.functions.setProperty(resultPanel.errorResultPanel.tryAgainButtonErrorPanel, { visible: false });
        }
        globals.functions.setProperty(idcomRedirectAttempt, { value: attemptCount + 1 });
      } else {
        const arnNum = formData?.currentFormContext?.executeInterfaceResponse?.APS_APPL_REF_NUM;
        globals.functions.setProperty(errorMessageText, { value: FD_CONSTANT.ERROR_MSG.requestNotProcessed });
        globals.functions.setProperty(errResDealerPanel?.errResDealerText2, { value: `${FD_CONSTANT.ERROR_MSG.branchVisitWithRefNum} ${arnNum}` });
      }
    } else {
      if (formData?.queryParams?.success === 'false' && formData?.queryParams?.errorCode === FD_CONSTANT.IDCOM.response.idcomFail.errorCode) {
        const { referenceNumberTagLine, idComRefNumberTagLine } = resultPanel.successResultPanel.tqSuccessWrapper.refNumPanel;
        globals.functions.setProperty(referenceNumberTagLine, { visible: false });
        globals.functions.setProperty(idComRefNumberTagLine, { visible: true });
      }
      executeInterfacePostRedirect('idCom', true, globals);
      return;
    }
  }

  const aadhaarSuccess = aadhaarVisit === 'EKYC_AUTH' && formData?.aadhaar_otp_val_data?.message?.toLowerCase() === 'aadhaar otp validate success';
  const aadhaarCancelled = aadhaarVisit === 'EKYC_AUTH' && !formData?.aadhaar_otp_val_data?.message;
  const aadhaarFail = aadhaarVisit === 'EKYC_AUTH_FAILED';
  if (aadhaarSuccess) {
    try {
      const {
        Address1, Address2, Address3, City, State, Zipcode,
      } = formData.aadhaar_otp_val_data.result || {};
      const {
        communicationAddress1, communicationAddress2, communicationAddress3,
        communicationCity, communicationState, comCityZip,
      } = formData?.currentFormContext?.executeInterfaceRequest?.requestString || {};

      const isValidAadhaarPincode = await pincodeCheck(Zipcode, City, State);
      let aadhaarAddress = '';
      let parsedAadhaarAddress = '';
      let fullAadhaarAddress = [Address1, Address2, Address3, City, State, Zipcode].filter(Boolean).join(', ');
      if (isValidAadhaarPincode.result === 'true') {
        aadhaarAddress = [Address1, Address2, Address3].filter(Boolean).join(' ');
        parsedAadhaarAddress = parseCustomerAddress(aadhaarAddress);
        fullAadhaarAddress = `${parsedAadhaarAddress.join(', ')} ${City} ${State} ${Zipcode}`;
      } else {
        globals.functions.setProperty(addressDeclarationPanel?.aadhaarAddressDeclaration?.aadhaarBankStatement, { visible: false });
      }
      const communicationAddress = [communicationAddress1, communicationAddress2, communicationAddress3, communicationCity, communicationState, comCityZip].filter(Boolean).join(', ');

      const {
        aadhaarAddressDeclaration, currentResidenceAddressBiometricOVD, currentAddressDeclarationAadhar,
        TnCAadhaarNoMobMatchLabel, TnCAadhaarNoMobMatch, proceedFromAddressDeclarationIdcom, proceedFromAddressDeclaration,
      } = addressDeclarationPanel;

      globals.functions.setProperty(aadhaarAddressDeclaration, { visible: true });
      globals.functions.setProperty(aadhaarAddressDeclaration.aadhaarAddressPrefilled, { value: fullAadhaarAddress });
      globals.functions.setProperty(currentAddressDeclarationAadhar.currentResidenceAddressAadhaar, { value: communicationAddress });
      globals.functions.setProperty(currentResidenceAddressBiometricOVD.currentResAddressBiometricOVD, { value: communicationAddress });
      globals.functions.setProperty(addressDeclarationPanel, { visible: true });

      const isMobileMatch = formData?.aadhaar_otp_val_data?.result?.mobileValid === 'y';
      globals.functions.setProperty(globals.form?.selectKYCOptionsPanel?.aadhaarMobileMatch, { value: isMobileMatch ? 'Yes' : 'No' });

      globals.functions.setProperty(proceedFromAddressDeclarationIdcom, { visible: !formData?.currentFormContext?.customerIdentityChange });
      globals.functions.setProperty(proceedFromAddressDeclaration, { visible: formData?.currentFormContext?.customerIdentityChange });

      if (!isMobileMatch) {
        globals.functions.setProperty(TnCAadhaarNoMobMatchLabel, { visible: true });
        globals.functions.setProperty(TnCAadhaarNoMobMatch, { visible: true });
      }

      invokeJourneyDropOffUpdate(
        'AADHAAR_REDIRECTION_SUCCESS',
        formData?.loginPanel?.mobilePanel?.registeredMobileNumber,
        formData?.runtime?.leadProifileId,
        formData?.runtime?.leadProifileId?.journeyId,
        globals,
      );
    } catch (ex) {
      invokeJourneyDropOffUpdate(
        'AADHAAR_REDIRECTION_FAILURE',
        formData?.loginPanel?.mobilePanel?.registeredMobileNumber,
        formData?.runtime?.leadProifileId,
        formData?.runtime?.leadProifileId?.journeyId,
        globals,
      );
    }
  } else if (aadhaarFail) {
    const {
      selectKYCMethodOption1, selectKYCMethodOption2, selectKYCMethodOption3, wrongAttemptPopupWrapper,
    } = selectKYCOptionsPanel;
    globals.functions.setProperty(selectKYCOptionsPanel, { visible: true });
    globals.functions.setProperty(selectKYCMethodOption1, { visible: true });
    globals.functions.setProperty(selectKYCMethodOption2, { visible: false });
    globals.functions.setProperty(selectKYCMethodOption3, { visible: true });
    globals.functions.setProperty(selectKYCMethodOption1.aadharBiometricVerification, { value: '0' });
    globals.functions.setProperty(wrongAttemptPopupWrapper, { visible: true });
    if (formData?.aadhaar_otp_val_data?.status === FD_CONSTANT.ERROR_MSG.aadhaarMaxOtpAttemptsStatusCode) {
      globals.functions.setProperty(wrongAttemptPopupWrapper.wrongAttemptPopup.wrongAttemptPopupText1, { value: FD_CONSTANT.ERROR_MSG.aadhaarMaxOtpAttemptsTitle });
      globals.functions.setProperty(wrongAttemptPopupWrapper.wrongAttemptPopup.wrongAttemptPopupText2, { value: FD_CONSTANT.ERROR_MSG.aadhaarMaxOtpAttempts });
    } else {
      globals.functions.setProperty(wrongAttemptPopupWrapper.wrongAttemptPopup.wrongAttemptPopupText1, { value: FD_CONSTANT.ERROR_MSG.aadhaarTimeoutTitle });
      globals.functions.setProperty(wrongAttemptPopupWrapper.wrongAttemptPopup.wrongAttemptPopupText2, { value: FD_CONSTANT.ERROR_MSG.aadhaarTimeout });
    }
    if (!formData?.currentFormContext?.isIntegraFlow) {
      globals.form.selectKYCOptionsPanel.selectKYCMethodOption1.aadharBiometricVerification._jsonModel.enumNames[0] = 'Aadhaar Biometric KYC at your Doorstep.';
    }
  } else if (aadhaarCancelled) {
    const {
      selectKYCMethodOption1, selectKYCMethodOption2, selectKYCMethodOption3,
    } = selectKYCOptionsPanel;
    globals.functions.setProperty(selectKYCOptionsPanel, { visible: true });
    globals.functions.setProperty(selectKYCMethodOption1, { visible: true });
    globals.functions.setProperty(selectKYCMethodOption2, { visible: false });
    globals.functions.setProperty(selectKYCMethodOption3, { visible: true });
    globals.functions.setProperty(selectKYCMethodOption1.aadharBiometricVerification, { value: '0' });
    if (!formData?.currentFormContext?.isIntegraFlow) {
      globals.form.selectKYCOptionsPanel.selectKYCMethodOption1.aadharBiometricVerification._jsonModel.enumNames[0] = 'Aadhaar Biometric KYC at your Doorstep.';
    }
  }
};

export {
  validateLogin,
  otpTimer,
  maskedMobNum,
  getOTP,
  otpValidation,
  resendOTP,
  customSetFocus,
  reloadPage,
  pincodeChangeHandler,
  validFDPan,
  checkModeFd,
};
