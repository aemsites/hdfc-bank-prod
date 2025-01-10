import { getSubmitBaseUrl } from '../../blocks/form/constant.js';

const JOURNEY_NAME = 'SMART_EMI_JOURNEY';
const PRO_CODE = '009';
const ERROR_MSG = {
  mobileError: 'Enter valid mobile number',
  noEligibleTxnFlow: 'There are no eligible transactions on this card. Please try a different card.',
};

const FLOWS_ERROR_MESSAGES = {
  XFACE_INQ_VP_0003: 'Hey, it seems like you have entered incorrect details. Request you to check & re-enter your last 4 digits of the card.',
  XFACE_E2FA_02: 'Incorrect OTP code. Please try again.', // For this case error message is hardcoded in rule
  XFACE_E2FA_04: 'Oops! you have entered wrong otp too many times please try again later',
  1000: 'Sorry, this card is not eligible for SmartEMI. You may retry with a different credit card.',
};

const CHANNELS = {
  adobeWeb: 'ADOBE_WEB',
  adobeWhatsApp: 'ADOBE_WHATSAPP',
};

const BASE_URL = getSubmitBaseUrl();

const SEMI_ENDPOINTS = {
  otpGen: `${BASE_URL}/content/hdfc_ccforms/api/validatecardotpgen.json`,
  otpVal: (BASE_URL?.includes('dev')) ? `${'https://applyonlineuat01.hdfcbank.com'}/content/hdfc_hafcards/api/eligibilitycheck.json` : `${BASE_URL}/content/hdfc_hafcards/api/eligibilitycheck.json`,
  preexecution: `${BASE_URL}/content/hdfc_ccforms/api/preexecution.json`,
  masterChanel: `${BASE_URL}/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_CHANNEL_MASTER.json`,
  ccSmartEmi: `${BASE_URL}/content/hdfc_ccforms/api/ccsmartemi.json`,
  branchMaster: `${BASE_URL}/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_BRANCH_MASTER.BRANCH_CODE`,
  dsaCode: `${BASE_URL}/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_DSA_MASTER.DSACODE`,
};

const DOM_ELEMENT = {
  semiWizard: 'aem_semiWizard',
  chooseTransaction: 'aem_chooseTransactions',
  selectTenure: 'aem_selectTenure',
};

const MISC = {
  rupeesUnicode: '\u20B9',
};

const OTP_TIMER = 30;
const MAX_OTP_RESEND_COUNT = 3;
const CURRENT_FORM_CONTEXT = {};
const DATA_LIMITS = {
  totalSelectLimit: 10,
  otpTimeLimit: 30,
  maxOtpResendLimit: 3,
};

export {
  JOURNEY_NAME,
  ERROR_MSG,
  OTP_TIMER,
  SEMI_ENDPOINTS,
  MAX_OTP_RESEND_COUNT,
  CURRENT_FORM_CONTEXT,
  CHANNELS,
  PRO_CODE,
  DOM_ELEMENT,
  MISC,
  DATA_LIMITS,
  FLOWS_ERROR_MESSAGES,
  BASE_URL,
};
