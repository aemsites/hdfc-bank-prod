import {
  createLabelInElement,
  setSelectOptions,
} from '../domutils/domutils.js';

import {
  addCardFieldValidation,
  addMobileValidation,
  addOtpFieldValidation,
  linkToPopupToggle,
  getUrlParamCaseInsensitive,
} from './semi-dom-utils.js';

const isNodeEnv = typeof process !== 'undefined' && process.versions && process.versions.node;

/**
   * function sorts the billed / Unbilled Txn  array in descending order based on the amount field
   *
   * @param {object} data
   * @param {object} key
   * @returns {object}
   */
const sortDataByAmount = (data, key = 'aem_TxnAmt') => data.sort((a, b) => b[key] - a[key]);

/**
   * convert a amount with unicode to Number
   * @param {string} str - txn-amount - i.e.:'₹ 50,000'
   * @returns {number} - number-  50000
   */
const currencyStrToNum = (str) => parseFloat((String(str))?.replace(/[^\d.-]/g, ''));

const sortDataByAmountSymbol = (data, key = 'aem_TxnAmt') => data.sort((a, b) => currencyStrToNum(b[key]) - currencyStrToNum(a[key]));

/**
 * calls function to update checkbox to label
 *
 * @function changeCheckboxToToggle
 * @returns {void}
 */
const changeCheckboxToToggle = () => {
  createLabelInElement('.field-employeeassistancetoggle', 'employee-assistance-toggle__label');
  createLabelInElement('.field-mailingaddresstoggle', 'mailing-address-toggle__label');
};

/**
   * Description placeholder
   *
   * @param {*} data
   * @returns {*}
   */
function sortByDate(data) {
  return data.sort((a, b) => {
    // Split the date strings into day, month, and year
    const [dayA, monthA, yearA] = a.aem_TxnDate.split('-').map(Number);
    const [dayB, monthB, yearB] = b.aem_TxnDate.split('-').map(Number);

    // Create Date objects from the components
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);

    // Compare the dates
    return dateB - dateA;
  });
}

const calculateEMI = (loanAmount, rateOfInterest, tenure) => {
  // optmize this later - amaini
  // [P x R x (1+R)^N]/[(1+R)^N-1]
  const newrate = (rateOfInterest / 100);
  const rate1 = (1 + newrate);
  const rate2 = rate1 ** tenure;
  const rate3 = (rate2 - 1);
  const principle = [(loanAmount) * (newrate) * rate2];
  const finalEMI = Math.round(principle / rate3);
  return finalEMI;
};

const currencyUtil = (number, minimumFractionDigits) => {
  if (typeof (number) !== 'number') return number;
  const options = {
    minimumFractionDigits: minimumFractionDigits || 0,
  };
  const interestNumber = (number / 100).toFixed(minimumFractionDigits || 0);
  const newNumber = new Intl.NumberFormat('us-EN', options).format(interestNumber);
  return newNumber;
};

/* */
const numberToText = (number) => {
  const num = Math.trunc(Number(number));
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if ((num.toString()).length > 9) return 'overflow';
  const n = (`000000000${num}`).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  // eslint-disable-next-line consistent-return
  if (!n) return;
  let str = '';
  // eslint-disable-next-line eqeqeq
  str += (n[1] != 0) ? `${a[Number(n[1])] || `${b[n[1][0]]} ${a[n[1][1]]}`}Crore ` : '';
  // eslint-disable-next-line eqeqeq
  str += (n[2] != 0) ? `${a[Number(n[2])] || `${b[n[2][0]]} ${a[n[2][1]]}`}Lakh ` : '';
  // eslint-disable-next-line eqeqeq
  str += (n[3] != 0) ? `${a[Number(n[3])] || `${b[n[3][0]]} ${a[n[3][1]]}`}Thousand ` : '';
  // eslint-disable-next-line eqeqeq
  str += (n[4] != 0) ? `${a[Number(n[4])] || `${b[n[4][0]]} ${a[n[4][1]]}`}Hundred ` : '';
  // eslint-disable-next-line eqeqeq, no-constant-condition
  str += `₹${n[5] != 0}` ? `${a[Number(n[5])] || `${b[n[5][0]]} ${a[n[5][1]]}`}Only ` : '';
  return str;
};

const validationField = () => {
  addMobileValidation();
  addCardFieldValidation();
  addOtpFieldValidation();
  linkToPopupToggle('.field-aem-disclaimer-text a', '.field-landingconfirmationpopup', '.field-doyouwishtocontinue', '.field-cross-btn button', '.field-err-popup-buttonconfirm button');
  linkToPopupToggle('.field-aem-txnssummarytext a', '.field-aem-txnssummarypopupwrapper', '.field-aem-txnssummarypopup', '.field-aem-txnssummaryok');
};

const getBillingCycleDate = (day) => {
  // Get the current day of the month in the Indian timezone
  const options = { timeZone: 'Asia/Kolkata', day: 'numeric' };
  const dayOfMonth = Number(new Intl.DateTimeFormat('en-US', options).format(new Date()));

  const date = new Date();
  // Set the provided day
  date.setDate(day);
  if (day <= dayOfMonth) {
    // Move to the next month
    date.setMonth(date.getMonth() + 1);
  }
  // Extract the day, month, and year
  const dayPart = date.getDate();
  const monthPart = date.toLocaleString('en-US', { month: 'short' });
  const yearPart = date.getFullYear();
  // Format the date as "dd MMM yyyy"
  return `${dayPart} ${monthPart} ${yearPart}`;
};

if (!isNodeEnv) {
  setTimeout(() => {
    validationField();
  }, 1000);
}

export {
  numberToText,
  currencyUtil,
  calculateEMI,
  sortDataByAmount,
  sortDataByAmountSymbol,
  sortByDate,
  changeCheckboxToToggle,
  currencyStrToNum,
  validationField,
  setSelectOptions,
  getUrlParamCaseInsensitive,
  getBillingCycleDate,
};
