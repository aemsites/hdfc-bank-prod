const NRENROENDPOINTS = {
  accountOpening: '/content/hdfc_haf_nrenro/api/nrenroAccountOpening.json',
};

// declare CONSTANTS for NRE NRO only.
const FORM_NAME = 'NRE NRO Account Opening';
const CHANNEL = 'WEB';
const JOURNEY_NAME = 'AONRENRO';
const VISIT_MODE = 'U';
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
  },
};
export {
  CHANNEL,
  JOURNEY_NAME,
  VISIT_MODE,
  DOM_ELEMENT,
  FORM_NAME,
  NRENROENDPOINTS,
};
