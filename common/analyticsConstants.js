const data = {
  'otp click': {
    linkType: 'button',
    StepName: 'Identify Yourself',
    linkPosition: 'Form',
  },
  'confirm otp': {
    linkType: 'button',
    StepName: 'Verify With OTP',
    linkPosition: 'Form',
  },
  'submit otp': {
    error: '',
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
  //   linkType: '',
  //   linkName: '',
  // },
  'start kyc': {
    linkType: 'button',
    linkName: 'Start VKYC',
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
      pageName: '',
      errorCode: '',
      errorMessage: '',
    },
  },
  user: {
    pseudoID: '',
    journeyID: '',
    journeyName: '',
    journeyState: '',
    casa: '',
    gender: '',
    email: '',
  },
  form: {
    name: '',
  },
  link: {
    linkName: '',
    linkType: '',
    linkPosition: '',
  },
  event: {
    phone: '',
    validationMethod: '',
    status: '',
    rating: '',
  },
  formDetails: {
    employmentType: '',
    companyName: '',
    designation: '',
    relationshipNumber: '',
    pincode: '',
    city: '',
    state: '',
    KYCVerificationMethod: '',
    languageSelected: '',
    reference: '',
    isVideoKYC: '',
    documentProof: '',
    nomineeRelation: '',
  },
  card: {
    selectedCard: '',
    eligibleCard: '',
    annualFee: '',
  },
};

const ANALYTICS_PAGE_LOAD_OBJECT = {
  page: {
    pageInfo: {
      pageName: '',
      errorCode: '',
      errorMessage: '',
    },
  },
  card: {
    selectedCard: '',
    eligibleCard: '',
  },
  user: {
    pseudoID: '',
    journeyID: '',
    journeyName: '',
    journeyState: '',
    casa: '',
  },
  form: {
    name: '',
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
};
export {
  data,
  ANALYTICS_CLICK_OBJECT,
  ANALYTICS_PAGE_LOAD_OBJECT,
  PAGE_NAME,
};
