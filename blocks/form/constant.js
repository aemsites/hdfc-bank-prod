/* eslint-disable no-restricted-globals */
export const fileAttachmentText = 'Upload';
export const dragDropText = 'Drag and Drop To Upload';

export const defaultErrorMessages = {
  accept: 'The specified file type not supported.',
  maxFileSize: 'File too large. Reduce size and try again.',
  maxItems: 'Specify a number of items equal to or less than $0.',
  minItems: 'Specify a number of items equal to or greater than $0.',
  pattern: 'Specify the value in allowed format : $0.',
  minLength: 'Please lengthen this text to $0 characters or more.',
  maxLength: 'Please shorten this text to $0 characters or less.',
  maximum: 'Value must be less than or equal to $0.',
  minimum: 'Value must be greater than or equal to $0.',
  required: 'Please fill in this field.',
};

let submitBaseUrl = 'https://applyonline.hdfcbank.com';

const localDev = ['aem.live', 'aem.page', 'localhost', 'hlx.live', 'hlx.page'];
const mainProd = ['hdfc-bank-prod'];

function isLocalDev() {
  if (typeof location !== 'undefined') {
    const { hostname } = location;
    return localDev.some((dev) => hostname.includes(dev));
  }
  return false;
}

function isMainProd() {
  // eslint-disable-next-line no-restricted-globals
  if (typeof location !== 'undefined') {
    const { hostname } = location;
    return mainProd.some((main) => hostname.includes(main));
  }
  return false;
}

if (isLocalDev() && !isMainProd()) {
  submitBaseUrl = 'https://applyonlinedev.hdfcbank.com';
}

export function setSubmitBaseUrl(url) {
  submitBaseUrl = url;
}

// eslint-disable-next-line no-useless-escape
export const emailPattern = '([A-Za-z0-9][._]?)+[A-Za-z0-9]@[A-Za-z0-9]+(\.?[A-Za-z0-9]){2}\.([A-Za-z0-9]{2,4})?';

export function getSubmitBaseUrl() {
  return submitBaseUrl;
}
