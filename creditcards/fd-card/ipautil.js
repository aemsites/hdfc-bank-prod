import { BASEURL, CURRENT_FORM_CONTEXT, FORM_RUNTIME } from '../../common/constants.js';
import { applicableCards, extractJSONFromHTMLString, urlPath } from '../../common/formutils.js';
import { invokeJourneyDropOffUpdate } from './fd-journey-util.js';
import {
  fetchRecursiveResponse,
} from '../../common/makeRestAPI.js';
import { FD_ENDPOINTS } from './constant.js';
import { SELECTED_CUSTOMER_ID } from './customeridutil.js';
import { sendPageloadEvent } from './analytics.js';

const IPA_RESPONSE = {};
const createIpaRequest = (payload, globals) => {
  const employmentTypeMap = {
    1: 'others',
    2: 'selfEmployed',
    3: 'others',
    4: 'others',
    5: 'others',
  };
  const applicableCreditLimit = globals.form.fdBasedCreditCardWizard.selectFD.fdSelectionInfo.selectFDDetailsPanel.creditLimit._data.$_value;
  const selectedEmploymentType = globals.form.fdBasedCreditCardWizard.basicDetails.reviewDetailsView.employmentDetails.employmentType._data.$_value;
  const htmlString = globals.form.ipaNullGrid._jsonModel.value;
  const defaultProductObj = extractJSONFromHTMLString(htmlString);
  const applicableCardsArr = applicableCards(employmentTypeMap, selectedEmploymentType, defaultProductObj, applicableCreditLimit);
  const ipaRequest = {
    requestString: {
      mobileNumber: globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber.$value,
      applRefNumber: payload.APS_APPL_REF_NUM,
      eRefNumber: CURRENT_FORM_CONTEXT.referenceNumber,
      customerID: SELECTED_CUSTOMER_ID?.selectedCustId?.customerID,
      journeyID: CURRENT_FORM_CONTEXT.journeyID,
      journeyName: CURRENT_FORM_CONTEXT.journeyName,
      productCode: applicableCardsArr.join(','),
    },
  };
  CURRENT_FORM_CONTEXT.eligibleCards = ipaRequest?.requestString?.productCode;
  return ipaRequest;
};
/**
 * Executes an IPA request.
 * @name ipa
 * @param {object} payload - The payload for the IPA request.
 * @param {boolean} showLoader - Whether to show a loader while the request is in progress.
 * @param {boolean} hideLoader - Whether to hide the loader after the request is complete.
 * @param {object} globals - The global context object.
 * @returns {Promise<object>} A promise that resolves to the response of the IPA request.
 */
const ipa = (payload, showLoader, hideLoader, globals) => {
  CURRENT_FORM_CONTEXT.executeInterfaceResponse = payload;
  const ipaRequest = createIpaRequest(payload, globals);
  const apiEndPoint = urlPath(FD_ENDPOINTS.ipa);
  if (showLoader) FORM_RUNTIME.ipa();
  const fieldName = ['IPAResponse', 'productEligibility', 'productDetails'];
  return fetchRecursiveResponse('ipa', apiEndPoint, ipaRequest, 'POST', Number(payload.ipaDuration), Number(payload.ipaTimer), fieldName, hideLoader);
};

const updateData = (globals, productDetail, panel, index) => {
  const { setProperty } = globals.functions;
  const {
    product,
    joiningFee = '0',
    renewalFee = '0',
    cardLine,
    keyBenefits = [],
    productCode,
  } = {
    ...productDetail,
    joiningFee: productDetail.annualFee || '0',
    renewalFee: productDetail.annualFee || '0',
  };
  // updated panel
  const properties = [
    { element: panel.cardSelection_display, value: product },
    { element: panel.joiningRenewalFeeWrapper.joiningFeeAmt, value: joiningFee },
    { element: panel.joiningRenewalFeeWrapper.renewalFeeAmt, value: renewalFee },
    { element: panel.cardTagline, value: cardLine },
    { element: panel.cardfeaturesWrapper.cardfeatures1, value: keyBenefits[0] || '' },
    { element: panel.cardfeaturesWrapper.cardfeatures2, value: keyBenefits[1] || '' },
    { element: panel.cardfeaturesWrapper.cardfeatures3, value: keyBenefits[2] || '' },
  ];

  properties.forEach(({ element, value }) => setProperty(element, { value }));

  const imageEl = document.querySelectorAll('.field-cardfaciaimage > picture')[index];
  const imagePath = `${BASEURL}${productCode}?width=2000&optimize=medium`;

  ['img', 'source'].forEach((tag) => {
    imageEl.querySelectorAll(tag).forEach((el) => el.setAttribute(tag === 'img' ? 'src' : 'srcset', imagePath));
  });
};

const bindSingleCardDetails = (panel, globals, productDetail) => {
  const { singleCardKeyBenefitsPanel } = panel;
  const {
    FeesSingleCard, singleCardBenefitsText1, singleCardBenefitsText2, singleCardBenefitsText3,
  } = singleCardKeyBenefitsPanel;

  const { setProperty } = globals.functions;
  const {
    product,
    joiningFee = '0',
    renewalFee = '0',
    cardLine,
    keyBenefits = [],
    productCode,
  } = {
    ...productDetail,
    joiningFee: productDetail.annualFee || '0',
    renewalFee: productDetail.annualFee || '0',
  };

  const properties = [
    { element: panel.singleCardName, value: product },
    { element: FeesSingleCard.joiningFeeAmt, value: joiningFee },
    { element: FeesSingleCard.renewalFeeAmt, value: renewalFee },
    { element: panel.singleCardTitle, value: cardLine },
    { element: singleCardBenefitsText1, value: keyBenefits[0] || '' },
    { element: singleCardBenefitsText2, value: keyBenefits[1] || '' },
    { element: singleCardBenefitsText3, value: keyBenefits[2] || '' },
  ];

  properties.forEach(({ element, value }) => setProperty(element, { value }));

  const imageEl = document.querySelector('.field-singlecardfacia > picture');
  const imagePath = `${BASEURL}${productCode}?width=2000&optimize=medium`;

  imageEl.querySelectorAll('img').forEach((img) => img.setAttribute('src', imagePath));
  imageEl.querySelectorAll('source').forEach((source) => source.setAttribute('srcset', imagePath));
  globals.functions.setProperty(globals.form.fdBasedCreditCardWizard.selectCard.selectedCreditCard, { value: productDetail.cardProductCode });
  CURRENT_FORM_CONTEXT.selectedCreditCard = productDetail;
};

/**
 *
 * @name fdIpaSuccessHandler
 * @param {object} response - The response recieved from the IPA request.
 * @param {object} globals - The global context object.
 * @returns {Promise<object>}
 */
const fdIpaSuccessHandler = (response, globals) => {
  CURRENT_FORM_CONTEXT.eRefNumber = response?.APS_E_REF_NUM;
  if (response?.FILLER1 !== '') CURRENT_FORM_CONTEXT.eligibleCards = response?.FILLER1;
  sendPageloadEvent('CUSTOMER_CARD_SELECTED', CURRENT_FORM_CONTEXT, 'Step 5 - Choose Card', 'selectCard');
  const productDetails = response?.productEligibility?.productDetails?.length
    ? response.productEligibility.productDetails
    : response?.productEligibility?.defaultProducts ?? [];
  const { selectCard, selectFD, basicDetails } = globals.form.fdBasedCreditCardWizard;
  const {
    eligibleCreditLimitAmount,
    selectCardFaciaPanelMultiple,
    selectCardFaciaPanelSingle,
    selectCardHeaderPanel,
    continueToIDCOM,
    selectIdentifier,
  } = selectCard;
  const { creditLimit } = selectFD.fdSelectionInfo.selectFDDetailsPanel;
  const productCount = productDetails.length;
  IPA_RESPONSE.productDetails = productDetails;
  CURRENT_FORM_CONTEXT.cardCreditLimit = creditLimit.$value;
  globals.functions.setProperty(eligibleCreditLimitAmount, { value: creditLimit.$value });

  const isSingleProduct = productCount === 1;
  const isMultipleProducts = productCount > 1;

  globals.functions.setProperty(selectCardHeaderPanel.selectSuitableCardText, { visible: !isSingleProduct });
  globals.functions.setProperty(selectCardFaciaPanelMultiple, { visible: isMultipleProducts });
  globals.functions.setProperty(selectCardFaciaPanelSingle, { visible: isSingleProduct });

  if (isSingleProduct) {
    bindSingleCardDetails(selectCardFaciaPanelSingle, globals, productDetails[0]);
  } else if (isMultipleProducts) {
    const topThreeProducts = productDetails.slice(0, 3);
    globals.functions.setProperty(globals.form.fdBasedCreditCardWizard.selectCard.selectedCreditCard, { value: topThreeProducts?.[0]?.cardProductCode });
    CURRENT_FORM_CONTEXT.selectedCreditCard = topThreeProducts?.[0];
    topThreeProducts.forEach((productDetail, i) => {
      if (i < topThreeProducts.length - 1) globals.functions.dispatchEvent(selectCardFaciaPanelMultiple, 'addItem');
      setTimeout(() => updateData(globals, productDetail, selectCardFaciaPanelMultiple[i], i), i * 40);
    });
    globals.functions.setProperty(selectCardFaciaPanelMultiple[0].cardSelection, { value: 0 });
  }

  if (productCount === 0) {
    globals.functions.setProperty(selectCardFaciaPanelSingle, { visible: false });
    globals.functions.setProperty(selectCardFaciaPanelMultiple, { visible: false });
  }

  const addressToggleOn = basicDetails.reviewDetailsView.addressDetails.mailingAddressToggle._data.$_value === 'on';
  const customerChanged = CURRENT_FORM_CONTEXT.customerIdentityChange;
  globals.functions.setProperty(selectIdentifier, { visible: customerChanged || !addressToggleOn });
  globals.functions.setProperty(continueToIDCOM, { visible: !customerChanged && addressToggleOn });
  const formData = globals.functions.exportData();
  const mobNumber = globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber.$value;
  const leadProfileId = formData?.leadProifileId || globals?.form?.runtime?.leadProifileId.$value;
  const { journeyId } = formData;
  invokeJourneyDropOffUpdate('CUSTOMER_OFFER_AVAILABLE', mobNumber, leadProfileId, journeyId, globals);
};

export {
  ipa,
  fdIpaSuccessHandler,
  IPA_RESPONSE,
};
