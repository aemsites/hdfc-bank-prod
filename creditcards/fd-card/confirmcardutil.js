import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';
import { getUrlParamCaseInsensitive } from '../../common/formutils.js';
import { replaceElementsWith } from '../domutils/domutils.js';
import { buttonEnableOnCheck } from './fd-dom-functions.js';
import { IPA_RESPONSE } from './ipautil.js';

const confirmCardState = {
  selectedCardIndex: 0,
  knowMoreClickedIndex: -1,
};

/**
 *
 * @name confirmCardClickHandler
 * @param {Object} globals - The global context object containing various information.
 */
const confirmCardClickHandler = (globals) => {
  CURRENT_FORM_CONTEXT.isIntegraFlow = false;
  buttonEnableOnCheck('.field-languageconsenttnc input', '.field-aadharconsentagree button');
  CURRENT_FORM_CONTEXT.selectedProductCode = IPA_RESPONSE?.productDetails?.[confirmCardState.selectedCardIndex]?.cardProductCode;
  CURRENT_FORM_CONTEXT.selectedCreditCard = IPA_RESPONSE?.productDetails?.[confirmCardState.selectedCardIndex];
  const {
    fdBasedCreditCardWizard,
    docUploadFlow,
    selectKYCOptionsPanel,
    runtime,
  } = globals.form;
  if (CURRENT_FORM_CONTEXT.customerIdentityChange) {
    globals.functions.setProperty(docUploadFlow.docUploadConfirm, { visible: true });
    globals.functions.setProperty(docUploadFlow.docUploadBiometric, { visible: false });
  } else {
    globals.functions.setProperty(docUploadFlow.docUploadConfirm, { visible: false });
    globals.functions.setProperty(docUploadFlow.docUploadBiometric, { visible: true });
  }
  const { addressDetails, employeeAssistance } = fdBasedCreditCardWizard.basicDetails.reviewDetailsView;
  const { aadharBiometricVerification } = globals.form.selectKYCOptionsPanel.selectKYCMethodOption1;
  const inPersonBioKYC = getUrlParamCaseInsensitive('InpersonBioKYC') || '';
  if ((addressDetails.mailingAddressToggle._data.$_value === 'off' || inPersonBioKYC.toLowerCase() === 'yes')
  && employeeAssistance.inPersonBioKYCPanel.inPersonBioKYCOptions._data.$_value === '0') {
    CURRENT_FORM_CONTEXT.isIntegraFlow = true;
    globals.functions.setProperty(aadharBiometricVerification, { value: '0' });
  }
  if (employeeAssistance.inPersonBioKYCPanel.inPersonBioKYCOptions._data.$_value === '1') {
    globals.functions.setProperty(selectKYCOptionsPanel.selectKYCMethodOption1, { visible: false });
  }
  if (addressDetails.mailingAddressToggle._data.$_value === 'on' && CURRENT_FORM_CONTEXT.customerIdentityChange) {
    globals.functions.setProperty(docUploadFlow, { visible: true });
    globals.functions.setProperty(docUploadFlow.uploadAddressProof, { visible: false });
    globals.functions.setProperty(docUploadFlow.docUploadPanel, { visible: true });
    globals.functions.setProperty(fdBasedCreditCardWizard, { visible: false });
    CURRENT_FORM_CONTEXT.identityDocUploadFlag = true;
  } else if (addressDetails.mailingAddressToggle._data.$_value === 'off') {
    globals.functions.setProperty(fdBasedCreditCardWizard, { visible: false });
    globals.functions.setProperty(selectKYCOptionsPanel, { visible: true });
  }
  globals.functions.setProperty(runtime.formContext, { value: JSON.stringify(CURRENT_FORM_CONTEXT) });
};

const setknowMoreBenefitsPanelData = (moreFeatures, knowMoreBenefitsPanel, globals) => {
  if (!moreFeatures?.length) return;
  const transformedMoreFeatures = moreFeatures.map((feature) => ({
    cardBenefitsText: feature,
  }));
  globals.functions.importData(transformedMoreFeatures, knowMoreBenefitsPanel.$qualifiedName);
  setTimeout(() => {
    replaceElementsWith('.field-knowmorebenefitspanel textarea', 'p', -1);
  }, 200);
};

const knowMoreCardClickHandler = (globals) => {
  const { knowMoreBenefitsPanel } = globals.form.fdBasedCreditCardWizard.selectCard.knowMorePopupWrapper.viewAllCardBenefitsPanel;
  const { knowMorePopupWrapper } = globals.form.fdBasedCreditCardWizard.selectCard;

  confirmCardState.knowMoreClickedIndex = (IPA_RESPONSE?.productDetails?.length > 1) ? globals.field.$parent.$index : 0;
  const moreFeatures = IPA_RESPONSE?.productDetails?.[confirmCardState.knowMoreClickedIndex]?.features;
  setknowMoreBenefitsPanelData(moreFeatures, knowMoreBenefitsPanel, globals);

  globals.functions.setProperty(knowMorePopupWrapper, { visible: true });
};

const selectCardBackClickHandler = (globals) => {
  const { selectCardFaciaPanelMultiple } = globals.form.fdBasedCreditCardWizard.selectCard;
  confirmCardState.selectedCardIndex = -1;
  if (IPA_RESPONSE.productDetails.length > 1) {
    IPA_RESPONSE.productDetails.slice(0, -1).forEach(() => {
      globals.functions.dispatchEvent(selectCardFaciaPanelMultiple, 'removeItem');
    });
    globals.functions.setProperty(selectCardFaciaPanelMultiple[0].cardSelection, { value: undefined });
  }
};

const cardSelectHandler = (cardsPanel, globals) => {
  const isRedirected = globals?.functions?.exportData()?.queryParams?.journeyId || '';
  if (isRedirected !== '') return;
  if (confirmCardState.selectedCardIndex !== -1) {
    const selectedItems = cardsPanel.filter((item) => item.cardSelection._data.$value === '0');
    if (selectedItems.length > 1) globals.functions.setProperty(cardsPanel[confirmCardState.selectedCardIndex].cardSelection, { value: undefined });
    setTimeout(() => {
      confirmCardState.selectedCardIndex = cardsPanel.findIndex((item) => item.cardSelection._data.$value === '0');
      globals.functions.setProperty(globals.form.fdBasedCreditCardWizard.selectCard.selectedCreditCard, { value: IPA_RESPONSE?.productDetails?.[confirmCardState.selectedCardIndex]?.cardProductCode });
      CURRENT_FORM_CONTEXT.selectedCreditCard = IPA_RESPONSE?.productDetails?.[confirmCardState.selectedCardIndex];
    }, 50);
  } else {
    confirmCardState.selectedCardIndex = cardsPanel.findIndex((item) => item.cardSelection._data.$value === '0');
    globals.functions.setProperty(globals.form.fdBasedCreditCardWizard.selectCard.selectedCreditCard, { value: IPA_RESPONSE?.productDetails?.[confirmCardState.selectedCardIndex]?.cardProductCode });
    CURRENT_FORM_CONTEXT.selectedCreditCard = IPA_RESPONSE?.productDetails?.[confirmCardState.selectedCardIndex];
  }
};

const popupBackClickHandler = (globals) => {
  const { knowMoreBenefitsPanel } = globals.form.fdBasedCreditCardWizard.selectCard.knowMorePopupWrapper.viewAllCardBenefitsPanel;
  const { knowMorePopupWrapper } = globals.form.fdBasedCreditCardWizard.selectCard;
  globals.functions.setProperty(knowMorePopupWrapper, { visible: false });
  if (confirmCardState.knowMoreClickedIndex !== -1) {
    IPA_RESPONSE.productDetails?.[confirmCardState.knowMoreClickedIndex]?.features.slice(0, -1).forEach(() => {
      globals.functions.dispatchEvent(knowMoreBenefitsPanel, 'removeItem');
    });
  }
};

export {
  knowMoreCardClickHandler,
  confirmCardClickHandler,
  selectCardBackClickHandler,
  cardSelectHandler,
  popupBackClickHandler,
  confirmCardState,
};
