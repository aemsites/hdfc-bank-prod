/* eslint-disable no-console */
import {
  urlPath,
  moveWizardView,
  formUtil,
  composeNameOption,
  setSelectOptions,
  removeSpecialCharacters,
  parseCustomerAddress,
} from '../../common/formutils.js';
import { invokeJourneyDropOffUpdate } from './journey-utils.js';
import {
  restAPICall,
  fetchJsonResponse,
  fetchIPAResponse,
  hideLoaderGif,
} from '../../common/makeRestAPI.js';
import finalDap from './finaldaputils.js';
import {
  ENDPOINTS as endpoints,
  BASEURL as baseUrl,
  CURRENT_FORM_CONTEXT as currentFormContext,
  FORM_RUNTIME as formRuntime,
} from '../../common/constants.js';
import { NAME_ON_CARD_MAX_LENGTH } from './constant.js';

import { sendAnalytics } from './analytics.js';

const GENDER_MAP = {
  M: '1',
  F: '2',
  O: '3',
  1: '1',
  2: '2',
  3: '3',
  Male: '1',
  Female: '2',
  Other: '3',
  T: '3',
};
const formatDate = (inputDate) => {
  const date = new Date(inputDate);

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' }).substring(0, 3);
  const year = date.getFullYear();

  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
};

/**
 * Creates an Execute Interface request object based on the provided global data.
 * @param {Object} globals - The global object containing necessary data for ExecuteInterface request.
 * @returns {Object} - The ExecuteInterface request object.
 */
const createExecuteInterfaceRequestObj = (globals) => {
  const { breDemogResponse } = currentFormContext;
  const {
    personalDetails,
    currentDetails,
    employmentDetails,
  } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage;
  const { prefilledEmploymentDetails } = employmentDetails;
  const fullName = !personalDetails.middleName.$value ? `${personalDetails.firstName.$value} ${personalDetails.lastName.$value}` : `${personalDetails.firstName.$value} ${personalDetails.middleName.$value} ${personalDetails.lastName.$value}`;
  let addressEditFlag = 'N';
  let panEditFlag = 'N';
  const panNumber = personalDetails.panNumberPersonalDetails.$value;
  let nameEditFlag = 'N';
  const currentAddress = {
    address1: '',
    address2: '',
    address3: '',
    city: '',
    pincode: '',
    state: '',
  };

  const formData = globals.functions.exportData().form;
  const compNameRelNum = { // companyName + companyRelationshipNumber
    // '4THLINE': formData?.companyName,
    CCAD_Relationship_number: formData?.relationshipNumber,
  };

  let permanentAddress = { ...currentAddress };
  if (currentFormContext.journeyType === 'ETB') {
    if (breDemogResponse?.VDCUSTITNBR !== panNumber) {
      panEditFlag = 'Y';
    }
    if (breDemogResponse.VDCUSTFULLNAME !== fullName) {
      nameEditFlag = 'Y';
    }
    const customerFiller2 = breDemogResponse?.BREFILLER2?.toUpperCase();
    if (currentDetails.currentAddressETB.currentAddressToggle.$value === 'on') {
      addressEditFlag = 'Y';
      const { newCurentAddressPanel } = currentDetails.currentAddressETB;
      currentAddress.address1 = newCurentAddressPanel.newCurentAddressLine1.$value;
      currentAddress.address2 = newCurentAddressPanel.newCurentAddressLine2.$value;
      currentAddress.address3 = newCurentAddressPanel.newCurentAddressLine3.$value;
      currentAddress.city = newCurentAddressPanel.newCurentAddressCity.$value;
      currentAddress.pincode = newCurentAddressPanel.newCurentAddressPin.$value;
      currentAddress.state = newCurentAddressPanel.newCurentAddressState.$value;
    } else if (customerFiller2 === 'D106') {
      const ALLOWED_CHARACTERS = '/-, ';
      if (!currentFormContext.customerParsedAddress) {
        const fullAddress = [removeSpecialCharacters(breDemogResponse?.VDCUSTADD1, ALLOWED_CHARACTERS), removeSpecialCharacters(breDemogResponse?.VDCUSTADD2, ALLOWED_CHARACTERS), removeSpecialCharacters(breDemogResponse?.VDCUSTADD3, ALLOWED_CHARACTERS),
        ]
          .filter(Boolean)
          .join(''); currentFormContext.customerParsedAddress = parseCustomerAddress(fullAddress);
      }
      [currentAddress.address1, currentAddress.address2, currentAddress.address3] = currentFormContext.customerParsedAddress;
      currentAddress.city = breDemogResponse.VDCUSTCITY;
      currentAddress.pincode = breDemogResponse.VDCUSTZIPCODE;
      currentAddress.state = breDemogResponse.VDCUSTSTATE;
    } else {
      currentAddress.address1 = breDemogResponse?.VDCUSTADD1;
      currentAddress.address2 = breDemogResponse?.VDCUSTADD2;
      currentAddress.address3 = breDemogResponse?.VDCUSTADD3;
      currentAddress.city = breDemogResponse.VDCUSTCITY;
      currentAddress.pincode = breDemogResponse.VDCUSTZIPCODE;
      currentAddress.state = breDemogResponse.VDCUSTSTATE;
    }

    permanentAddress = { ...currentAddress };
  } else {
    panEditFlag = 'Y';
    nameEditFlag = 'Y';
    addressEditFlag = 'Y';
    const { currentAddressNTB } = currentDetails;
    const { permanentAddressPanel } = currentAddressNTB.permanentAddress;
    currentAddress.address1 = currentAddressNTB.addressLine1.$value;
    currentAddress.address2 = currentAddressNTB.addressLine2.$value;
    currentAddress.address3 = currentAddressNTB.addressLine3.$value;
    currentAddress.city = currentAddressNTB.city.$value;
    currentAddress.pincode = currentAddressNTB.currentAddresPincodeNTB.$value;
    currentAddress.state = currentAddressNTB.state.$value;
    if (currentAddressNTB.permanentAddress.permanentAddressToggle.$value === 'on') {
      permanentAddress = { ...currentAddress };
    } else {
      permanentAddress.address1 = permanentAddressPanel.permanentAddressLine1.$value;
      permanentAddress.address2 = permanentAddressPanel.permanentAddressLine2.$value;
      permanentAddress.address3 = permanentAddressPanel.permanentAddressLine3.$value;
      permanentAddress.city = permanentAddressPanel.permanentAddressCity.$value;
      permanentAddress.pincode = permanentAddressPanel.permanentAddressPincode.$value;
      permanentAddress.state = permanentAddressPanel.permanentAddressState.$value;
    }
  }
  formRuntime.isAddressChanged = addressEditFlag === 'Y';
  const requestObj = {
    requestString: {
      bankEmployee: 'N',
      mobileNumber: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
      fullName,
      panCheckFlag: 'Y',
      perAddressType: '2',
      personalEmailId: personalDetails.personalEmailAddress.$value,
      selfConfirmation: 'Y',
      addressEditFlag,
      communicationAddress1: currentAddress.address1,
      communicationAddress2: currentAddress.address2,
      communicationCity: currentAddress.city,
      dateOfBirth: formatDate(personalDetails.dobPersonalDetails.$value),
      firstName: personalDetails.firstName.$value,
      lastName: personalDetails.lastName.$value,
      gender: GENDER_MAP[personalDetails.gender.$value],
      occupation: '1',
      officialEmailId: prefilledEmploymentDetails.workEmailAddress.$value,
      panEditFlag,
      panNumber,
      permanentAddress1: permanentAddress.address1,
      permanentAddress2: permanentAddress.address2,
      permanentCity: permanentAddress.city,
      permanentZipCode: String(permanentAddress.pincode),
      eReferenceNumber: breDemogResponse?.BREFILLER3 || currentFormContext.referenceNumber,
      nameEditFlag,
      mobileEditFlag: currentFormContext.journeyType === 'ETB' ? 'N' : 'Y',
      resPhoneEditFlag: 'N',
      comAddressType: '2',
      comCityZip: String(currentAddress.pincode),
      customerID: currentFormContext.journeyType === 'ETB' ? breDemogResponse.FWCUSTID : '',
      timeInfo: new Date().toISOString(),
      Id_token_jwt: currentFormContext.jwtToken,
      communicationAddress3: currentAddress.address3,
      permanentAddress3: permanentAddress.address3,
      officeAddress1: employmentDetails.officeAddressLine1.$value,
      officeAddress2: employmentDetails.officeAddressLine2.$value,
      officeAddress3: employmentDetails.officeAddressLine3.$value,
      officeCity: employmentDetails.officeAddressCity.$value,
      officeZipCode: employmentDetails.officeAddressPincode.$value,
      officeState: employmentDetails.officeAddressState.$value,
      productCode: currentFormContext?.crmLeadResponse?.productCode,
      leadClosures: globals.functions.exportData()?.form?.leadClosures || globals.functions.exportData()?.currentFormContext?.crmLeadResponse?.leadClosures || currentFormContext?.crmLeadResponse?.leadClosures,
      leadGenerater: globals.functions.exportData()?.form?.leadGenerator || globals.functions.exportData()?.currentFormContext?.crmLeadResponse?.leadGenerator || currentFormContext?.crmLeadResponse?.leadGenerator,
      applyingBranch: 'N',
      smCode: '',
      dseCode: '',
      lc2: globals.functions.exportData()?.form?.lc2 || globals.functions.exportData()?.currentFormContext?.crmLeadResponse?.lc2 || currentFormContext?.crmLeadResponse?.lc2,
      filler6: '',
      branchName: '',
      branchCity: '',
      companyName: prefilledEmploymentDetails.companyName.$value,
      departmentOrEmpCode: prefilledEmploymentDetails.employeeCode.$value,
      designation: prefilledEmploymentDetails.designation.$value,
      middleName: personalDetails.middleName.$value,
      perfiosTxnID: '',
      monthlyincome: '',
      annualItr: '',
      permanentState: permanentAddress.state,
      communicationState: currentAddress.state,
      authMode: '',
      userAgent: navigator.userAgent,
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      nameOnCard: fullName.length > 19 ? '' : fullName?.toUpperCase(),
      dsaValue: '',
      cardsData: '',
      channelSource: '',
      isManualFlow: 'false',
      channel: '',
      apsDobEditFlag: 'N',
      apsEmailEditFlag: 'N',
      journeyFlag: currentFormContext.journeyType,
      annualIncomeOrItrAmount: '100000',
      comResidenceType: '2',
      ...compNameRelNum,
      mobileMatch: '',
    },
  };
  return requestObj;
};

/**
 * create a list of name to be dispayed on card dropdown in confirm card screen.
 * @param {object} globals - globals variables object containing form configurations.
 */
const listNameOnCard = (globals) => {
  const elementNameSelect = 'nameOnCardDropdown';
  const { personalDetails } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage;
  const firstName = personalDetails.firstName.$value;
  const middleName = personalDetails.middleName.$value;
  const lastName = personalDetails.lastName.$value;
  const dropDownSelectField = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.CorporatetImageAndNamePanel.nameOnCardDropdown;
  const options = composeNameOption(firstName, middleName, lastName, 'ccc', NAME_ON_CARD_MAX_LENGTH);
  const initialValue = options[0]?.value;
  setSelectOptions(options, elementNameSelect);
  const setDropdownField = formUtil(globals, dropDownSelectField);
  setDropdownField.setEnum(options, initialValue); // setting initial value
  moveWizardView('corporateCardWizardView', 'confirmCardPanel');
  invokeJourneyDropOffUpdate(
    'CUSTOMER_BUREAU_OFFER_AVAILABLE',
    globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
    globals.form.runtime.leadProifileId.$value,
    globals.form.runtime.journeyId.$value,
    globals,
  );
};

/**
 * @name executeInterfaceApiFinal
 * @param {Object} globals - The global object containing necessary data for the request.
 * @returns {PROMISE}
 */
const executeInterfaceApiFinal = (globals) => {
  const formCallBackContext = globals.functions.exportData()?.currentFormContext;
  const requestObj = currentFormContext.executeInterfaceReqObj || formCallBackContext?.executeInterfaceReqObj;
  requestObj.requestString.nameOnCard = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.CorporatetImageAndNamePanel.nameOnCardDropdown.$value?.toUpperCase();
  requestObj.requestString.productCode = formRuntime.productCode || formCallBackContext?.formRuntime?.productCode || formCallBackContext?.crmLeadResponse?.productCode || currentFormContext?.crmLeadResponse?.productCode;
  const apiEndPoint = urlPath(endpoints.executeInterface);
  formRuntime?.getOtpLoader();
  return fetchJsonResponse(apiEndPoint, requestObj, 'POST', true);
};

/**
 * @name executeInterfaceResponseHandler
 * @param {object} resPayload

 * @param {object} globals
 */
const executeInterfaceResponseHandler = (resPayload, globals) => {
  currentFormContext.executeInterfaceResPayload = resPayload;
  sendAnalytics('get this card', resPayload, 'CUSTOMER_CARD_SELECTED', globals);
};

/**
 * @name executeInterfaceApi
 * @param {boolean} showLoader
 * @param {boolean} hideLoader
 * @param {object} globals
 * @return {PROMISE}
 */
const executeInterfaceApi = (showLoader, hideLoader, globals) => {
  const executeInterfaceRequest = createExecuteInterfaceRequestObj(globals);
  currentFormContext.executeInterfaceReqObj = { ...executeInterfaceRequest };
  const apiEndPoint = urlPath(endpoints.executeInterface);
  if (showLoader) formRuntime.executeInterface();
  return fetchJsonResponse(apiEndPoint, executeInterfaceRequest, 'POST', hideLoader);
};

/**
 * @name ipaRequestApi ipaRequestApi
 * @param {string} eRefNumber
 * @param {string} mobileNumber
 * @param {string} applicationRefNumber
 * @param {string} idTokenJwt
 * @param {string} ipaDuration
 * @param {string} ipaTimer
 * @param {boolean} showLoader
 * @param {boolean} hideLoader
 * @return {PROMISE}
 */
const ipaRequestApi = (eRefNumber, mobileNumber, applicationRefNumber, idTokenJwt, ipaDuration, ipaTimer, showLoader, hideLoader) => {
  currentFormContext.jwtToken = idTokenJwt;
  const ipaRequestObj = {
    requestString: {
      mobileNumber,
      applRefNumber: applicationRefNumber,
      eRefNumber,
      Id_token_jwt: idTokenJwt,
      userAgent: navigator.userAgent,
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      productCode: formRuntime.productCode || currentFormContext.crmLeadResponse.productCode,
    },
  };
  const apiEndPoint = urlPath(endpoints.ipa);
  if (showLoader) formRuntime?.ipa.dispalyLoader();
  return fetchIPAResponse(apiEndPoint, ipaRequestObj, 'POST', ipaDuration, ipaTimer, hideLoader);
};

/**
 * Handles the successful response for IPA.
 *
 * @param {Object} ipa - The ipa prop in response object.
 * @param {Object} productEligibility - The product eligibility prop in response object.
 * @param {Object} globals - The global context object containing form and view configurations.
 */
const ipaSuccessHandler = (ipa, productEligibility, globals) => {
  const { productDetails } = productEligibility;
  const [firstProductDetail] = productDetails;
  if (firstProductDetail) {
    currentFormContext.productCode = firstProductDetail?.cardProductCode;
  } else {
    currentFormContext.productCode = globals.functions.exportData().form.productCode;
  }
  currentFormContext.eRefNumber = ipa?.eRefNumber;
  currentFormContext.applRefNumber = ipa?.applRefNumber;
  formRuntime.filler8 = ipa?.filler8;

  const imageEl = document.querySelector('.field-cardimage > picture');
  const imagePath = `${baseUrl}${firstProductDetail?.cardTypePath}?width=2000&optimize=medium`;

  imageEl.childNodes[5].setAttribute('src', imagePath);
  imageEl.childNodes[3].setAttribute('srcset', imagePath);
  imageEl.childNodes[1].setAttribute('srcset', imagePath);

  const benefitsPanel = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.cardBenefitsFeaturesPanel;

  ['keyBenefitsText0', 'keyBenefitsText1', 'keyBenefitsText2'].forEach((key, index) => {
    const benefitsTextField = formUtil(globals, benefitsPanel[key]);
    benefitsTextField.setValue(firstProductDetail?.keyBenefits[index]);
  });

  const cardNameTitle = formUtil(globals, globals.form.corporateCardWizardView.confirmCardPanel.cardNameTitle);
  if (firstProductDetail?.product) {
    cardNameTitle.setValue(firstProductDetail?.product);
  }
  if (firstProductDetail?.features) {
    const cardFeature = formUtil(globals, globals.form.corporateCardWizardView.confirmCardPanel.viewAllCardBenefitsPanel.cardBenefitsText);
    const mapPTag = firstProductDetail?.features?.map((el) => `<p class='popuptext-resp'>&bull; ${el}</p>`)?.join(' ');
    cardFeature.setValue(mapPTag);
  }

  if (currentFormContext.executeInterfaceReqObj.requestString.addressEditFlag === 'N') {
    const { selectKycPanel } = globals.form.corporateCardWizardView;
    const selectKycPanelUtil = formUtil(globals, selectKycPanel);
    selectKycPanelUtil.visible(false);
  }
  hideLoaderGif();
  listNameOnCard(globals);
};

/**
 * comAddressType param for executeInterface
 * Returns '1' for office address and '2' for current address.
 * @param {Object} globals - The global context object containing form and view configurations.
 * @returns {string} - '1' if the office address is selected, otherwise '2'.
 */
const comAddressType = (globals, userRedirected) => {
  const formData = globals?.functions?.exportData()?.form;
  const radioBtnValues = globals?.functions?.exportData()?.currentFormContext?.radioBtnValues;

  /* ovd (ETB + NTB) & ETB address no change cases the radioBtnValues.cardDeliveryAdress options expression otherwise deliveryPanelAddress */
  const { selectKYCMethodOption1: { aadharEKYCVerification }, selectKYCMethodOption2: { aadharBiometricVerification }, selectKYCMethodOption3: { officiallyValidDocumentsMethod } } = globals.form.corporateCardWizardView.selectKycPanel.selectKYCOptionsPanel;
  const cardDeliveryAddressCase1 = {
    cardDeliveryAddressOption1: globals.form.corporateCardWizardView.confirmAndSubmitPanel.addressDeclarationPanel.addressDeclarationOVD.currentAddressOVD.currentAddressOVDOption.$value,
    cardDeliveryAddressOption2: globals.form.corporateCardWizardView.confirmAndSubmitPanel.addressDeclarationPanel.addressDeclarationOVD.officeAddressOVD.officeAddressOVDOption.$value,
  };

  const cardDeliveryAddressCase2 = {
    cardDeliveryAddressOption1: globals.form.corporateCardWizardView.confirmAndSubmitPanel.addressDeclarationPanel.cardDeliveryAddressPanel.cardDeliveryAddressOption1.$value,
    cardDeliveryAddressOption2: globals.form.corporateCardWizardView.confirmAndSubmitPanel.addressDeclarationPanel.cardDeliveryAddressPanel.cardDeliveryAddressOption2.$value,
  };
  const formContextCallbackData = globals.functions.exportData()?.currentFormContext || currentFormContext;
  const journeyType = formContextCallbackData?.executeInterfaceReqObj?.requestString?.journeyFlag;
  const biometricStatus = ((aadharBiometricVerification.$value || formData.aadharBiometricVerification) && 'bioKyc') || ((aadharEKYCVerification.$value || formData.aadharEKYCVerification) && 'aadhaar') || ((officiallyValidDocumentsMethod.$value || formData.officiallyValidDocumentsMethod) && 'OVD');
  const etbAddressChange = formContextCallbackData?.executeInterfaceReqObj?.requestString?.addressEditFlag;
  const ovdNtbEtbAddressNoChange = ((journeyType === 'ETB') && etbAddressChange === 'N') || ((journeyType === 'ETB') && biometricStatus === 'OVD') || ((journeyType === 'NTB' && biometricStatus === 'OVD'));
  const deliveryPanelAddress = ovdNtbEtbAddressNoChange ? cardDeliveryAddressCase1 : cardDeliveryAddressCase2;

  const cardDelivery = {
    current: userRedirected ? radioBtnValues?.deliveryAddress?.cardDeliveryAddressOption1 : deliveryPanelAddress?.cardDeliveryAddressOption1,
    office: userRedirected ? radioBtnValues?.deliveryAddress?.cardDeliveryAddressOption2 : deliveryPanelAddress?.cardDeliveryAddressOption2,
  };
  return cardDelivery?.office ? '1' : '2';
};

const addressDeclrFlag = (globals, executeInterfaceReqObj) => {
  const addressEditFlag = (executeInterfaceReqObj?.requestString?.addressEditFlag === 'Y');
  const currentAddessToggle = (globals.form.corporateCardWizardView.confirmAndSubmitPanel.addressDeclarationPanel.AddressDeclarationAadhar.currentAddressToggleConfirmpage.$value === '1'); // check radio btn - 'yes'
  const currentAddresCheck = (globals.form.corporateCardWizardView.confirmAndSubmitPanel.addressDeclarationPanel.CurrentAddressDeclaration.currentResidenceAddressDeclaration.$value === 'on'); // declerationCheck
  return (addressEditFlag && currentAddessToggle && currentAddresCheck) ? 'Y' : 'N';
};

/**
 * Executes an interface post request with the appropriate authentication mode based on the response.
 *
 * @param {object} source - The source object (unused in the current implementation).
 * @param {object} globals - An object containing global variables and functions.
 */
const executeInterfacePostRedirect = async (source, userRedirected, globals) => {
  const formCallBackContext = globals.functions.exportData()?.currentFormContext;
  const requestObj = currentFormContext.executeInterfaceReqObj || formCallBackContext?.executeInterfaceReqObj;
  if (source === 'idCom') {
    const mobileMatch = globals.functions.exportData()?.aadhaar_otp_val_data?.result?.mobileValid === 'y';
    if (mobileMatch) {
      requestObj.requestString.authMode = 'EKYCIDCOM';
      requestObj.requestString.mobileMatch = 'Y';
    } else {
      requestObj.requestString.authMode = 'IDCOM';
      requestObj.requestString.mobileMatch = 'N';
    }
  }
  const { selectKYCMethodOption1: { aadharEKYCVerification }, selectKYCMethodOption2: { aadharBiometricVerification }, selectKYCMethodOption3: { officiallyValidDocumentsMethod } } = globals.form.corporateCardWizardView.selectKycPanel.selectKYCOptionsPanel;
  const formData = globals.functions.exportData();
  const radioBtnValues = globals.functions.exportData()?.currentFormContext?.radioBtnValues;
  // eslint-disable-next-line no-unused-vars
  const kycFill = {
    KYC_STATUS:
        ((aadharEKYCVerification.$value || formData?.form?.aadharEKYCVerification || radioBtnValues?.kycMethod?.aadharEKYCVerification) && 'aadhaar')
        || ((aadharBiometricVerification.$value || formData?.form?.aadharBiometricVerification || radioBtnValues?.kycMethod?.aadharBiometricVerification) && 'bioKYC')
        || ((officiallyValidDocumentsMethod.$value || formData?.form?.officiallyValidDocumentsMethod || radioBtnValues?.kycMethod?.officiallyValidDocumentsMethod) && 'OVD')
        || null,
  };
  if ((source === 'NO_IDCOM_REDIRECTION')) {
    requestObj.requestString.authMode = 'OTP';
  }
  requestObj.requestString.comAddressType = comAddressType(globals, userRedirected); // set com address type
  requestObj.requestString.AddrDeclarationFlag = addressDeclrFlag(globals, requestObj); // path variable set
  const apiEndPoint = urlPath(endpoints.executeInterface);
  const eventHandlers = {
    successCallBack: (response) => {
      if (response?.errorCode === '0000') {
        currentFormContext.jwtToken = response.Id_token_jwt;
        finalDap(userRedirected, globals);
      } else {
        const formContextCallbackData = globals.functions.exportData()?.currentFormContext;
        const mobileNumber = globals.functions.exportData().form.login.registeredMobileNumber;
        const leadProfileId = globals.functions.exportData().leadProifileId;
        const journeyId = formContextCallbackData.journeyID;
        invokeJourneyDropOffUpdate('POST_EXECUTEINTERFACE_FAILURE', mobileNumber, leadProfileId, journeyId, globals);
      }
    },
    errorCallBack: (response) => {
      console.error(response);
    },
  };
  restAPICall('', 'POST', requestObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack);
};

export {
  executeInterfaceApiFinal,
  executeInterfaceApi,
  ipaRequestApi,
  ipaSuccessHandler,
  executeInterfacePostRedirect,
  executeInterfaceResponseHandler,
};
