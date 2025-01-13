// declare CONSTANTS for (fd) fd only.

const JOURNEY_NAME = 'EXISTING_CC_BASED_FDLIEN_JOURNEY';

const AGE_LIMIT = {
  min: 18,
  max: 80,
};

// const REGEX_PAN = /^[a-zA-Z]{3}[Pp][a-zA-Z][0-9]{4}[a-zA-Z]{1}/g;
const REGEX_PAN = /^[A-Za-z]{5}\d{4}[A-Za-z]$/g; // matches Pan regex without considering the 'p' char in P

const ERROR_MSG = {
  panLabel: 'PAN',
  dobLabel: 'DOB',
  panError: 'Please enter a valid PAN Number',
  mobileError: 'Enter valid mobile number',
  ageLimit: `Age should be between ${AGE_LIMIT.min} to ${AGE_LIMIT.max}`,
  invalidPan: 'Maximum PAN retry attempts exceeded.',
  matchingAddressLine: 'Address Line 1 and Address Line 2 cannot be same',
  invalidAddress: 'Please enter a valid address, allowed special characters(.,/-)',
  tooShortAddress: 'Address is too short(minimum 10 characters)',
  tooLongAddress: 'Address is too long(maximum 30 characters)',
  shortAddressNote: 'Note: Address is too short, please enter valid address.',
  invalidPinNote: 'Note: Pincode is not matching with the city in address as per the bank records, please provide correct address.',
  sessionExpired: 'Session expired',
  idcomCancelledByUser: 'Sorry Authentication Failed! You can retry with Debit Card / Net Banking authentication.',
  sessionExpiredDescription: 'Oops! your session expired due to inactivity. Please do not refresh the page and try again.',
  branchVisitWithRefNum: 'Visit your nearest dealership or HDFC Bank branch with reference number:',
  aadhaarMaxOtpAttemptsTitle: 'OTP Attempt Limit Reached',
  aadhaarMaxOtpAttempts: 'You have exceeded the maximum number of OTP attempts.',
  aadhaarMaxOtpAttemptsStatusCode: '35',
  aadhaarTimeoutTitle: 'Aadhaar eKYC Unavailable Due to Technical Issues',
  aadhaarTimeout: 'Sorry, we are unable to proceed with Aadhaar EKYC due to technical issues.',
  requestNotProcessed: 'Your request could not be processed, please try again to continue.',
  pleaseRetry: 'Please retry.',
  forceApplicationSubmit: 'You have exhausted all attempts(3) to verify your details. Our bank representative will reach out to you shortly for completing the application.',
};

const FD_ENDPOINTS = {
  otpGen: '/content/hdfc_hafcards/api/customeridentificationotpgen.json',
  otpVal: '/content/hdfc_hafcards/api/otpvalidationandcardsinquiry.json',
  journeyDropOff: '/content/hdfc_commonforms/api/journeydropoff.json',
  emailId: '/content/hdfc_commonforms/api/emailid.json',
  customeraccountdetailsdto: '/content/hdfc_hafcards/api/hdfccardscustomeraccountdetailsdto.json',
  masterchannel: 'https://applyonline.hdfcbank.com/content/hdfc_commonforms/api/mdm.CREDIT.CHANNEL_MASTER.CHANNELS.json',
  dsamaster: 'https://applyonline.hdfcbank.com/content/hdfc_commonforms/api/mdm.CREDIT.DSA_MASTER.DSA_CODE-',
  branchMaster: 'https://applyonline.hdfcbank.com/content/hdfc_ccforms/api/branchcode.',
  executeInterface: '/content/hdfc_hafcards/api/hdfccardsexecuteinterface.json',
  ipa: '/content/hdfc_hafcards/api/hdfccardsipa.json',
  hdfccardsgetrefidfdcc: '/content/hdfc_hafcards/api/hdfccardsgetrefidfdcc.json',
  hdfccardsgetfdeligibilitystatus: '/content/hdfc_hafcards/api/hdfccardsgetfdeligibilitystatus.json',
  hdfccardsexecutefinaldap: '/content/hdfc_hafcards/api/hdfccardsexecutefinaldap.json',
  documentupload: '/content/hdfc_hafcards/api/documentUpload.json',
};

const OTP_TIMER = 30;
const MODE = 'dev';
// const MODE = 'prod';
const MAX_OTP_RESEND_COUNT = 3;
const MAXIMUM_CREDIT_AMOUNT = 800000;
const NAME_ON_CARD_LENGTH = 19;
const MAX_ADDRESS_LENGTH = 90;
const MIN_ADDRESS_LENGTH = 30;
const MAX_FULLNAME_LENGTH = 30;
const MAX_ANNUAL_INCOME_LENGTH = 7;

const IDCOM = {
  productCode: 'CCPREISS',
  scope: {
    addressNotChanged: 'AACC_FDCC',
    addressChanged: 'ADOBE_FDCC',
  },
  response: {
    sessionExpired: {
      errorCode: '9997',
      errorMsg: 'Session expired',
    },
    idcomFail: {
      errorCode: '2001',
    },
    cancelledByUser: {
      errorCode: '9996',
      errorMsg: 'Authentication cancelled by user',
    },
  },
  maxRetry: 1,
};

const DOM_ELEMENT = {
  selectKyc: {
    aadharModalContent: 'aadharConsentPopup',
    modalBtnWrapper: 'button-wrapper',
    defaultLanguage: 'English',
  },
  identifyYourself: {
    dob: 'dateOfBirth',
  },
  personalDetails: {
    dob: 'dateOfBirthPersonalDetails',
  },
};

const ANALYTICS = {
  formName: 'Fixed Deposit Lien Credit Card',
  JOURNEY_NAME: 'FD_Lien_CC_Journey',
  event: {
    formLoad: {
      type: 'page load',
      name: 'Form Load',
      pageName: 'Step 1 - Identify Yourself',
      journeyState: 'JOURNEY_INITIATED',
    },
    getOtp: {
      type: 'click',
      name: 'getOTP',
      linkPosition: 'Form',
      pageName: 'Step 1 - Identify Yourself',
      journeyState: 'CUSTOMER_IDENTITY_RESOLVED',
      nextPage: 'submitOtp',
    },
    submitOtp: {
      type: 'click',
      name: 'submit otp',
      linkPosition: 'Form',
      pageName: 'Step 2 - Verify with OTP',
      journeyState: 'CUSTOMER_LEAD_QUALIFIED',
      nextPage: 'selectFd',
    },
    selectCustomerId: {
      type: 'click',
      name: 'Select Customer ID',
      linkPosition: 'Form',
      pageName: 'Select Customer ID',
      journeyState: 'CUSTOMER_ID_SELECTED',
      nextPage: 'selectFD',
    },
    selectFd: {
      type: 'click',
      name: 'Continue',
      linkPosition: 'Form',
      pageName: 'Step 3 - Select FD',
      journeyState: 'CUSTOMER_FD_SELECTED',
      nextPage: 'reviewDetails',
    },
    reviewDetailsBack: {
      type: 'click',
      name: 'Back',
      linkPosition: 'Form',
      pageName: 'Step 4 - Confirm your details',
      journeyState: 'CUSTOMER_FD_SELECTED',
      nextPage: 'selectFD',
    },
    reviewDetails: {
      type: 'click',
      name: 'Continue',
      linkPosition: 'Form',
      pageName: 'Step 4 - Confirm your details',
      journeyState: 'CUSTOMER_PANVALIDATION_SUCCESS',
      nextPage: 'selectCard',
    },
    selectCardBack: {
      type: 'click',
      name: 'Back',
      linkPosition: 'Form',
      pageName: 'Step 5 - Choose Card',
      journeyState: 'CUSTOMER_CARD_SELECTED',
      nextPage: 'validationMethodKYC',
    },
    selectCard: {
      type: 'click',
      name: 'Confirm',
      linkPosition: 'Form',
      pageName: 'Step 5 - Choose Card',
      journeyState: 'CUSTOMER_CARD_SELECTED',
      nextPage: 'validationMethodKYC',
    },
    selectCardConsent: {
      type: 'click',
      name: 'Terms & Conditions',
      linkPosition: 'Form',
      pageName: 'Step 5 - Choose Card',
      journeyState: 'CUSTOMER_CARD_SELECTED',
      nextPage: 'validationMethodKYC',
    },
    validationMethodKYC: {
      type: 'click',
      name: 'Proceed to Verify',
      linkPosition: 'Form',
      pageName: 'Step 6 - Validation Method - KYC Details',
      journeyState: 'CUSTOMER_KYC_SELECTED',
      nextPage: 'uploadDoc',
    },
    aadhaarKYCLangPopup: {
      type: 'click',
      name: 'aadhaar kyc language popup',
      linkPosition: 'Form',
      pageName: 'Aadhaar KYC Language Popup',
      journeyState: 'CUSTOMER_AADHAAR_SELECTED',
      nextPage: '',
    },
    addressDeclaration: {
      type: 'click',
      name: 'Proceed to Verify',
      linkPosition: 'Form',
      pageName: 'Address Details',
      journeyState: 'IDCOM_REDIRECTION_INITIATED',
      nextPage: 'docUpload',
    },
    docUpload: {
      type: 'click',
      name: 'Proceed to Verify',
      linkPosition: 'Form',
      pageName: 'Step 6 – Validation Method – Document Upload',
      journeyState: 'DOCUMENT_UPLOAD_CLICK',
      nextPage: '',
    },
    docUploadUpload: {
      type: 'click',
      name: 'Upload',
      linkPosition: 'Form',
      pageName: 'Step 6 – Validation Method – Document Upload',
      journeyState: 'DOCUMENT_UPLOAD_CLICK',
      nextPage: '',
    },
    confirmationPage: {
      type: 'click',
      name: 'Submit',
      linkPosition: 'Form',
      pageName: 'Confirmation',
      journeyState: 'CUSTOMER_FEEDBACK_SUBMITTED',
      nextPage: '',
    },
    comepleteVKYC: {
      type: 'click',
      name: 'Submit',
      linkPosition: 'Form',
      pageName: 'Confirmation',
      journeyState: 'CUSTOMER_FEEDBACK_SUBMITTED',
      nextPage: '',
    },
    copyRef: {
      type: 'click',
      name: 'Submit',
      linkPosition: 'Form',
      pageName: 'Confirmation',
      journeyState: 'CUSTOMER_FEEDBACK_SUBMITTED',
      nextPage: '',
    },
  },
};

const GENDER_MAP = {
  Male: '1', Female: '2', Others: '3', 'Third Gender': '3',
};
const OCCUPATION_MAP = {
  salaried: '1',
  'self employed': '2',
  student: '3',
  housewife: '4',
  retired: '5',
};
const ALLOWED_CHARACTERS = '/ -,';

const EMPLOYEE_MAP = {
  1: 'Employee',
  2: 'Proprietor',
  3: '',
  4: '',
  5: '',
};

const EMPLOYEE_SECTION_VISIBILITY = {
  'website download': ['branchCity', 'branchCode', 'branchName', 'cardsBdrLc1', 'tseLgCode', 'dsaCode', 'dsaName', 'lc1Code', 'lc2Code', 'lgCode', 'smCode'],
  branch: ['dsaCode', 'dsaName', 'lc1Code', 'lgCode'],
  dsa: ['branchCity', 'branchCode', 'branchName', 'tseLgCode', 'cardsBdrLc1'],
  default: ['branchCity', 'branchCode', 'branchName', 'cardsBdrLc1', 'tseLgCode', 'dsaCode', 'dsaName'],
};

const FD_JOURNEY_STATE = {
  resumeJourneyDataPrefilled: 'RESUME_JOURNEY_DATA_PREFILLED',
};

export {
  JOURNEY_NAME,
  ERROR_MSG,
  AGE_LIMIT,
  REGEX_PAN,
  OTP_TIMER,
  FD_ENDPOINTS,
  MAX_OTP_RESEND_COUNT,
  MODE,
  MAXIMUM_CREDIT_AMOUNT,
  NAME_ON_CARD_LENGTH,
  MAX_ADDRESS_LENGTH,
  MIN_ADDRESS_LENGTH,
  DOM_ELEMENT,
  IDCOM,
  ANALYTICS,
  GENDER_MAP,
  OCCUPATION_MAP,
  ALLOWED_CHARACTERS,
  EMPLOYEE_MAP,
  MAX_FULLNAME_LENGTH,
  EMPLOYEE_SECTION_VISIBILITY,
  FD_JOURNEY_STATE,
  MAX_ANNUAL_INCOME_LENGTH,
};
