import { CURRENT_FORM_CONTEXT, FORM_RUNTIME } from '../../common/constants.js';
import { parseCustomerAddress, pincodeCheck, urlPath } from '../../common/formutils.js';
import { localJsonCompatibleTime } from '../../common/functions.js';
import { fetchJsonResponse, restAPICall } from '../../common/makeRestAPI.js';
import { confirmCardState } from './confirmcardutil.js';
import {
  JOURNEY_NAME, FD_ENDPOINTS, EMPLOYEE_MAP, MIN_ADDRESS_LENGTH,
  IDCOM,
} from './constant.js';
import { SELECTED_CUSTOMER_ID } from './customeridutil.js';
import { invokeJourneyDropOffUpdate } from './fd-journey-util.js';
import { SELECT_FD_STATE } from './fddetailsutil.js';
import finalDap from './finaldaputils.js';
import { IPA_RESPONSE } from './ipautil.js';

const createExecuteInterfaceRequest = (payload, source, globals) => {
  const {
    customerInfo,
    journeyID,
    customerAddress,
  } = CURRENT_FORM_CONTEXT;
  const { basicDetails, selectFD } = globals.form.fdBasedCreditCardWizard;
  const {
    personalDetails, addressDetails, employeeAssistance, employmentDetails,
  } = basicDetails.reviewDetailsView;
  const { employeeAssistancePanel, employeeAssistanceToggle } = employeeAssistance;

  const { fdNumberSelection } = selectFD.fdSelectionInfo;
  const { fdList } = SELECT_FD_STATE;
  const selectedFds = fdNumberSelection.reduce((acc, fd) => {
    if (fd.fdAccSelect._data.$_value === 'on') {
      acc.push(fd?.fdNumber?._data?.$_value?.toString());
    }
    return acc;
  }, []);
  const selectedFdDetails = fdList.filter((fd) => selectedFds.includes(fd.fdAccountNo.trim())) // Filter based on selected FD
    .map((fd) => ({
      fdNumber: fd.fdAccountNo.trim(),
      fdTenure: `${fd.termMonths} months ${fd.termDays} days`,
      fdAmt: fd.balPrincipal,
    }));
  globals.functions.setProperty(globals.form.loginMainPanel.selectedFdDetails, { value: JSON.stringify(selectedFdDetails) });
  const addressEditFlag = addressDetails?.mailingAddressToggle?.$value !== 'on';

  const getAddress = (addressSource) => ({
    line1: addressSource?.addressLine1 || '',
    line2: addressSource?.addressLine2 || '',
    line3: addressSource?.addressLine3 || '',
    city: addressSource?.city || '',
    state: addressSource?.state || '',
    zip: addressSource?.pincode || addressSource?.comCityZip || '',
  });

  const getEditedAddress = (panel) => ({
    line1: panel?.newCurrentAddressLine1?.$value || '',
    line2: panel?.newCurrentAddressLine2?.$value || '',
    line3: panel?.newCurrentAddressLine3?.$value || '',
    city: panel?.newCurentAddressCity?.$value || '',
    state: panel?.newCurentAddressState?.$value || '',
    zip: panel?.newCurentAddressPin?.$value || '',
  });

  let communicationAddress = getAddress(customerAddress);

  if (addressEditFlag) {
    const newAddressPanel = addressDetails.newCurentAddressPanel;
    communicationAddress = getEditedAddress(newAddressPanel);
  }

  let apsEmailEditFlag = 'N';
  if (customerInfo?.refCustEmail !== personalDetails.emailID.$value) {
    apsEmailEditFlag = 'Y';
  }
  let nameOnCard = personalDetails.nameOnCard?.$value?.toUpperCase()?.replace(/\s+/g, ' ');
  if (!CURRENT_FORM_CONTEXT?.editFlags?.nameOnCard) {
    nameOnCard = personalDetails.nameOnCardDD?.$value?.toUpperCase()?.replace(/\s+/g, ' ');
  }
  const annualIncome = employmentDetails?.annualIncome?.$value ?? '';
  const empAssistanceToggle = employeeAssistanceToggle?.$value === 'on';
  const companyName = employmentDetails.employmentType?.$value === '1' || employmentDetails.employmentType.$value === '2' ? customerInfo?.customerFullName : '';
  let lc1 = '';
  let lgCode = '';
  let channel = '';
  if (empAssistanceToggle) {
    channel = employeeAssistancePanel?.channel?.$value;
    if (channel.toLowerCase() === 'branch') {
      lc1 = employeeAssistancePanel?.cardsBdrLc1?.$value || '';
      lgCode = employeeAssistancePanel?.tseLgCode?.$value || '';
    } else {
      lc1 = employeeAssistancePanel?.lc1Code?.$value || '';
      lgCode = employeeAssistancePanel?.lgCode?._data?.$_value || '';
    }
  }
  const request = {
    requestString: {
      addressEditFlag: addressEditFlag ? 'Y' : 'N',
      annualIncomeOrItrAmount: String(annualIncome),
      annualItr: '',
      applyingBranch: 'N',
      apsDobEditFlag: customerInfo?.datBirthCust ? 'N' : 'Y',
      apsEmailEditFlag,
      authMode: '',
      bankAccountNumber: SELECTED_CUSTOMER_ID?.selectedCustId?.codAcctNo,
      bankEmployee: 'N',
      branchCity: (empAssistanceToggle && channel.toLowerCase() === 'branch' && employeeAssistancePanel?.branchCity?.$value) || '',
      branchCode: (empAssistanceToggle && channel.toLowerCase() === 'branch' && employeeAssistancePanel?.branchCode?.$value) || '',
      branchName: (empAssistanceToggle && channel.toLowerCase() === 'branch' && employeeAssistancePanel?.branchName?._data?.$_value) || '',
      CCAD_Relationship_number: '',
      cardsData: '',
      channel,
      channelSource: '',
      communicationAddress1: communicationAddress?.line1,
      communicationAddress2: communicationAddress?.line2,
      communicationAddress3: communicationAddress?.line3,
      communicationCity: communicationAddress?.city,
      communicationState: communicationAddress?.state,
      comAddressType: '2',
      comCityZip: communicationAddress?.zip,
      comResidenceType: '2',
      companyName,
      customerID: SELECTED_CUSTOMER_ID?.selectedCustId?.customerID,
      dateOfBirth: personalDetails.dateOfBirthPersonalDetails.$value,
      departmentOrEmpCode: '',
      designation: EMPLOYEE_MAP[employmentDetails.employmentType._data.$_value],
      dsaValue: (empAssistanceToggle && channel.toLowerCase() === 'dsa' && employeeAssistancePanel?.dsaName?._data?.$_value) || '',
      dsaCode: (empAssistanceToggle && channel.toLowerCase() === 'dsa' && employeeAssistancePanel?.dsaCode?._data?.$_value) || '',
      eReferenceNumber: CURRENT_FORM_CONTEXT.referenceNumber,
      filler6: '',
      firstName: customerInfo.customerFirstName,
      fullName: customerInfo?.customerFullName,
      gender: personalDetails.gender._data.$_value,
      isManualFlow: 'false',
      journeyFlag: 'ETB',
      journeyID,
      journeyName: JOURNEY_NAME,
      lastName: customerInfo.customerLastName,
      leadClosures: '',
      leadGenerater: '',
      lc1,
      lgCode,
      lc2: (empAssistanceToggle && employeeAssistancePanel?.lc2Code?._data?.$_value) || '',
      lienConsent: new Date().toISOString(),
      middleName: customerInfo.customerMiddleName,
      mobileEditFlag: 'N',
      mobileNumber: globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber.$value,
      monthlyincome: '',
      nameEditFlag: personalDetails?.fathersFullName?.$value?.length > 0 || CURRENT_FORM_CONTEXT?.nameParsed ? 'Y' : 'N',
      nameOnCard,
      occupation: employmentDetails.employmentType._data.$_value || '1',
      officialEmailId: '',
      officeAddress1: '',
      officeAddress2: '',
      officeAddress3: '',
      officeCity: '',
      officeState: '',
      officeZipCode: '',
      panCheckFlag: 'Y',
      panDobMatch: payload?.validDob,
      panEditFlag: customerInfo?.refCustItNum ? 'N' : 'Y',
      panNameMatch: payload?.validName,
      panNumber: personalDetails.panNumberPersonalDetails.$value.replace(/\s+/g, '')?.toUpperCase(),
      permanentAddress1: communicationAddress?.line1,
      permanentAddress2: communicationAddress?.line2,
      permanentAddress3: communicationAddress?.line3,
      permanentCity: communicationAddress?.city,
      permanentState: communicationAddress?.state,
      permanentZipCode: communicationAddress?.zip,
      perAddressType: '2',
      perfiosTxnID: '',
      personalEmailId: personalDetails?.emailID.$value,
      productCode: '',
      resPhoneEditFlag: 'N',
      selectedFdDetails,
      selfConfirmation: 'Y',
      smCode: (empAssistanceToggle && employeeAssistancePanel?.smCode?._data?.$_value) || '',
      timeInfo: localJsonCompatibleTime(),
      ekycMobileMatch: '',
    },
  };
  return request;
};
/**
 * Executes an interface request.
 * @name executeInterface
 * @param {object} payload - The payload for the interface request.
 * @param {boolean} showLoader - Whether to show a loader while the request is in progress.
 * @param {boolean} hideLoader - Whether to hide the loader after the request is complete.
 * @param {string} source
 * @param {object} globals - The global context object.
 * @returns {Promise<object>} A promise that resolves to the response of the interface request.
 */
const executeInterface = async (payload, showLoader, hideLoader, source, globals) => {
  const { functions, form } = globals;
  let executeInterfaceRequest = CURRENT_FORM_CONTEXT?.executeInterfaceRequest || functions.exportData()?.currentFormContext?.executeInterfaceRequest || '';

  if (source === 'reviewdetails') {
    executeInterfaceRequest = createExecuteInterfaceRequest(payload, source, globals);
    CURRENT_FORM_CONTEXT.executeInterfaceRequest = executeInterfaceRequest;
  }

  // Ensure all keys in the request object have values, defaulting to an empty string
  Object.keys(executeInterfaceRequest).forEach((key) => {
    if (executeInterfaceRequest[key] == null) {
      executeInterfaceRequest[key] = '';
    }
  });

  // Handle card confirmation source
  if (source === 'confirmcard') {
    const selectedCard = IPA_RESPONSE?.productDetails?.[confirmCardState?.selectedCardIndex];
    if (selectedCard) {
      const productCode = selectedCard.cardProductCode;
      CURRENT_FORM_CONTEXT.selectedProductCode = productCode;
      executeInterfaceRequest.requestString.productCode = productCode;
      CURRENT_FORM_CONTEXT.selectedCreditCard = selectedCard;
    }
  }

  // Handle KYC source types
  if (source.startsWith('kyc')) {
    const selectedKycButton = source.split('-')[1];
    const authModeMap = {
      biometric: 'OTP',
      aadhaar: 'eKYCIDCOM',
      ovd: 'IDCOM',
    };
    executeInterfaceRequest.requestString.authMode = authModeMap[selectedKycButton] || '';
  }

  if (['addressdeclarationproceed', 'addressdeclarationidcomm'].includes(source)) {
    const { currentResidenceAddressBiometricOVD, aadhaarAddressDeclaration } = form.addressDeclarationPanel;
    let selectedKyc = functions.exportData()?.currentFormContext?.selectedKyc || CURRENT_FORM_CONTEXT?.selectedKyc;
    if (globals.functions.exportData()?.queryParams?.visitType === 'EKYC_AUTH_FAILED') {
      CURRENT_FORM_CONTEXT.aadhaarFailed = true;
      selectedKyc = CURRENT_FORM_CONTEXT.selectedKyc;
    }

    // Check OVD biometric confirmation
    if (currentResidenceAddressBiometricOVD.currentResidenceAddressBiometricOVDConfirmation?._data?.$_value === '1') {
      executeInterfaceRequest.requestString.etbAddressEditDeclaration = new Date().toISOString();
    }

    // Aadhaar address confirmation
    if (selectedKyc === 'aadhaar') {
      executeInterfaceRequest.requestString.authMode = 'eKYCIDCOM';
      executeInterfaceRequest.requestString.ekycMobileMatch = form?.selectKYCOptionsPanel?.aadhaarMobileMatch?._data?.$_value;
      if (aadhaarAddressDeclaration.aadharAddressConfirmation?._data?.$_value === '1') {
        executeInterfaceRequest.requestString.etbAddressEditDeclaration = new Date().toISOString();
      }
      const formData = globals.functions.exportData();
      const {
        Address1, Address2, Address3, City, State, Zipcode,
      } = formData?.aadhaar_otp_val_data.result || {};

      const isValidAadhaarPincode = await pincodeCheck(Zipcode, City, State);
      let aadhaarAddress = '';
      let parsedAadhaarAddress = '';
      if (isValidAadhaarPincode.result === 'true') {
        aadhaarAddress = [Address1, Address2, Address3].filter(Boolean).join(' ');

        parsedAadhaarAddress = parseCustomerAddress(aadhaarAddress);
        // eslint-disable-next-line prefer-const
        let [permanentAddress1, permanentAddress2, permanentAddress3] = parsedAadhaarAddress;
        if (parsedAadhaarAddress.join(' ').length < MIN_ADDRESS_LENGTH) {
          permanentAddress2 = City;
        }
        Object.assign(executeInterfaceRequest.requestString, {
          permanentAddress1,
          permanentAddress2,
          permanentAddress3,
          permanentCity: City,
          permanentState: State,
          permanentZipCode: Zipcode,
          perAddressType: '4',
        });
      }
    } else if (selectedKyc === 'biokyc' || selectedKyc === 'bioinperson') {
      executeInterfaceRequest.requestString.authMode = 'OTP';
    } else if (selectedKyc === 'OVD') {
      executeInterfaceRequest.requestString.authMode = 'IDCOM';
    }
  }

  CURRENT_FORM_CONTEXT.executeInterfaceRequest = executeInterfaceRequest;
  globals.functions.setProperty(form.runtime.formContext, { value: JSON.stringify(CURRENT_FORM_CONTEXT) });
  const apiEndPoint = urlPath(FD_ENDPOINTS.executeInterface);
  if (showLoader) FORM_RUNTIME.executeInterface();

  return fetchJsonResponse(apiEndPoint, executeInterfaceRequest, 'POST', hideLoader);
};

/**
 * Executes an interface post request with the appropriate authentication mode based on the response.
 *
 * @param {object} source - The source object (unused in the current implementation).
 * @param {object} globals - An object containing global variables and functions.
 */
const executeInterfacePostRedirect = async (source, userRedirected, globals) => {
  const formCallBackContext = globals.functions.exportData()?.currentFormContext || JSON.parse(globals?.functions?.exportData()?.formContext);
  const requestObj = formCallBackContext?.executeInterfaceRequest;
  const selectedCreditCardCode = globals.functions.exportData()?.selectedCreditCard || '';
  requestObj.requestString.productCode = selectedCreditCardCode;
  const kycModes = {
    aadhaar: 'eKYCIDCOM',
    biokyc: 'OTP',
    OVD: 'IDCOM',
  };

  const selectedKyc = formCallBackContext?.selectedKyc;
  if (selectedKyc) {
    requestObj.requestString.authMode = kycModes[selectedKyc] || '';
  }
  if (source === 'idCom') {
    if (requestObj?.requestString?.addressEditFlag?.toUpperCase() !== 'Y') {
      requestObj.requestString.authMode = 'IDCOM';
    } else if (globals.functions.exportData()?.queryParams?.errorCode === IDCOM.response.idcomFail.errorCode) {
      requestObj.requestString.authMode = kycModes.biokyc;
    }
  }
  const mobileValid = globals.functions.exportData()?.aadhaar_otp_val_data?.result?.mobileValid;

  if (mobileValid === 'y') {
    requestObj.requestString.ekycMobileMatch = 'true';
  } else if (mobileValid === 'n') {
    requestObj.requestString.ekycMobileMatch = 'false';
  } else {
    requestObj.requestString.ekycMobileMatch = '';
  }

  const apiEndPoint = urlPath(FD_ENDPOINTS.executeInterface);
  const eventHandlers = {
    successCallBack: (response) => {
      if (response?.ExecuteInterfaceResponse?.APS_ERROR_CODE === '0000') {
        CURRENT_FORM_CONTEXT.jwtToken = response.Id_token_jwt;
        finalDap(userRedirected, globals);
      } else {
        const formContextCallbackData = globals.functions.exportData()?.currentFormContext;
        const mobileNumber = globals.functions.exportData().form.login.registeredMobileNumber;
        const leadProfileId = globals.functions.exportData().leadProifileId;
        const journeyId = formContextCallbackData.journeyID;
        invokeJourneyDropOffUpdate('POST_EXECUTEINTERFACE_FAILURE', mobileNumber, leadProfileId, journeyId, globals);
      }
    },
    errorCallBack: (response, globalObj) => {
      const { resultPanel, fdBasedCreditCardWizard, loginMainPanel } = globalObj.form;

      const formContextCallbackData = globalObj.functions.exportData()?.currentFormContext;
      const mobileNumber = globalObj.functions.exportData().form.login.registeredMobileNumber;
      const leadProfileId = globalObj.functions.exportData().leadProifileId;
      const journeyId = formContextCallbackData.journeyID;
      globalObj.functions.setProperty(fdBasedCreditCardWizard, { visible: false });
      globalObj.functions.setProperty(loginMainPanel, { visible: false });
      globalObj.functions.setProperty(resultPanel, { visible: true });
      globalObj.functions.setProperty(resultPanel.errorResultPanel.errorMessageText, { value: response?.ExecuteInterfaceResponse?.APS_ERROR_DESC });
      globalObj.functions.setProperty(resultPanel.errorResultPanel, { visible: true });
      invokeJourneyDropOffUpdate('POST_EXECUTEINTERFACE_FAILURE', mobileNumber, leadProfileId, journeyId, globalObj);
    },
  };
  restAPICall('', 'POST', requestObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack);
};

export {
  executeInterface,
  executeInterfacePostRedirect,
};
