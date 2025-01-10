const ANALYTICS_EVENT_NAME = {
  'page load': 'page load',
  'otp click': 'otp click',
  'submit otp': 'submit otp',
  'resend otp': 'resend otp',
  'transaction view': 'transaction view',
  'tenure page': 'tenure page',
  'confirm tenure': 'confirm tenure',
  'resendOtp confirmTenure': 'resendOtp confirmTenure',
  'submit review': 'submit review',
};

const ANALYTICS_JOURNEY_STATE = {
  'page load': 'CUSTOMER_IDENTITY_ACQUIRED',
  'otp click': 'CUSTOMER_IDENTITY_RESOLVED',
  'submit otp': 'CUSTOMER_LEAD_QUALIFIED',
  'resend otp': 'CUSTOMER_RESEND_OTP',
  'transaction view': 'CUSTOMER_TXN_SELECTED',
  'tenure page': 'CUSTOMER_PREEXECUTION_SUCCESS',
  'confirm tenure': 'CUSTOMER_ONBOARDING_COMPLETE',
  'resendOtp confirmTenure': 'RESEND_OTP_CUSTOMER_ONBOARDING',
  'thank you': 'CUSTOMER_ONBOARDING_COMPLETE',
  'submit review': 'CUSTOMER_FEEDBACK_SUBMITTED',
};

const ANALYTICS_PAGE_NAME = {
  'page load': 'Step 1 - Identify Yourself',
  'otp click': 'Step 1 - Identify Yourself',
  'submit otp': 'Step 2 - Verify with OTP',
  'resend otp': 'Step 2 - Verify with OTP',
  'transaction view': 'Step 3 - View Spends - Select Transactions',
  'tenure page': 'Step 3 - View Spends - Select Tenure',
  'confirm tenure': 'Step 4 - Confirm with OTP',
  'resendOtp confirmTenure': 'Step 4 - Confirm with OTP',
  'thank you': 'Step 5 - Confirmation',
  'submit review': 'Step 5 - Confirmation',
  'Error Page': 'Error Page',
};

const ANALYTICS_LINK_BTN = {
  'otp click': {
    linkType: 'button',
    linkName: 'Get OTP',
    StepName: 'Step 1 - Identify Yourself',
    linkPosition: 'Form',
    pageName: ANALYTICS_PAGE_NAME['otp click'],
  },
  'submit otp': { // otp1 typing
    linkType: 'button',
    linkName: 'Submit OTP',
    StepName: 'Step 2 - Verify with OTP',
    linkPosition: 'Form',
    pageName: ANALYTICS_PAGE_NAME['submit otp'],
  },
  'resend otp': { // resendotp1 typing
    linkType: 'button',
    linkName: 'Resend OTP',
    StepName: 'Step 2 - Verify with OTP',
    linkPosition: 'Form',
    pageName: ANALYTICS_PAGE_NAME['resend otp'],
  },
  'transaction view': { // continue on transaction scrren
    linkType: 'button',
    linkName: 'View EMI Amount',
    StepName: 'Step 3 - View Spends - Select Transactions',
    linkPosition: 'Form',
    pageName: ANALYTICS_PAGE_NAME['transaction view'],
  },
  'tenure page': { // preExecution ok
    linkType: 'button',
    linkName: 'Confirm',
    StepName: 'Step 3 - View Spends - Select Tenure',
    linkPosition: 'Form',
    pageName: ANALYTICS_PAGE_NAME['tenure page'],
  },
  'confirm tenure': { // otp2
    linkType: 'button',
    linkName: 'Authenticate',
    StepName: 'Step 4 - Confirm with OTP',
    linkPosition: 'Form',
    pageName: ANALYTICS_PAGE_NAME['confirm tenure'],
  },
  'resendOtp confirmTenure': { // resendotp2 typing
    linkType: 'button',
    linkName: 'Resend OTP',
    StepName: 'Step 4 - Confirm with OTP',
    linkPosition: 'Form',
    pageName: ANALYTICS_PAGE_NAME['confirm tenure'],
  },
  'submit review': {
    linkType: 'button',
    linkName: 'Submit',
    StepName: 'Step 5 - Confirmation',
    linkPosition: 'Form',
    pageName: ANALYTICS_PAGE_NAME['thank you'],
  },
};

const ANALYTICS_OBJECT_SEMI = {
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
};

const ANALYTICS_PAGE_LOAD_OBJECT_SEMI = {
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
  },
  form: {
    name: '',
  },
};

export {
  ANALYTICS_LINK_BTN,
  ANALYTICS_PAGE_NAME,
  ANALYTICS_JOURNEY_STATE,
  ANALYTICS_EVENT_NAME,
  ANALYTICS_OBJECT_SEMI,
  ANALYTICS_PAGE_LOAD_OBJECT_SEMI,
};
