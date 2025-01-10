/* eslint-disable no-underscore-dangle */
import {
  formatDateDDMMMYYY, formUtil, sanitizeName,
} from '../../common/formutils.js';
import { SELECTED_CUSTOMER_ID } from './customeridutil.js';
import { MAXIMUM_CREDIT_AMOUNT } from './constant.js';
import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';

const SELECT_FD_STATE = {};

/**
 * @name resetFDSelection
 * @param {Object} globals - The global context object containing various information.
 */
const resetFDSelection = (globals) => {
  const { selectedCustId } = SELECTED_CUSTOMER_ID;
  const selectedCustIdFds = selectedCustId?.listFDSummary ?? [];
  const fdSelectionInfo = globals.form?.fdBasedCreditCardWizard?.selectFD?.fdSelectionInfo;
  const { fdNumberSelection, selectFDDetailsPanel, continueToBasicDetails } = fdSelectionInfo;
  const { creditLimit } = selectFDDetailsPanel;
  const continueToBasicDetailsUtil = formUtil(globals, continueToBasicDetails);
  continueToBasicDetailsUtil.enabled(false);
  if (fdNumberSelection.length > 0) {
    globals.functions.setProperty(fdNumberSelection[0].fdAccSelect, { value: 'off' });
  }
  globals.functions.setProperty(creditLimit, { value: '0' });

  selectedCustIdFds.slice(0, -1).forEach(() => {
    globals.functions.dispatchEvent(fdNumberSelection, 'removeItem');
  });
};

const updateCreditLimit = (selectedFDsAmt, globals) => {
  const fdSelectionInfoPanel = globals.form?.fdBasedCreditCardWizard?.selectFD?.fdSelectionInfo;
  const selectedFDNumPanel = fdSelectionInfoPanel.selectedFDPanel.selectedFDNum;

  globals.functions.setProperty(selectedFDNumPanel, { value: selectedFDsAmt.length });

  const creditLimitPanel = fdSelectionInfoPanel.selectFDDetailsPanel.creditLimit;

  const totalSelectedAmount = selectedFDsAmt.reduce((acc, val) => acc + val, 0);
  const creditAmt = totalSelectedAmount * 0.9;
  const actualCreditAmount = Math.floor(Math.min(creditAmt, MAXIMUM_CREDIT_AMOUNT));

  globals.functions.setProperty(creditLimitPanel, {
    value: selectedFDsAmt.length === 0 ? 0 : actualCreditAmount,
  });
};

/**
 * Handles on select of customer ID radio button.
 * @name fdSelectHandler
 * @param {Object} fdPanel
 * @param {Object} globals
 */
const fdSelectHandler = (fdPanel, globals) => {
  const selectedFDsAmt = [];
  const continueToBasicDetails = globals.form?.fdBasedCreditCardWizard?.selectFD?.fdSelectionInfo?.continueToBasicDetails;
  fdPanel.forEach((item) => {
    if (item.fdAccSelect._data.$_value === 'on') {
      selectedFDsAmt.push(Number(item.selectedFDAmount._data.$_value));
    }
  });
  const continueToBasicDetailsUtil = formUtil(globals, continueToBasicDetails);
  continueToBasicDetailsUtil.enabled(selectedFDsAmt.length > 0);
  updateCreditLimit(selectedFDsAmt, globals);
};

/**
 * Handles on select of customer ID radio button.
 * @name selectAllFdClickHandler
 * @param {Object} globals
 */
const selectAllFdClickHandler = (globals) => {
  const selectedFDsAmt = [];
  const { fdNumberSelection, continueToBasicDetails } = globals.form.fdBasedCreditCardWizard.selectFD.fdSelectionInfo;
  fdNumberSelection.forEach((item) => {
    globals.functions.setProperty(item.fdAccSelect, { value: 'on' });
    selectedFDsAmt.push(Number(item.selectedFDAmount._data.$_value));
  });
  const continueToBasicDetailsUtil = formUtil(globals, continueToBasicDetails);
  continueToBasicDetailsUtil.enabled(selectedFDsAmt.length > 0);
  updateCreditLimit(selectedFDsAmt, globals);
};

const updateData = (globals, fd, panel, index, fdNumberSelectionPanel) => {
  const datMaturity = formatDateDDMMMYYY(fd?.datMaturity);
  const balPrincipal = Number(fd?.balTdPrincipal);
  globals.functions.setProperty(panel?.fdNumber, { value: fd?.fdAccountNo });
  globals.functions.setProperty(panel?.selectedFDAmount, { value: balPrincipal });
  globals.functions.setProperty(panel?.maturingDate, { value: datMaturity });
  if (index === 0) {
    globals.functions.setProperty(panel?.fdAccSelect, { value: 'on' });
    fdSelectHandler(globals, fdNumberSelectionPanel);
  }
};

/**
 * Binds customer details from the global context to the current form.
 * @name customerIdProceedHandler
 * @param {Object} globals - The global context object containing various information.
 */
const customerIdProceedHandler = (globals) => {
  const { selectedCustId } = SELECTED_CUSTOMER_ID;
  const selectedCustIdFds = selectedCustId?.listFDSummary || [];
  SELECT_FD_STATE.fdList = selectedCustIdFds;
  const {
    fdBasedCreditCardWizard,
    resultPanel,
  } = globals.form;
  if (selectedCustIdFds.length > 0) {
    const fdSelectionInfoPanel = fdBasedCreditCardWizard.selectFD.fdSelectionInfo;
    const fdNumberSelectionPanel = fdSelectionInfoPanel.fdNumberSelection;
    const { selectFDDetailsPanel } = fdSelectionInfoPanel;
    selectedCustIdFds.forEach((fd, i) => {
      if (i < selectedCustIdFds.length - 1) {
        globals.functions.dispatchEvent(fdNumberSelectionPanel, 'addItem');
      }
      setTimeout(() => {
        updateData(globals, fd, fdNumberSelectionPanel[i], i, fdNumberSelectionPanel);
      }, i * 40);
    });
    const { customerInfo } = CURRENT_FORM_CONTEXT;
    let customerFirstName = sanitizeName(customerInfo?.customerFullName?.split(' ')?.[0]);
    if (customerFirstName?.length > 0) customerFirstName = `${customerFirstName.charAt(0).toUpperCase() + customerFirstName.slice(1).toLowerCase()},`;
    globals.functions.setProperty(selectFDDetailsPanel.customerName, { value: customerFirstName });
    globals.functions.setProperty(fdSelectionInfoPanel.selectedFDPanel.selectedFDNum, '0');
    globals.functions.setProperty(fdSelectionInfoPanel.selectedFDPanel.selectedFDNumMax, selectedCustIdFds.length.toString());
  } else {
    globals.functions.setProperty(resultPanel, { visible: true });
    globals.functions.setProperty(resultPanel.errorResultPanel, { visible: true });
  }
};

export {
  customerIdProceedHandler,
  fdSelectHandler,
  selectAllFdClickHandler,
  resetFDSelection,
  SELECT_FD_STATE,
};
