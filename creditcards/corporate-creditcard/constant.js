// declare CONSTANTS for (cc) corporate credit card only.
// impoted as CC_CONSTANT key name in all files.

const JOURNEY_NAME = 'CORPORATE_CARD_JOURNEY';
const FORM_NAME = 'Corporate Credit Card';

const DOM_ELEMENT = {
  identifyYourself: {
    chekbox1Label: 'checkboxConsent1Label',
    chekbox2Label: 'checkboxConsent2Label',
    consent1Content: 'consentPanel1',
    consent2Content: 'consentPanel2',
    modalBtnWrapper: 'button-wrapper',
    checkbox1ProductLabel: '.field-checkboxconsent1label',
    checkbox2ProductLabel: '.field-checkboxconsent2label',
    anchorTagClass: 'link',
    dob: 'dateOfBirth',
    otpNumber: 'otpNumber',
    incorrectOtp: 'field-incorrectotptext',
  },
  otpValidate: {
    otpNumberField: 'otpNumber',
    incorrectOtpField: '.field-incorrectotptext',
  },
  confirmCard: {
    viewAllLink: 'viewAllCardBenefits',
    viewAllContent: 'viewAllCardBenefitsPanel',
    modalBtnWrapper: 'button-wrapper',
  },
  selectKyc: {
    aadharModalContent: 'aadharConsentPopup',
    modalBtnWrapper: 'button-wrapper',
    defaultLanguage: 'English',
  },
  ccWizard: {
    wizardPanel: 'corporateCardWizardView',
    confirmAndSubmitPanel: 'confirmAndSubmitPanel',
  },
  yourDetails: {
    employedDate: 'employedFrom',
    personalDetailDob: 'dobPersonalDetails',
    firstName: 'firstName',
    middleName: 'middleName',
    lastName: 'lastName',
  },
};
const NAME_ON_CARD_MAX_LENGTH = 19;
export {
  JOURNEY_NAME,
  DOM_ELEMENT,
  NAME_ON_CARD_MAX_LENGTH,
  FORM_NAME,
};
