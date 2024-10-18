import {
  displayLoader, fetchJsonResponse,
} from '../../common/makeRestAPI.js';
import * as SEMI_CONSTANT from './constant.js';
import {
  clearString,
  generateUUID,
  moveWizardView,
  urlPath,
} from '../../common/formutils.js';

import {
  numberToText,
  currencyUtil,
  calculateEMI,
  sortDataByAmount,
  sortDataByAmountSymbol,
  sortByDate,
  changeCheckboxToToggle,
  currencyStrToNum,
  getBillingCycleDate,
} from './semi-utils.js';

import {
  assistedToggleHandler,
  channelDDHandler,
  branchHandler,
  dsaHandler,
  handleMdmUtmParam,
} from './semi-mdm-utils.js';

import { invokeJourneyDropOffByParam } from '../../common/journey-utils.js';
import { invokeJourneyDropOffUpdate, invokeJourneyDropOff } from './semi-journey-utils.js';
import { reloadPage } from '../../common/functions.js';
import {
  sendAnalytics,
  sendErrorAnalytics,
} from './semi-analytics.js';
import { ANALYTICS_JOURNEY_STATE } from './semi-analytics-constant.js';

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
  JOURNEY_NAME: journeyName,
  SEMI_ENDPOINTS: semiEndpoints,
  PRO_CODE,
  DOM_ELEMENT: domElements,
  MISC,
  DATA_LIMITS,
  CHANNELS,
  ERROR_MSG,
  FLOWS_ERROR_MESSAGES,
} = SEMI_CONSTANT;

const isNodeEnv = typeof process !== 'undefined' && process.versions && process.versions.node;

// Initialize all SEMI Journey Context Variables & formRuntime variables.
currentFormContext.totalSelect = 0;
currentFormContext.billed = 0;
currentFormContext.unbilled = 0;
currentFormContext.tadMinusMadValue = 0;
currentFormContext.txnSelectExceedLimit = 1000000; // ten lakhs txn's select exceeding limit
let tnxPopupAlertOnce = 0; // flag alert for the pop to show only once on click of continue
let resendOtpCount = 0;
let resendOtpCount2 = 0;
const userPrevSelect = {};

const onPageLoadAnalytics = async () => {
  const journeyData = {};
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-underscore-dangle, no-undef
    journeyData.journeyId = myForm.resolveQualifiedName('$form.runtime.journeyId')._data.$_value;
    journeyData.journeyName = journeyName;
    sendAnalytics(
      'page load',
      {},
      ANALYTICS_JOURNEY_STATE['page load'],
      journeyData,
    );
  }
};

setTimeout(() => {
  if (typeof window !== 'undefined') {
    onPageLoadAnalytics();
  }
}, 5000);

/**
 * For Web returing currentFormContext as defined in variable
 * Ideally every custom function should be pure function, i.e it should not have any side effect
 * As per current implementation `currentFormContext` is a state outside of the function,
 * so for Flow we have did special handling by storing strigified value in `globals.form.runtime.currentFormContext`
 *
 * @param {scope} globals
 * @returns
 */
function getCurrentFormContext(globals) {
  if (isNodeEnv) {
    return JSON.parse(globals.form.runtime.currentFormContext.$value || '{}');
  }
  return currentFormContext;
}

/**
   * generates the journeyId
   * @param {string} visitMode - The visit mode (e.g., "online", "offline").
   * @param {string} journeyAbbreviation - The abbreviation for the journey.
   * @param {string} channel - The channel through which the journey is initiated.
   * @param {object} globals
   */
function createJourneyId(visitMode, journeyAbbreviation, channelValue, globals) {
  const dynamicUUID = generateUUID();
  // var dispInstance = getDispatcherInstance();
  let channel = channelValue;
  if (isNodeEnv) {
    channel = CHANNELS.adobeWhatsApp;
  }
  const journeyId = globals.functions.exportData().smartemi?.journeyId || `${dynamicUUID}_01_${journeyAbbreviation}_${visitMode}_${channel}`;
  globals.functions.setProperty(globals.form.runtime.journeyId, { value: journeyId });

  // Update the form context
  currentFormContext.journeyName = journeyName;
  currentFormContext.journeyID = journeyId;
  globals.functions.setProperty(globals.form.runtime.currentFormContext, { value: JSON.stringify({ ...currentFormContext }) });
}

/**
 * generates the otp
 * @param {string} mobileNumber
 * @param {string} cardDigits
 * @param {string} channel
 * @param {object} globals
 * @return {PROMISE}
 */
function getOTPV1(mobileNumber, cardDigits, channel, globals) {
  if (!isNodeEnv) {
    /* restrict to show otp-resend option once it reaches max-attemt and to show otptimer */
    const { otpPanel } = globals.form.aem_semiWizard.aem_identifierPanel.aem_otpPanel;
    if (resendOtpCount < DATA_LIMITS.maxOtpResendLimit) {
      globals.functions.setProperty(otpPanel.secondsPanel, { visible: true });
      globals.functions.setProperty(otpPanel.aem_otpResend, { visible: false });
    } else {
      globals.functions.setProperty(otpPanel.secondsPanel, { visible: false });
    }
    displayLoader();
  }
  let path = semiEndpoints.otpGen;
  let jsonObj = {
    requestString: {
      mobileNo: mobileNumber,
      cardNo: cardDigits,
      journeyID: globals.form.runtime.journeyId.$value || currentFormContext.journeyID,
      journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
    },
  };
  if (channel === CHANNELS.adobeWhatsApp) {
    path = semiEndpoints.otpVal;
    jsonObj = {
      requestString: {
        mobileNo: mobileNumber,
        cardNo: cardDigits,
        proCode: PRO_CODE,
        journeyID: globals.form.runtime.journeyId.$value,
        journeyName: globals.form.runtime.journeyName.$value,
        channel: CHANNELS.adobeWhatsApp,
      },
    };
  }
  // eslint-disable-next-line no-unneeded-ternary
  return fetchJsonResponse(path, jsonObj, 'POST', isNodeEnv ? false : true);
}

/**
 * generates the otp
 * @param {string} mobileNumber
 * @param {string} cardDigits
 * @param {object} globals
 * @return {PROMISE}
 */
function otpValV1(mobileNumber, cardDigits, otpNumber, globals) {
  const jsonObj = {
    requestString: {
      mobileNo: mobileNumber,
      cardNo: cardDigits,
      OTP: otpNumber,
      proCode: PRO_CODE,
      journeyID: globals.form.runtime.journeyId.$value || currentFormContext.journeyID,
      journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
    },
  };
  const path = semiEndpoints.otpVal;
  if (isNodeEnv) {
    jsonObj.requestString.channel = CHANNELS.adobeWhatsApp;
    delete jsonObj.requestString.OTP;
  }
  if (!isNodeEnv) displayLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
}

/**
 * @name handleWrongCCDetailsFlows
 * @param {object} ccNumber
 * @param {object} wrongNumberCount
 * @param {string} errorMessage
 * @param {scope} globals
 */
function handleWrongCCDetailsFlows(ccNumber, wrongNumberCount, errorMessage, globals) {
  // wrong CC number retry is handled in the flow only
  if (!isNodeEnv) return;
  const count = wrongNumberCount.$value;
  if (count < 2) {
    globals.functions.markFieldAsInvalid(ccNumber.$qualifiedName, errorMessage, { useQualifiedName: true });
    globals.functions.setProperty(wrongNumberCount, { value: count + 1 });
  }
}

/**
 * pre  execute loan fullfilment process, generated final otp for loan booking
 * @param {string} mobileNumber
 * @param {string} cardDigits
 * @param {object} globals
 * @return {PROMISE}
 */
function preExecution(mobileNumber, cardDigits, globals) {
  /* restrict to show otp-resend option once it reaches max-attemt and to show otptimer */
  const otpPanel = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
  if (resendOtpCount2 < DATA_LIMITS.maxOtpResendLimit) {
    globals.functions.setProperty(otpPanel.secondsPanel, { visible: true });
    globals.functions.setProperty(otpPanel.aem_otpResend2, { visible: false });
  } else {
    globals.functions.setProperty(otpPanel.secondsPanel, { visible: false });
  }
  const formContext = getCurrentFormContext(globals);
  const jsonObj = {
    requestString: {
      mobileNo: mobileNumber,
      cardNo: cardDigits,
      encryptedToken: formContext.EligibilityResponse.responseString.records[0].encryptedToken,
      journeyID: globals.form.runtime.journeyId.$value,
      journeyName: globals.form.runtime.journeyName.$value,
    },
  };
  const path = semiEndpoints.preexecution;
  if (!isNodeEnv) displayLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', !isNodeEnv);
}
const nfObject = new Intl.NumberFormat('hi-IN');

/**
 * Formats a transaction amount into the Indian Rupee (INR) format with two decimal places.
 * If the transaction amount starts with '0', it is considered an unbilled amount and is divided by 100
 * before formatting.
 * @param {number|string} txnAmt - The transaction amount to be formatted. It can be a number or a string.
 * @returns {string} The formatted transaction amount in INR currency format with two decimal places.
 */
const txnInrFormat = (txnAmt) => {
  const amt = String(txnAmt).trim();
  const isUnBilledAmt = amt.startsWith('0');

  const nfInrObj = new Intl.NumberFormat('hi-IN', {
    minimumFractionDigits: 2, // Minimum number of digits after the decimal
    maximumFractionDigits: 2, // Maximum number of digits after the decimal
  });

  const formattedAmt = isUnBilledAmt
    ? nfInrObj.format(parseFloat(amt) / 100)
    : nfInrObj.format(parseFloat(amt));

  return formattedAmt;
};

/**
 * sets the data for the instance of repetable panel
 *
 * @param {object} globals - gobal form object
 * @param {Object} panel - The panel for unbilled transactions.
 * @param {Object} txn - current tramsaction object
 * @param {number} i - current instance of panel row
 */
const setData = (globals, panel, txn, i) => {
  let enabled = true;
  if (currentFormContext.totalSelect === 10 && txn?.aem_Txn_checkBox !== 'on') enabled = false;
  globals.functions.setProperty(panel[i]?.aem_Txn_checkBox, { value: txn?.checkbox || txn?.aem_Txn_checkBox });
  globals.functions.setProperty(panel[i]?.aem_Txn_checkBox, { enabled });// set the checbox value
  const paiseAppendAmt = txnInrFormat((txn?.amount || txn?.aem_TxnAmt));
  const TXN_AMT = `${MISC.rupeesUnicode} ${paiseAppendAmt}`;
  globals.functions.setProperty(panel[i]?.aem_TxnAmt, { value: TXN_AMT });
  globals.functions.setProperty(panel[i]?.aem_TxnDate, { value: txn?.date || txn?.aem_TxnDate });
  globals.functions.setProperty(panel[i]?.aem_TxnID, { value: txn?.id || txn?.aem_TxnID });
  globals.functions.setProperty(panel[i]?.aem_TxnName, { value: txn?.name || txn?.aem_TxnName });
  globals.functions.setProperty(panel[i]?.authCode, { value: txn?.AUTH_CODE || txn?.authCode });
  globals.functions.setProperty(panel[i]?.logicMod, { value: txn?.LOGICMOD || txn?.logicMod });
  globals.functions.setProperty(panel[i]?.aem_txn_type, { value: txn?.type });
};
/*
 * Displays card details by updating the UI with response data.
 * @param {object} globals - global object
 * @param {object} response - response from the checkEligibilty
 */
const cardDisplay = (globals, response) => {
  const creditCardDisplay = globals.form.aem_semicreditCardDisplay;
  const nCardNumber = 4;
  const cardNumberLength = Number.isNaN(response?.blockCode.cardNumber.length) ? 0 : response.blockCode.cardNumber.length;
  const lastNDigits = (cardNumberLength % nCardNumber === 0) ? response?.blockCode.cardNumber.slice(-nCardNumber) : response?.blockCode.cardNumber.slice(-(cardNumberLength % nCardNumber));
  const cardDigits = `${'X'.repeat(nCardNumber)}-`.repeat(Math.round(cardNumberLength / nCardNumber) - 1) + lastNDigits;
  globals.functions.setProperty(creditCardDisplay, { visible: true });
  globals.functions.setProperty(creditCardDisplay.aem_semicreditCardContent.aem_customerNameLabel, { value: `Dear ${response?.cardHolderName}` });
  globals.functions.setProperty(creditCardDisplay.cardFaciaCardName, { value: `${response?.address.name}` });
  globals.functions.setProperty(creditCardDisplay.cardFaciaCardNo, { value: `${cardDigits}` });
  // eslint-disable-next-line radix
  const totalAmt = nfObject.format(parseInt(response.responseString.creditLimit) - Math.round(parseInt(response?.blockCode?.bbvlogn_card_outst) / 100));
  const TOTAL_OUTSTANDING_AMT = `${MISC.rupeesUnicode} ${totalAmt}`;
  currentFormContext.totalOutstandingAmount = TOTAL_OUTSTANDING_AMT;
  globals.functions.setProperty(creditCardDisplay.aem_semicreditCardContent.aem_outStandingAmt, { value: TOTAL_OUTSTANDING_AMT });
  globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_cardfacia, { value: urlPath(response.cardTypePath) });
  const imageEl = document.querySelector('.field-aem-cardfacia > picture');
  const imagePath = `${urlPath(response.cardTypePath)}?width=2000&optimize=medium`;
  imageEl?.childNodes[5].setAttribute('src', imagePath);
  imageEl?.childNodes[3].setAttribute('srcset', imagePath);
  imageEl?.childNodes[1].setAttribute('srcset', imagePath);
};

const DELAY = 0;
const DELTA_DELAY = 120;

/**
 * sets the data for the instance of repetable panel
 *
 * @param {object} globals - gobal form object
 * @param {Object} panel - The panel for unbilled transactions.
 * @param {Object} txn - current tramsaction object
 * @param {number} i - current instance of panel row
 */
const getTranactionPanelData = (transactions) => {
  const txnsData = transactions?.map((txn) => {
    const paiseAppendAmt = txnInrFormat((txn?.amount || txn?.aem_TxnAmt));
    const TXN_AMT = `${MISC.rupeesUnicode} ${paiseAppendAmt}`;
    return {
      aem_Txn_checkBox: txn?.checkbox || txn?.aem_Txn_checkBox,
      aem_TxnAmt: TXN_AMT,
      aem_TxnDate: txn?.date || txn?.aem_TxnDate,
      aem_TxnID: txn?.id || txn?.aem_TxnID,
      aem_TxnName: txn?.name || txn?.aem_TxnName,
      authCode: txn?.AUTH_CODE || txn?.authCode,
      logicMod: txn?.LOGICMOD || txn?.logicMod,
      aem_txn_type: txn?.type,
    };
  });
  return txnsData;
};

// Special handling for whatsapp flow, can be removed once proper fix is done
function addTransactions(allTxn, globals) {
  const transactions = allTxn || [];
  const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
  const data = getTranactionPanelData(transactions);
  globals.functions.importData(data, billedTxnPanel.$qualifiedName);
}

/**
 * Combines transaction data and updates the appropriate panels.
 *
 * @param {Array} allTxn - Array of all transactions.
 * @param {number} [btxn] - Number of billed transactions.
 * @param {Object} billedTxnPanel - The panel for billed transactions.
 * @param {Object} [unBilledTxnPanel] - The panel for unbilled transactions.
 * @param {Object} globals - Global variables and functions.
 */
const setTxnPanelData = async (allTxn, btxn, uBtxn, billedTxnPanel, unBilledTxnPanel, globals) => {
  if (!allTxn?.length) return;
  if (!isNodeEnv) {
    allTxn.forEach((_txn, i) => {
      const isBilled = i < btxn;
      let panel = billedTxnPanel;
      if (btxn !== undefined && unBilledTxnPanel !== undefined) {
        // Case where we have both billed and unbilled transactions
        panel = isBilled ? billedTxnPanel : unBilledTxnPanel;
      }
      const delay = DELAY + (DELTA_DELAY * i);
      const panelIndex = isBilled ? i : i - btxn;
      setTimeout(() => {
        if (isBilled && (btxn - 1 >= billedTxnPanel.length)) {
          /* condition to skip the default txn list data */
          globals.functions.dispatchEvent(panel, 'addItem');
        }
        if (!isBilled && (uBtxn - 1) >= unBilledTxnPanel.length) {
          /* condition to skip the default txn list data */
          globals.functions.dispatchEvent(panel, 'addItem');
        }
        const txnData = {
          ..._txn,
          type: isBilled ? 'BILLED' : 'UNBILLED',
        };
        setData(globals, panel, txnData, panelIndex);
      }, delay);
    });
  } else {
    // special handling for whatsapp flow
    addTransactions(allTxn, globals);
  }
};

/**
 * @name customDispatchEvent - to dispatch custom event on form
 * @param {string} eventName - event name
 * @param {object} payload - payload to dispatch
 * @param {scope} globals - globals
 */
function customDispatchEvent(eventName, payload, globals) {
  let evtPayload = payload;
  if (isNodeEnv && payload?.errorCode) {
    if (FLOWS_ERROR_MESSAGES[payload.errorCode]) {
      evtPayload = { ...evtPayload, errorMsg: FLOWS_ERROR_MESSAGES[payload.errorCode] };
    }
  }
  globals.functions.dispatchEvent(globals.form, `custom:${eventName}`, evtPayload);
}

const handleResendOtp2VisibilityInFlow = (countOfResendOtp, globals) => {
  if (!isNodeEnv) return;
  const otpPanel = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
  if (countOfResendOtp >= DATA_LIMITS.maxOtpResendLimit) {
    const properties = otpPanel.aem_otpResend2.$properties;
    globals.functions.setProperty(otpPanel.aem_otpResend2, { properties: { ...properties, 'flow:setVisible': false } });
  }
};

/**
 * calls function to add styling to completed steppers
 *
 * @function changeWizardView
 * @returns {void}
 */
const changeWizardView = () => {
  if (isNodeEnv) return;
  const completedStep = document.querySelector('.field-aem-semiwizard .wizard-menu-items .wizard-menu-active-item');
  completedStep.classList.add('wizard-completed-item');
};

/**
* @param {resPayload} Object - checkEligibility response.
* @param {object} globals - global object
* @return {PROMISE}
*/
// eslint-disable-next-line no-unused-vars
function checkELigibilityHandler(resPayload1, globals) {
  // const resPayload = RESPONSE_PAYLOAD.response;
  const resPayload = resPayload1;
  const response = {};
  const formContext = getCurrentFormContext(globals);
  try {
    /* billed txn maximum amount select limt */
    formContext.tadMinusMadValue = ((parseFloat(resPayload.blockCode.tad) / 100) - (parseFloat(resPayload.blockCode.mad) / 100));
    /* continue btn disabling code added temorary, can be removed after form authoring */
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
    let ccBilledData = resPayload?.ccBilledTxnResponse?.responseString ? resPayload?.ccBilledTxnResponse?.responseString : [];
    let ccUnBilledData = resPayload?.ccUnBilledTxnResponse?.responseString ? resPayload?.ccUnBilledTxnResponse?.responseString : [];
    if (isNodeEnv) {
      ccBilledData = resPayload?.ccBilledTxnResponse || [];
      if (ccBilledData.length === 0) {
        customDispatchEvent('showErrorSnackbar', { errorMessage: ERROR_MSG.noEligibleTxnFlow }, globals);
        response.nextscreen = 'failure';
        return response;
      }
    } else {
      // Note: In whatsapp data is already sorted, format of billed and unbilled is different (rupee vs paisa) so sorting should not be done for WA.
      // apply sort by amount here to ccBilledData
      ccBilledData = sortDataByAmount(ccBilledData, 'amount');
      // apply sort by amount here to ccBilledData
      ccUnBilledData = sortDataByAmount(ccUnBilledData, 'amount');
    }
    formContext.EligibilityResponse = resPayload;
    globals.functions.setProperty(globals.form.runtime.currentFormContext, { value: JSON.stringify({ ...formContext }) });
    const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const unBilledTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const allTxn = ccBilledData.concat(ccUnBilledData);
    setTxnPanelData(allTxn, ccBilledData.length, ccUnBilledData.length, billedTxnPanel, unBilledTxnPanel, globals);
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_eligibleTxnLabel, { value: `Eligible Transactions (${allTxn?.length})` });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_TxnAvailable, { value: `Billed Transaction (${ccBilledData?.length})` });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_TxnAvailable, { value: `Unbilled Transaction (${ccUnBilledData?.length})` });
    // set runtime values
    globals.functions.setProperty(globals.form.runtime.originAcct, { value: formContext.EligibilityResponse.responseString.aanNumber });
    changeWizardView();
    // Display card and move wizard view
    if (!isNodeEnv) {
      cardDisplay(globals, resPayload);
      moveWizardView(domElements.semiWizard, domElements.chooseTransaction);
    }
    response.nextscreen = 'success';
    // show txn summery text value
    if ((ccUnBilledData.length) || (ccUnBilledData.length)) {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnsSummaryText, { visible: true });
    }
    // hide the unbilled / unbillled accordian if the response payload of txn is not present
    if (ccBilledData.length === 0) {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment, { visible: false });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList, { visible: false });
    }
    if (ccUnBilledData?.length === 0) {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment, { visible: false });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList, { visible: false });
    }
    return response;
  } catch (error) {
    response.nextscreen = 'failure';
    return response;
  }
}

const getLoanOptionsInfo = (responseStringJsonObj) => {
  // Loop through the periods, interests, and tids
  const keyPosInResponse = [1, 2, 3, 4, 5];
  const loanoptions = keyPosInResponse.map((el) => {
    const periodKey = `period${el === 1 ? '' : el}`;
    const interestKey = `interest${el === 1 ? '' : el}`;
    const tidKey = `tid${el === 1 ? '' : el}`;
    if (responseStringJsonObj[0][periodKey] !== undefined);
    return {
      period: responseStringJsonObj[0][periodKey],
      interest: responseStringJsonObj[0][interestKey],
      tid: responseStringJsonObj[0][tidKey],
      processingFee: responseStringJsonObj[0].memoLine1,
    };
  });
  return loanoptions;
};

/**
 * Sets the data for a specific tenure panel option
 * @param {object} globals - globals form object
 * @param {Array} panel - The array of tenure selection panels.
 * @param {object} option - option object containing details of emi, processing fee, roi
 * @param {number} i -The index of the current tenure
 */
const setDataTenurePanel = (globals, panel, option, i) => {
  globals.functions.setProperty(panel[i].aem_tenureSelection, { enumNames: [option?.period] });
  globals.functions.setProperty(panel[i].aem_tenure_display, { value: option?.period }); // - > temporray fix
  // globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.test, { enum: [0], enumNames: ['test'] });
  // globals.functions.setProperty(panel[i].aem_tenureSelection, { enum: [0], enumNames: [option?.period] });
  /* */
  // const monthlyEmi = `${MISC.rupeesUnicode} ${Number(clearString(option?.monthlyEMI))}`;
  // const processingFees = `${MISC.rupeesUnicode} ${option?.procesingFee}`;
  const monthEmiNumVal = Number(clearString(option?.monthlyEMI));
  const emiAmt = `${MISC.rupeesUnicode} ${nfObject.format(monthEmiNumVal)}`;
  const procesFees = `${MISC.rupeesUnicode} ${nfObject.format(option?.procesingFee)}`;
  globals.functions.setProperty(panel[i].aem_tenureSelectionEmi, { value: emiAmt });
  globals.functions.setProperty(panel[i].aem_tenureSelectionProcessing, { value: procesFees });
  globals.functions.setProperty(panel[i].aem_roi_monthly, { value: option?.roiMonthly });
  globals.functions.setProperty(panel[i].aem_roi_annually, { value: option?.roiAnnually });
  /* emi substance incldes tid, period, interest without parsed which required for ccSmart emi payload */
  const emiSubstance = JSON.stringify(option?.emiSubStance);
  globals.functions.setProperty(panel[i].aem_tenureRawData, { value: emiSubstance });
};

const tenureOption = (loanOptions, loanAmt) => {
  const arrayOptions = loanOptions?.map((option) => {
    const roiMonthly = ((parseInt(option.interest, 10) / 100) / 12).toFixed(2);
    const roiAnnually = currencyUtil(parseFloat(option?.interest), 2);
    const monthlyEMI = nfObject.format(calculateEMI(loanAmt, roiMonthly, parseInt(option.period, 10)));
    const period = `${parseInt(option.period, 10)} Months`;
    const procesingFee = nfObject.format(option.processingFee);
    const emiSubStance = option;
    return ({
      ...option,
      procesingFee,
      period,
      monthlyEMI,
      roiAnnually,
      roiMonthly,
      emiSubStance,
    });
  });
  return arrayOptions;
};

const getTotalAmount = (globals) => {
  const semiFormData = globals.functions.exportData().smartemi;
  const selectedTxnList = (semiFormData?.aem_billedTxn?.aem_billedTxnSelection?.concat(semiFormData?.aem_unbilledTxn?.aem_unbilledTxnSection))?.filter((txn) => txn.aem_Txn_checkBox === 'on');
  const totalAmountOfTxn = selectedTxnList?.reduce((prev, acc) => prev + parseFloat(acc.aem_TxnAmt.replace(/[^\d.-]/g, '')), 0);
  currentFormContext.SMART_EMI_AMOUNT = totalAmountOfTxn;
  return totalAmountOfTxn;
};

/**
 * Setting essential hidden fields for reports
 * @param {Array} selectedTxnList
 * @param {string} dispAmt
 * @param {Object} globals
 */
const setReporthiddenFields = (selectedTxnList, dispAmt, globals) => {
  let combinedTransactionType = '';
  let hiddenBilledAmt = 0;
  let hiddenUnbilledAmt = 0;
  const allTxnTypes = selectedTxnList.map((el) => ({
    amt: Number(String(el.aem_TxnAmt).replace(/[^\d]/g, '') / 100),
    typ: el.aem_txn_type,
  })) || [];
  const mapTypes = allTxnTypes?.map((el) => el.typ);
  const mapAmt = allTxnTypes?.map((el) => el.amt);
  if (mapTypes.every((el) => el === 'BILLED')) {
    combinedTransactionType = 'Billed';
    hiddenBilledAmt = Number(mapAmt?.reduce((prev, acc) => prev + acc, 0));
  } else if (mapTypes.every((el) => el === 'UNBILLED')) {
    combinedTransactionType = 'Unbilled';
    hiddenUnbilledAmt = Number(mapAmt?.reduce((prev, acc) => prev + acc, 0));
  } else if (mapTypes.includes('BILLED') && mapTypes.includes('UNBILLED')) {
    combinedTransactionType = 'Both';
    hiddenBilledAmt = Number(allTxnTypes?.map((el) => (el.typ === 'BILLED') && el.amt)?.reduce((prev, acc) => prev + acc, 0));
    hiddenUnbilledAmt = Number(allTxnTypes?.map((el) => (el.typ === 'UNBILLED') && el.amt)?.reduce((prev, acc) => prev + acc, 0));
  } else {
    combinedTransactionType = 'none';
  }
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.combinedTransactionType, { value: combinedTransactionType });
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.hiddenUnBilledTotal, { value: hiddenUnbilledAmt });
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.hiddenBilledTotal, { value: hiddenBilledAmt });
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_success.smartEMIAmountHidden, { value: Number(String(dispAmt)?.replace(/[^\d]/g, '')) });
};

/**
 * Updates the UI to display the selected transaction amount for SmartEMI and pre-selects the last tenure option.
 * @param {object} globals - global form object
 */
const tenureDisplay = (globals) => {
  const tenureRepatablePanel = globals.form.aem_semiWizard.aem_selectTenure.aem_tenureSelectionMainPnl.aem_tenureSelectionRepeatablePanel;
  const semiFormData = globals.functions.exportData().smartemi;
  const selectedTxnList = (semiFormData?.aem_billedTxn?.aem_billedTxnSelection?.concat(semiFormData?.aem_unbilledTxn?.aem_unbilledTxnSection))?.filter((txn) => txn.aem_Txn_checkBox === 'on');
  const totalAmountOfTxn = selectedTxnList?.reduce((prev, acc) => prev + parseFloat((String(acc.aem_TxnAmt)).replace(/[^\d.-]/g, '')), 0);
  const totalAmountSelected = (parseInt(totalAmountOfTxn, 10));
  // Reading context value from hidden field
  // eslint-disable-next-line no-underscore-dangle
  const _context = getCurrentFormContext(globals);
  const loanArrayOption = getLoanOptionsInfo(_context.EligibilityResponse?.responseString?.records);
  const tenureArrayOption = tenureOption(loanArrayOption, totalAmountSelected);
  const LABEL_AMT_SELCTED = 'Amount selected for SmartEMI';
  const DISPLAY_TOTAL_AMT = `${MISC.rupeesUnicode} ${nfObject.format(totalAmountSelected)}`;
  const TOTAL_AMT_IN_WORDS = `${numberToText(totalAmountOfTxn)}`;
  /* set the total amount in hidden field - thank u scrren */
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_success.aem_hiddenTotalAmt, { value: DISPLAY_TOTAL_AMT });
  /* hidden fields to set for reports */
  /* display amount */
  if (!isNodeEnv) {
    globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_customerNameLabel, { value: LABEL_AMT_SELCTED });
    globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_outStandingLabel, { value: DISPLAY_TOTAL_AMT });
    globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_outStandingAmt, { value: `${MISC.rupeesUnicode} ${TOTAL_AMT_IN_WORDS}` });
  }
  /* set hidden field values for report */
  setReporthiddenFields(selectedTxnList, DISPLAY_TOTAL_AMT, globals);
  /* pre-select the last tenure option (radio btn) by default */
  const DEFUALT_SELCT_TENURE = (tenureRepatablePanel.length > 0) ? (tenureRepatablePanel.length - 1) : 0;
  globals.functions.setProperty(tenureRepatablePanel[DEFUALT_SELCT_TENURE].aem_tenureSelection, { value: '0' });
  /* discount */
  // const discount = globals.form.aem_semiWizard.aem_selectTenure.discount.$value; ///
  // const calcDiscount = ((Number().toFixed(2)) - (Number(discount) / 100));
  // const roi = parseFloat(globals.form.aem_semiWizard.aem_selectTenure.aem_ROI.$value) + calcDiscount;
  // const roiPercentage = `${roi.toFixed(2)}%`;
  // globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_ROI, { value: roiPercentage });
  /* set data for tenure panel */
  tenureArrayOption?.forEach((option, i) => {
    setDataTenurePanel(globals, tenureRepatablePanel, option, i);
  });

  // setting data to display on whatsapp flow
  const procesFees = tenureArrayOption[0]?.procesingFee;
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_flow_processingFees, { value: `${MISC.rupeesUnicode} ${nfObject.format(procesFees)}` });
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_flowDisplayTotalAmountSelected, { value: `Rs ${nfObject.format(totalAmountSelected)}/-` });
};

/**
 * Continue button on choose transactions.
 *
 * @param {Object} globals - Global variables and functions.
 */
function selectTenure(globals) {
  if (currentFormContext.totalSelect < DATA_LIMITS.totalSelectLimit) {
    tnxPopupAlertOnce += 1;
  }
  if (!isNodeEnv && (tnxPopupAlertOnce === 1)) { // option of selecting ten txn alert should be occured only once.
    const MSG = 'Great news! You can enjoy the flexibility of converting up to 10 transactions into EMI.';
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: MSG });
  } else {
    if (!isNodeEnv) {
      moveWizardView(domElements.semiWizard, domElements.selectTenure);
      handleMdmUtmParam(globals);
    }
    tenureDisplay(globals);
  }
}
let selectTopTenFlag = false;
let isUserSelection = false;
/**
 * function sorts the billed / Unbilled Txn  array in based on the orderBy field
 * @param {string} txnType  - BILLED /  UNBILLED
 * @param {string} orderBy - orderby amount or date
 */
function sortData(txnType, orderBy, globals) {
  isUserSelection = !isUserSelection;
  if (!txnType) return;
  // orderBy - 0 - amount ; 1 - date
  const BILLED_FRAG = 'billedTxnFragment';
  const UNBILLED_FRAG = 'unbilledTxnFragment';
  const TXN_FRAG = txnType === 'BILLED' ? BILLED_FRAG : UNBILLED_FRAG;
  const pannel = globals.form.aem_semiWizard.aem_chooseTransactions?.[`${TXN_FRAG}`].aem_chooseTransactions.aem_TxnsList;
  const billed = globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection;
  const unBilled = globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection;
  const dataTxnList = txnType === 'BILLED' ? billed : unBilled;
  const sortedData = (orderBy === '0') ? sortDataByAmountSymbol(dataTxnList) : sortByDate(dataTxnList);
  const mapSortedDat = sortedData?.map((item) => ({
    ...item,
    aem_TxnAmt: (currencyStrToNum(item?.aem_TxnAmt)),
  }));
  try {
    mapSortedDat?.forEach((_data, i) => {
      const data = {
        ..._data,
        type: txnType,
      };
      const delay = DELAY + (DELTA_DELAY * i);
      setTimeout(() => {
        setData(globals, pannel, data, i);
      }, delay);
    });
    userPrevSelect.prevTxnType = 'SORT_BY';
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error, 'sortEr');
  }
  setTimeout(() => {
    isUserSelection = !isUserSelection;
  }, 1000);
}

/**
 * disable the unselected fields of transaction from billed or unbilled.
 * @param {Array} txnList - array of repeatable pannel
 * @param {boolean} allCheckBoxes - array of repeatable pannel
 * @param {object} globals - global object
 */
const disableCheckBoxes = (txnList, allCheckBoxes, globals) => {
  if (allCheckBoxes)isUserSelection = !isUserSelection;
  txnList?.forEach((item) => {
    if (item.aem_Txn_checkBox.$value === 'on' && !allCheckBoxes) {
      globals.functions.setProperty(item.aem_Txn_checkBox, { enabled: true });
    } else {
      globals.functions.setProperty(item.aem_Txn_checkBox, { value: undefined });
      globals.functions.setProperty(item.aem_Txn_checkBox, { enabled: false });
    }
  });
};

/**
 * enable all fields of transaction from billed or unbilled.
 * @param {Array} txnList - array of repeatable pannel
 * @param {object} globals - global object
 */
const enableAllTxnFields = (txnList, globals) => txnList?.forEach((list) => globals.functions.setProperty(list.aem_Txn_checkBox, { enabled: true }));
/**
 * disable all fields of transaction from billed or unbilled.
 * @param {Array} txnList - array of repeatable pannel
 * @param {object} globals - global object
 */
const disableAllTxnFields = (txnList, globals) => txnList?.forEach((list) => globals.functions.setProperty(list.aem_Txn_checkBox, { enabled: (list.aem_Txn_checkBox.$value === 'on') }));

/**
 * function will be triggered on click of ok button of tag/mad alert
 * Unselect the previous checkbox value if it reaches the tad/ mad calculation.
 * @param {object} globals - global form object.
 */
const handleTadMadAlert = (globals) => {
  const prevSelectedRowData = userPrevSelect.txnRowData;
  if (userPrevSelect.prevTxnType === 'SELECT_TOP') {
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: false });
    const billedList = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const mapBiledList = billedList?.map((el) => ({ checkVal: el.aem_Txn_checkBox.$value, amtVal: (Number(String(el.aem_TxnAmt.$value).replace(/[^\d]/g, '')) / 100), id: el.aem_TxnID.$value }));
    let billedTotal = currentFormContext.sumOfbilledTxnOnly;

    /* track selected index calculate break point for tad-mad */
    let breakReducer = null;
    const mapBiledSelected = mapBiledList?.filter((el) => el.checkVal);
    const trackLastIndex = mapBiledSelected?.reduceRight((acc, curr, i) => {
      billedTotal -= curr.amtVal;
      if (billedTotal < currentFormContext.tadMinusMadValue) {
        if (!breakReducer) {
          breakReducer = i;
          if (breakReducer) {
            acc.push(i);
          }
        }
      } else {
        acc.push(i);
      }
      return acc;
    }, []);

    /* unselect each billed values based on tracklastIndex */
    trackLastIndex?.forEach(async (selectedIndex) => globals.functions.setProperty(billedList[selectedIndex].aem_Txn_checkBox, { value: undefined }));

    /* Select Top Ten Handling - After unchecking the billed items based on the TAD-MAD value, if the user has selected 'Top Ten',
     the 'Select Top Ten' functionality should apply to the remaining available unbilled transaction list */
    const prevSelectedBilled = mapBiledSelected;
    const billedSelected = prevSelectedBilled.length - trackLastIndex.length;
    const availableToSelectInUnbilled = userPrevSelect.txnAvailableToSelectInTopTen - billedSelected;
    if (availableToSelectInUnbilled) {
      const unbilledSortByAmt = sortDataByAmount(globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection);
      const unbilledAvailableToselect = unbilledSortByAmt?.slice(0, availableToSelectInUnbilled);
      const unbilledPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
      const billedPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
      try {
        unbilledAvailableToselect?.forEach((item) => {
          const foundMatch = unbilledPanel.find((el) => (el.aem_TxnAmt.$value === item.aem_TxnAmt) && ((el.aem_TxnDate.$value === item.aem_TxnDate) && (el.aem_TxnName.$value === item.aem_TxnName) && (el.logicMod.$value === item.logicMod) && (el.aem_TxnID.$value === item.aem_TxnID)));
          globals.functions.setProperty(foundMatch.aem_Txn_checkBox, { value: 'on', enabled: true });
        });
        if ((availableToSelectInUnbilled + billedSelected) === DATA_LIMITS.totalSelectLimit) { // selected top ten
          userPrevSelect.tadMadReachedTopTen = true;
          setTimeout(() => {
            disableCheckBoxes(billedPanel, false, globals);
            disableCheckBoxes(unbilledPanel, false, globals);
            userPrevSelect.tadMadReachedTopTen = false;
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
      }
    }
    /* */
    userPrevSelect.prevTxnType = null;
    return;
  }
  const BILLED_FRAG = 'billedTxnFragment';
  const UNBILLED_FRAG = 'unbilledTxnFragment';
  const TXN_FRAG = (userPrevSelect.prevTxnType === 'BILLED') ? BILLED_FRAG : UNBILLED_FRAG;

  const txnList = globals.form.aem_semiWizard.aem_chooseTransactions[`${TXN_FRAG}`].aem_chooseTransactions.aem_TxnsList;
  if (currentFormContext.sumOfbilledTxnOnly > currentFormContext.tadMinusMadValue) {
    const txnArrayList = txnList?.map((el) => ({ checkVal: el.aem_Txn_checkBox.$value, amtVal: el.aem_TxnAmt.$value, id: el.aem_TxnID.$value }));
    const findExactSelect = txnList?.find((el) => (prevSelectedRowData?.txnAmt === el.aem_TxnAmt.$value) && (prevSelectedRowData?.txnDate === el.aem_TxnDate.$value) && (prevSelectedRowData?.txnId === el.aem_TxnID.$value) && (prevSelectedRowData?.txnType === el.aem_txn_type.$value));
    const indexOfPrevSelect = txnArrayList.findIndex((el) => el.id === findExactSelect.aem_TxnID.$value);
    globals.functions.setProperty(txnList[indexOfPrevSelect].aem_Txn_checkBox, { value: undefined });
  }
};

/**
 * getSelectedCount
 * get the total count of txn selected both billed and unbilled.
 * @param {object} globals - global form object.
 * @returns {object} - returns selectedbilledCount, selectedUnbilledCount, totallySelectedCount
 */
const getSelectedCount = (globals) => {
  const billedData = globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection;
  const unbilledData = globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection;
  const totalSelectCount = billedData.concat(unbilledData).filter((el) => el.aem_Txn_checkBox).length;
  const billedSelectCount = billedData.filter((el) => el.aem_Txn_checkBox)?.length;
  const unBilledSelectCount = unbilledData.filter((el) => el.aem_Txn_checkBox)?.length;
  currentFormContext.TXN_SELECTED_COUNTS = {
    billed: billedSelectCount,
    unBilled: unBilledSelectCount,
    total: totalSelectCount,
  };
  return ({
    billed: billedSelectCount,
    unBilled: unBilledSelectCount,
    total: totalSelectCount,
  });
};

/**
* function to update number of transaction selected.
* @param {string} checkboxVal
* @param {number} amount
* @param {string} ID
* @param {date} date
* @param {string} txnType
* @name txnSelectHandler
*/
function txnSelectHandler(checkboxVal, amount, ID, date, txnType, globals) {
  /* enable-popup once it reaches BILLED-MAX-AMT-LIMIT */

  const formContext = getCurrentFormContext(globals);
  const billedTxnList = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
  const unbilledTxnList = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
  const MAX_SELECT = 10;
  const BILLED_FRAG = 'billedTxnFragment';
  const UNBILLED_FRAG = 'unbilledTxnFragment';
  const TXN_FRAG = txnType === 'BILLED' ? BILLED_FRAG : UNBILLED_FRAG;
  const COUNT = getSelectedCount(globals);
  const txnSelected = globals.form.aem_semiWizard.aem_chooseTransactions?.[`${TXN_FRAG}`].aem_chooseTransactions.aem_txnHeaderPanel.aem_txnSelected;
  const SELECTED = `${(txnType === 'BILLED') ? COUNT?.billed : COUNT?.unBilled} Selected`;
  /* popup alert hanldles for the tad-mad values */
  const sumOfbilledTxnOnly = billedTxnList?.filter((el) => {
    // In case of Web only billed transaction is displayed on billedTxn panel but in whatsapp both billed and unbilled are displayed
    if (isNodeEnv) {
      return el.aem_Txn_checkBox.$value && el.aem_txn_type.$value === 'billed';
    }
    return el.aem_Txn_checkBox.$value;
  })?.reduce((acc, prev) => (acc + Number(String(prev.aem_TxnAmt.$value).replace(/[^\d]/g, '') / 100)), 0);
  formContext.sumOfbilledTxnOnly = sumOfbilledTxnOnly;
  if (sumOfbilledTxnOnly) {
    /* popup alert hanldles */
    const selectedTotalTxn = globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection.filter((el) => el.aem_Txn_checkBox).length + globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection.filter((el) => el.aem_Txn_checkBox).length;
    if (sumOfbilledTxnOnly > formContext.tadMinusMadValue) {
      const SELECTED_MAX_BILL = ` Please select Billed Transactions Amount Max up to Rs.${nfObject.format(formContext.tadMinusMadValue)}`;
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: SELECTED_MAX_BILL });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation1, { visible: false });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
      /* disabling selected fields in case disabled */
      disableAllTxnFields(unbilledTxnList, globals);
      disableAllTxnFields(billedTxnList, globals);

      // display error message in whatsapp flow
      customDispatchEvent('showErrorSnackbar', { errorMessage: SELECTED_MAX_BILL }, globals);

      formContext.totalSelect = COUNT?.total;
      userPrevSelect.txnRowData = {
        txnCheck: checkboxVal,
        txnAmt: amount,
        txnId: ID,
        txnDate: date,
        txnType,
      };
      if (userPrevSelect.prevTxnType === 'SELECT_TOP') {
        userPrevSelect.prevTxnType = 'SELECT_TOP';
      } else {
        userPrevSelect.prevTxnType = txnType;
      }
      const TOTAL_SELECT = `Total selected ${formContext.totalSelect}/${MAX_SELECT}`;
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });// total no of select billed or unbilled txn list
      globals.functions.setProperty(txnSelected, { value: SELECTED }); // set number of select in billed or unbilled txn list
      return;
    }
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: true });
    /* enabling selected fields in case disabled */
    enableAllTxnFields(unbilledTxnList, globals);
    enableAllTxnFields(billedTxnList, globals);
    formContext.totalSelect = selectedTotalTxn;
    const TOTAL_SELECT = `Total selected ${formContext.totalSelect}/${MAX_SELECT}`;
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });// total no of select billed or unbilled txn list
    globals.functions.setProperty(txnSelected, { value: SELECTED }); // set number of select in billed or unbilled txn list
    // return;
  }

  /* enable alert message if the user exceed selecting the txn above 10 laksh. */
  const totalSelectTxnAmt = getTotalAmount(globals);
  const emiProceedCheck = (totalSelectTxnAmt <= formContext.txnSelectExceedLimit);
  if (!emiProceedCheck) {
    const alertMsg = 'You can select up to Rs 10 lacs. To proceed further please unselect some transaction.';
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: alertMsg });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation1, { visible: false });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
    // display error message in whatsapp flow
    customDispatchEvent('showErrorSnackbar', { errorMessage: alertMsg }, globals);
    return;
  }
  customDispatchEvent('showErrorSnackbar', { errorMessage: undefined }, globals);
  // null || ON
  if (selectTopTenFlag || isUserSelection) return;
  globals.functions.setProperty(txnSelected, { value: SELECTED }); // set number of select in billed or unbilled txn list
  formContext.totalSelect = COUNT?.total;
  const TOTAL_SELECT = `Total selected ${formContext.totalSelect}/${MAX_SELECT}`;
  if ((formContext.totalSelect <= MAX_SELECT)) {
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });// total no of select billed or unbilled txn list
  }
  if (formContext.totalSelect < MAX_SELECT) {
    /* enabling selected fields in case disabled */
    enableAllTxnFields(unbilledTxnList, globals);
    enableAllTxnFields(billedTxnList, globals);
  }
  if ((formContext.totalSelect === MAX_SELECT) && (!userPrevSelect.tadMadReachedTopTen)) {
    /* popup alert hanldles */
    const CONFIRM_TXT = 'You can select up to 10 transactions at a time, but you can repeat the process to convert more transactions into SmartEMI.';
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: CONFIRM_TXT });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation1, { visible: true });
    /* disabling unselected checkBoxes */
    disableCheckBoxes(unbilledTxnList, false, globals);
    disableCheckBoxes(billedTxnList, false, globals);
  }
  /* enable disable select-tenure continue button */
  if ((formContext.totalSelect === 0) || (!emiProceedCheck)) {
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
  } else if ((formContext.totalSelect > 0) || (emiProceedCheck)) {
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: true });
  }
}

/**
   * Switches the visibility of panels in the card wizard interface.
   * @name semiWizardSwitch to switch panel visibility
   * @param {string} source -  The source of the card wizard (e.g., 'aem_semiWizard' - parent).
   * @param {string} target -  The target panel to switch to (e.g., 'aem_selectTenure' or 'aem_chooseTransactions').
   * @param {string} current-  The current view before switching.
   * @param {object} global -  global form object
   * @returns {void}
   */
const semiWizardSwitch = (source, target, current, globals) => {
  /* reset the value of card display while coming back from tenure section */
  if ((target === domElements.chooseTransaction) && (current === domElements.selectTenure)) {
    const LABEL_OUTSTANDING_AMT = 'Your Total Outstanding Amount is';
    const CUST_NAME_LABEL = `Dear ${currentFormContext.EligibilityResponse?.cardHolderName}`;
    const TOTAL_OUTSTANDING_AMT = currentFormContext.totalOutstandingAmount;
    globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_customerNameLabel, { value: CUST_NAME_LABEL });
    globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_outStandingAmt, { value: TOTAL_OUTSTANDING_AMT });
    globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_outStandingLabel, { value: LABEL_OUTSTANDING_AMT });
  }
  return (!isNodeEnv) && moveWizardView(source, target);
};

/**
 * select top txnlist
* @param {object} globals - global object
 */
function selectTopTxn(globals) {
  selectTopTenFlag = !selectTopTenFlag;
  userPrevSelect.prevTxnType = 'SELECT_TOP';
  const SELECT_TOP_TXN_LIMIT = 10;
  const resPayload = currentFormContext.EligibilityResponse;
  const billedResData = resPayload?.ccBilledTxnResponse?.responseString;
  const unBilledResData = resPayload?.ccUnBilledTxnResponse?.responseString;
  const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
  const unBilledTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
  const billed = billedResData?.length ? globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection : [];
  const unBilled = unBilledResData?.length ? globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection : [];
  const allTxn = billed.concat(unBilled);
  const sortedArr = sortDataByAmountSymbol(allTxn);
  const txnAvailableToSelect = (allTxn?.length >= SELECT_TOP_TXN_LIMIT) ? SELECT_TOP_TXN_LIMIT : allTxn?.length;
  userPrevSelect.txnAvailableToSelectInTopTen = txnAvailableToSelect;
  const sortedTxnList = sortedArr?.slice(0, txnAvailableToSelect);
  let unbilledCheckedItems = 0;
  let billedCheckedItems = 0;
  const topSelectByAmt = sortedArr?.slice(0, txnAvailableToSelect);
  try {
    [unBilledTxnPanel, billedTxnPanel]?.forEach((pannel) => {
      pannel?.forEach((txnList) => globals.functions.setProperty(txnList.aem_Txn_checkBox, { enabled: false, value: undefined }));
    });
    topSelectByAmt?.forEach((item) => {
      let pannel;
      if ((item.aem_txn_type === 'BILLED')) {
        pannel = billedTxnPanel;
        billedCheckedItems += 1;
      } else {
        pannel = unBilledTxnPanel;
        unbilledCheckedItems += 1;
      }
      const findAllAmtMatch = pannel.filter((el) => (el.aem_TxnAmt.$value === item.aem_TxnAmt) && ((el.aem_TxnDate.$value === item.aem_TxnDate) && (el.aem_TxnName.$value === item.aem_TxnName) && (el.logicMod.$value === item.logicMod)));
      findAllAmtMatch?.forEach((matchedAmt) => globals.functions.setProperty(matchedAmt.aem_Txn_checkBox, { value: 'on', enabled: true }));
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error, 'error in select top ten');
  }

  const billedTxnSelected = globals.form.aem_semiWizard.aem_chooseTransactions?.billedTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_txnSelected;
  const unbilledTxnSelected = globals.form.aem_semiWizard.aem_chooseTransactions?.unbilledTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_txnSelected;
  globals.functions.setProperty(billedTxnSelected, { value: `${billedCheckedItems} Selected` });
  globals.functions.setProperty(unbilledTxnSelected, { value: `${unbilledCheckedItems} Selected` });
  currentFormContext.totalSelect = sortedTxnList.length;
  const TOTAL_SELECT = `Total selected ${currentFormContext.totalSelect}/${sortedTxnList.length}`;
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });
  globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: true });
  setTimeout(() => {
    selectTopTenFlag = !selectTopTenFlag;
  }, 1000);
}

/**
* Commits the selected radio button value and updates the UI with the corresponding rate of interest.
* @param {object} arg1
* @param {object} globals - global object
*/
function radioBtnValCommit(arg1, globals) {
  if (arg1?.$value) {
    const selectedQlyFormValue = arg1?.$qualifiedName?.substring(1); // "form.aem_semiWizard.aem_selectTenure.aem_tenureSelectionMainPnl.aem_tenureSelectionRepeatablePanel[2].aem_tenureSelection"
    const selectedIndex = Number(selectedQlyFormValue?.match(/\d+/g)?.[0]); // 0, 1, 2 or 3 indicates the index of the selected
    const radioBtnOption = globals.form.aem_semiWizard.aem_selectTenure.aem_tenureSelectionMainPnl.aem_tenureSelectionRepeatablePanel;
    const tenureData = globals.functions.exportData().aem_tenureSelectionRepeatablePanel;
    radioBtnOption?.forEach((item, i) => {
      if (selectedIndex === i) {
        globals.functions.setProperty(item.aem_tenureSelection, { value: '0' });
        /* set roi based on radio select */
        const roiMonthly = `${Number(tenureData[i].aem_roi_monthly).toFixed(2)} %`;
        const roiAnnually = `${tenureData[i].aem_roi_annually}% per annum`;
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_ROI, { value: roiMonthly });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.rateOfInterestPerAnnumValue, { value: roiAnnually });
        // /* discount */
        // const discount = globals.form.aem_semiWizard.aem_selectTenure.discount.$value; ///
        // const calcDiscount = ((Number(tenureData[i].aem_roi_monthly).toFixed(2)) - (Number(discount) / 100));
        // const roiMonthly = `${calcDiscount.toFixed(2)} %`;
        // const roiAnnually = `${tenureData[i].aem_roi_annually}% per annum`;
        // globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_ROI, { value: roiMonthly });
        // globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.rateOfInterestPerAnnumValue, { value: roiAnnually });

        /* set the same data for review panel screen - whatsapp flow. */
        const rawTenureData = JSON.parse(tenureData[i].aem_tenureRawData);
        const duration = `${parseInt(rawTenureData.period, 10)} Months`;
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_reviewAmount, { value: `${MISC.rupeesUnicode} ${nfObject.format(getTotalAmount(globals))}` });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_monthlyEmi, { value: `${tenureData[i].aem_tenureSelectionEmi} @ ${roiMonthly}` });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_duration, { value: duration });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_roi, { value: roiMonthly });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_processingFee, { value: tenureData[i].aem_tenureSelectionProcessing });
      } else {
        globals.functions.setProperty(item.aem_tenureSelection, { value: null });
      }
    });
  }
}

/**
 * Generates an EMI conversion array option for the ccsmart API payload.
 * @param {object} globals - global form object
 * @returns {Array<Object>}
 */
const getEmiArrayOption = (globals) => {
  const semiFormData = globals.functions.exportData().smartemi;
  const selectedTxnList = (semiFormData?.aem_billedTxn?.aem_billedTxnSelection?.concat(semiFormData?.aem_unbilledTxn?.aem_unbilledTxnSection))?.filter((txn) => txn.aem_Txn_checkBox === 'on');
  const CARD_SEQ = globals.form.runtime.cardSeq.$value;
  const PLAN = globals.form.runtime.plan.$value;
  const ORIG_ACCOUNT = globals.form.runtime.originAcct.$value || getCurrentFormContext()?.EligibilityResponse.responseString.aanNumber;
  const mappedTxnArray = selectedTxnList?.map(((el) => ({
    authCode: el?.authCode ?? '',
    cardSeq: CARD_SEQ,
    effDate: clearString(el?.aem_TxnDate),
    logicMod: el?.logicMod,
    itemNbr: el?.aem_TxnID,
    tranAmt: Number((String(el?.aem_TxnAmt))?.replace(/[^\d]/g, '')),
    txnDesc: el?.aem_TxnName,
    plan: PLAN,
    originAcct: ORIG_ACCOUNT,
  })));
  return mappedTxnArray;
};

/**
 * Generates payload for the WhatsApp flow.
 * @param {object} responseString - responseString
 * @param {object} globals - globals form object
 * @returns {Promise<Object>} - A promise that resolves to the JSON response from the ccsmart API.
 */
const getFlowSuccessPayload = (responseString, globals) => {
  const loanNbr = responseString?.loanNbr;
  // TODO: repeated code, needed to avoid recomputation
  const emiConversionArray = getEmiArrayOption(globals);
  const loanAmount = emiConversionArray?.reduce((prev, acc) => prev + acc.tranAmt, 0);
  const loanAmountInInr = `${nfObject.format(loanAmount / 100)}`;
  // const LOAN_AMOUNT = String(emiConversionArray?.reduce((prev, acc) => prev + acc.tranAmt, 0));
  const tenurePlan = globals.functions.exportData().aem_tenureSelectionRepeatablePanel;
  const selectedTenurePlan = tenurePlan?.find((emiPlan) => emiPlan.aem_tenureSelection === '0');
  const emiSubData = JSON.parse(selectedTenurePlan?.aem_tenureRawData);
  const PROC_FEES = String(currencyStrToNum(selectedTenurePlan?.aem_tenureSelectionProcessing));
  const TENURE = (parseInt(emiSubData?.period, 10).toString().length === 1) ? (parseInt(emiSubData?.period, 10).toString().padStart(2, '0')) : parseInt(emiSubData?.period, 10).toString(); // '003' into '03' / '18'-'18'

  return {
    amount: loanAmountInInr,
    tenureMonths: TENURE,
    rateOfInterest: selectedTenurePlan?.aem_roi_monthly,
    annualRateOfInterest: selectedTenurePlan?.aem_roi_annually,
    processingFees: PROC_FEES,
    monthlyEMI: String(currencyStrToNum(selectedTenurePlan?.aem_tenureSelectionEmi)),
    loanReferenceNumber: loanNbr,
    billingCycle: getBillingCycleDate(Number(getCurrentFormContext(globals)?.EligibilityResponse?.blockCode?.billingCycle)),
  };
};

/**
 * Generates and sends an EMI conversion request payload for the ccsmart API.
 * @param {string} mobileNum - mobile number
 * @param {string} cardNum - card digit number
 * @param {string} otpNum - otp number
 * @param {object} globals - globals form object
 * @returns {Promise<Object>} - A promise that resolves to the JSON response from the ccsmart API.
 */
const getCCSmartEmi = (mobileNum, cardNum, otpNum, globals) => {
  const AGENCY_CODE = 'Adobe Webforms';
  const MEM_CATEGORY = 'Adobe Webforms';
  const MEM_SUB_CAT = 'Adobe';
  const MEMO_LINE_4 = 'Adobe';
  const MEMO_LINE_5 = 'Adobe';
  const LTR_EXACT_CODE = 'Y  ';
  const DEPT = 'IT';
  const emiConversionArray = getEmiArrayOption(globals);
  const REQ_NBR = String(emiConversionArray?.length === 1) ? ((String(emiConversionArray?.length)).padStart(2, '0')) : (String(emiConversionArray?.length)); // format '01'? or '1'
  const LOAN_AMOUNT = String(emiConversionArray?.reduce((prev, acc) => prev + acc.tranAmt, 0));
  // eslint-disable-next-line no-underscore-dangle
  const _context = getCurrentFormContext(globals);
  const eligibiltyResponse = _context.EligibilityResponse;
  const tenurePlan = globals.functions.exportData().aem_tenureSelectionRepeatablePanel;
  const selectedTenurePlan = tenurePlan?.find((emiPlan) => emiPlan.aem_tenureSelection === '0');
  const emiSubData = JSON.parse(selectedTenurePlan?.aem_tenureRawData);
  const PROC_FEES = String(currencyStrToNum(selectedTenurePlan?.aem_tenureSelectionProcessing));
  const INTEREST = emiSubData?.interest; // '030888'
  const TENURE = (parseInt(emiSubData?.period, 10).toString().length === 1) ? (parseInt(emiSubData?.period, 10).toString().padStart(2, '0')) : parseInt(emiSubData?.period, 10).toString(); // '003' into '03' / '18'-'18'
  const TID = emiSubData?.tid; // '000000101'
  const jsonObj = {
    requestString: {
      cardNo: cardNum,
      OTP: otpNum,
      proCode: PRO_CODE,
      prodId: eligibiltyResponse.responseString.records[0].prodId,
      agencyCode: AGENCY_CODE,
      tenure: TENURE,
      interestRate: INTEREST,
      encryptedToken: eligibiltyResponse.responseString.records[0].encryptedToken,
      loanAmt: LOAN_AMOUNT,
      ltrExctCode: LTR_EXACT_CODE,
      caseNumber: mobileNum,
      dept: DEPT,
      memCategory: MEM_CATEGORY,
      memSubCat: MEM_SUB_CAT,
      memoLine4: MEMO_LINE_4,
      memoLine5: MEMO_LINE_5,
      mobileNo: mobileNum,
      tid: TID,
      reqAmt: LOAN_AMOUNT,
      procFeeWav: PROC_FEES,
      reqNbr: REQ_NBR,
      emiConversion: emiConversionArray,
      journeyID: globals.form.runtime.journeyId.$value,
      journeyName: globals.form.runtime.journeyName.$value,
      ...(!isNodeEnv && { userAgent: window.navigator.userAgent }),
    },
  };
  const path = semiEndpoints.ccSmartEmi;
  if (!isNodeEnv) displayLoader();
  // For whatsapp flow visibility controlled via custom property so need to ensure on resend/submit button click property is updated.
  handleResendOtp2VisibilityInFlow(globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2.aem_resendOtpCount2.$value, globals);
  return fetchJsonResponse(path, jsonObj, 'POST', !isNodeEnv);
};

/**
 * otp timer logic to handle based on the screen of otp
 * @param {string} - otp pannel - firstotp or secondotp
 * @param {object} globals - global form object
 */
const otpTimerV1 = (pannelName, globals) => {
  if (isNodeEnv) return;
  let sec = DATA_LIMITS.otpTimeLimit;
  let dispSec = DATA_LIMITS.otpTimeLimit;
  const FIRST_PANNEL_OTP = 'firstotp';
  const SECOND_PANNEL_OTP = 'secondotp';
  const panelOtp = {
    otpTimerPanel: null,
    otpTimerSecond: null,
    resendOtp: null,
    limitCheck: null,
  };
  if (pannelName === FIRST_PANNEL_OTP) {
    const otp1 = globals.form.aem_semiWizard.aem_identifierPanel.aem_otpPanel.otpPanel;
    panelOtp.otpTimerSecond = otp1.secondsPanel.seconds;
    panelOtp.otpTimerPanel = otp1.secondsPanel;
    panelOtp.resendOtp = otp1.aem_otpResend;
    panelOtp.limitCheck = resendOtpCount < DATA_LIMITS.maxOtpResendLimit;
  }
  if (pannelName === SECOND_PANNEL_OTP) {
    const otp2 = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
    panelOtp.otpTimerSecond = otp2.secondsPanel.seconds2;
    panelOtp.otpTimerPanel = otp2.secondsPanel;
    panelOtp.resendOtp = otp2.aem_otpResend2;
    panelOtp.limitCheck = resendOtpCount2 < DATA_LIMITS.maxOtpResendLimit;
  }
  const timer = setInterval(() => {
    globals.functions.setProperty(panelOtp.otpTimerSecond, { value: dispSec });
    sec -= 1;
    dispSec = sec;
    if (sec < 10) {
      dispSec = `0${dispSec}`;
    }
    if (sec < 0) {
      clearInterval(timer);
      globals.functions.setProperty(panelOtp.otpTimerPanel, { visible: false });
      if (panelOtp.limitCheck) {
        globals.functions.setProperty(
          panelOtp.resendOtp,
          { visible: true },
        );
      }
    }
  }, 1000);
};

/**
 * @name resendOTPV1 - to handle resend otp for otpv1 &  preExecution
 * @param {Object} globals - The global form object
 * @param {string} - otp pannel - firstotp or secondotp
 * @return {PROMISE}
 */
const resendOTPV1 = async (pannelName, globals) => {
  const channel = 'web';
  const FIRST_PANNEL_OTP = 'firstotp';
  const SECOND_PANNEL_OTP = 'secondotp';
  const panelOtp = {
    otpTimerPanel: null,
    otpTimerSecond: null,
    resendOtp: null,
    limitCheck: null,
    maxLimitOtp: null,
    resendOtpCount: null,
  };
  if (pannelName === FIRST_PANNEL_OTP) {
    const otp1 = globals.form.aem_semiWizard.aem_identifierPanel.aem_otpPanel.otpPanel;
    panelOtp.otpTimerSecond = otp1.secondsPanel.seconds;
    panelOtp.otpTimerPanel = otp1.secondsPanel;
    panelOtp.resendOtp = otp1.aem_otpResend;
    panelOtp.limitCheck = resendOtpCount < DATA_LIMITS.maxOtpResendLimit;
    panelOtp.maxLimitOtp = otp1.aem_maxlimitOTP;
    resendOtpCount += 1;
    panelOtp.resendOtpCount = resendOtpCount;
  }
  if (pannelName === SECOND_PANNEL_OTP) {
    const otp2 = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
    panelOtp.otpTimerSecond = otp2.secondsPanel.seconds2;
    panelOtp.otpTimerPanel = otp2.secondsPanel;
    panelOtp.resendOtp = otp2.aem_otpResend2;
    panelOtp.limitCheck = resendOtpCount2 < DATA_LIMITS.maxOtpResendLimit;
    panelOtp.maxLimitOtp = otp2.aem_maxlimitOTP2;
    resendOtpCount2 += 1;
    panelOtp.resendOtpCount = resendOtpCount2;
    if (isNodeEnv) {
      panelOtp.resendOtpCountField = otp2.aem_resendOtpCount2;
      panelOtp.limitCheck = otp2.aem_resendOtpCount2.$value < DATA_LIMITS.maxOtpResendLimit;
      panelOtp.resendOtpCount = otp2.aem_resendOtpCount2.$value + 1;
    }
  }
  const mobileNumber = globals.form.aem_semiWizard.aem_identifierPanel.aem_loginPanel.mobilePanel.aem_mobileNum.$value;
  const cardDigits = globals.form.aem_semiWizard.aem_identifierPanel.aem_loginPanel.aem_cardNo.$value;
  if (panelOtp.resendOtpCountField) {
    globals.functions.setProperty(panelOtp.resendOtpCountField, { value: panelOtp.resendOtpCount });
  }
  globals.functions.setProperty(panelOtp.otpTimerPanel, { visible: true });
  if (panelOtp.limitCheck) {
    if (panelOtp.resendOtpCount === DATA_LIMITS.maxOtpResendLimit) {
      globals.functions.setProperty(panelOtp.otpTimerPanel, { visible: false });
      globals.functions.setProperty(panelOtp.resendOtp, { visible: false });
      globals.functions.setProperty(panelOtp.maxLimitOtp, { visible: true });
      // In web resend OTP button is visible after 30 sec, until this it is hidded. So we have usd custom property to control
      // visibility in whatsapp Flow.
      if (pannelName === SECOND_PANNEL_OTP) {
        handleResendOtp2VisibilityInFlow(panelOtp.resendOtpCount, globals);
      }
    }
    if (pannelName === FIRST_PANNEL_OTP) {
      return getOTPV1(mobileNumber, cardDigits, channel, globals);
    }
    if (pannelName === SECOND_PANNEL_OTP) {
      return preExecution(mobileNumber, cardDigits, globals);
    }
  }
  return null;
};

/**
 * on click of t&c navigation, open Url in new tab
 */
const tAndCNavigation = () => {
  const TNC_LINK = 'https://www.hdfcbank.com/personal/borrow/loan-against-assets/smartemi';
  if (window !== undefined) {
    window.open(TNC_LINK, '_blank');
  }
};

export {
  createJourneyId,
  getOTPV1,
  otpValV1,
  checkELigibilityHandler,
  selectTenure,
  sortData,
  selectTopTxn,
  txnSelectHandler,
  changeCheckboxToToggle,
  changeWizardView,
  preExecution,
  radioBtnValCommit,
  semiWizardSwitch,
  assistedToggleHandler,
  channelDDHandler,
  branchHandler,
  dsaHandler,
  getCCSmartEmi,
  otpTimerV1,
  resendOTPV1,
  tAndCNavigation,
  customDispatchEvent,
  getFlowSuccessPayload,
  reloadPage,
  invokeJourneyDropOff,
  invokeJourneyDropOffByParam,
  invokeJourneyDropOffUpdate,
  handleWrongCCDetailsFlows,
  handleTadMadAlert,
  sendAnalytics,
  sendErrorAnalytics,
};
