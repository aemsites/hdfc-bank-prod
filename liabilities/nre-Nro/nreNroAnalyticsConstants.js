/* eslint-disable linebreak-style */
const data = {
  'otp click': {
    linkType: 'button',
    StepName: 'Identify Yourself',
    linkPosition: 'Form',
  },
  'privacy consent click': {
    linkType: 'checkbox',
    StepName: 'Identify Yourself',
    linkPosition: 'Form',
  },
  'submit otp click': {
    linkType: 'button',
    StepName: 'OTP Verification',
    linkPosition: 'Form',
  },
  'resend otp click': {
    linkType: 'button',
    StepName: 'Resend OTP',
    linkPosition: 'Form',
  },
  'select account type click': {
    linkType: 'button',
    StepName: 'Select Account Type',
    linkPosition: 'Form',
  },
  'continue btn select account': {
    linkType: 'button',
    StepName: 'Select Account',
    linkPosition: 'Form',
  },
  'confirm details click': {
    linkType: 'button',
    StepName: 'Confirm Details',
    linkPosition: 'Form',
  },
  'idcom redirection check': {
    linkType: 'button',
    StepName: 'IDCOM Redirection',
    linkPosition: 'Form',
  },
  'submit otp': {
    error: 'NA',
  },
  'check offers': {
    linkType: 'button',
    linkName: 'Check Offers',
    linkPosition: 'Form',
  },
  'get this card': {
    linkType: 'button',
    linkName: 'Get this Card',
    linkPosition: 'Form',
  },
  'i agree': {
    linkType: 'button',
    linkName: 'I agree',
    linkPosition: 'Form',
  },
  'document upload continue': {
    linkType: 'button',
    linkName: 'I agree',
    linkPosition: 'Form',
  },
  'address continue': {
    linkType: 'button',
    linkName: 'Submit',
    linkPosition: 'Form',
  },
  'kyc continue': {
    linkType: 'button',
    linkName: 'Continue KYC',
    linkPosition: 'Form',
  },
  // 'aadhaar otp': {
  //   linkType: 'NA',
  //   linkName: 'NA',
  // },
  'start kyc': {
    linkType: 'button',
    linkName: 'Start KYC',
    linkPosition: 'Form',
  },
  'submit review': {
    linkType: 'button',
    linkName: 'Submit Feedback',
    linkPosition: 'Form',
  },
};
const ANALYTICS_CLICK_OBJECT = {
  page: {
    pageInfo: {
      pageName: 'NA',
      errorCode: 'NA',
      errorMessage: 'NA',
    },
  },
  user: {
    pseudoID: 'NA',
    journeyID: 'NA',
    journeyName: 'NA',
    journeyState: 'NA',
    casa: 'NA',
    gender: 'NA',
    email: 'NA',
  },
  form: {
    name: 'NA',
  },
  link: {
    linkName: 'NA',
    linkType: 'NA',
    linkPosition: 'NA',
  },
  assisted: {
    flag: 'NA',
    lg: 'NA',
    lc: 'NA',
  },
  event: {
    phone: 'NA',
    validationMethod: 'NA',
    status: 'NA',
    rating: 'NA',
  },
  formDetails: {
    employmentType: 'NA',
    companyName: 'NA',
    designation: 'NA',
    relationshipNumber: 'NA',
    pincode: 'NA',
    city: 'NA',
    state: 'NA',
    KYCVerificationMethod: 'NA',
    languageSelected: 'NA',
    reference: 'NA',
    isVideoKYC: 'NA',
    documentProof: 'NA',
    nomineeRelation: 'NA',
  },
  card: {
    selectedCard: 'NA',
    eligibleCard: 'NA',
    annualFee: 'NA',
  },
};

const ANALYTICS_PAGE_LOAD_OBJECT = {
  page: {
    pageInfo: {
      pageName: 'NA',
      errorCode: 'NA',
      errorMessage: 'NA',
    },
  },
  user: {
    pseudoID: 'NA',
    journeyID: 'NA',
    journeyName: 'NA',
    journeyState: 'NA',
    casa: 'NA',
    aan: 'NA',
  },
  form: {
    name: 'NA',
  },
  formDetails: {
    city: 'NA',
    state: 'NA',
    pincode: 'NA',
    nationality: 'NA',
    countryTaxResidence: 'NA',
    countryofBirth: 'NA',
    nomineeRelation: 'NA',
    companyName: 'NA',
    AnnualIncome: 'NA',
    currency: 'NA',
    residenceType: 'NA',
    sourceoffunds: 'NA',
    selfemployeddate: 'NA',
    natureofbusiness: 'NA',
    typeofcompany: 'NA',
    typeofprofessional: 'NA',
    bankBranch: 'NA',
    existingAccountType: 'NA',
  },
};

const PAGE_NAME = {
  ccc: {
    'otp click': 'Identify Yourself',
    'confirm otp': 'Verify with OTP',
    'check offers': 'Customer Details',
    'get this card': 'Choose Card',
    'kyc continue': 'Select KYC',
    'i agree': 'Select KYC - Aadhaar Pop-Up',
    'document upload continue': 'Document Upload',
    'address continue': 'Address Details',
    'aadhaar otp': 'Select KYC - Aadhaar OTP verification',
    'start kyc': 'Confirmation',
    'submit review': 'Confirmation',
    'thank you screen': 'Confirmation',
  },
  nrenro: {
    'otp click': 'Step 1 : Identify Yourself',
    'confirm otp': 'Step 2 : Verify with OTP',
    'select account': 'Step 3 : Select  Account',
    'select account type': 'Step 3 : Account Type',
    'confirm details': 'Step 4 : Confirm Details',
    'check offers': 'Customer Details',
    'get this card': 'Choose Card',
    'kyc continue': 'Select KYC',
    'i agree': 'Select KYC - Aadhaar Pop-Up',
    'document upload continue': 'Document Upload',
    'address continue': 'Address Details',
    'aadhaar otp': 'Select KYC - Aadhaar OTP verification',
    'start kyc': 'Confirmation',
    'submit review': 'Confirmation',
    'thank you screen': 'Confirmation',
  },
};
export {
  data,
  ANALYTICS_CLICK_OBJECT,
  ANALYTICS_PAGE_LOAD_OBJECT,
  PAGE_NAME,
};