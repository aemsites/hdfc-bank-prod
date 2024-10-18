export const fileAttachmentText = 'Upload';
export const dragDropText = 'Drag and Drop To Upload';

export const defaultErrorMessages = {
  accept: 'The specified file type not supported.',
  maxFileSize: 'File too large. Reduce size and try again.',
  maxItems: 'Specify a number of items equal to or less than $0.',
  minItems: 'Specify a number of items equal to or greater than $0.',
};

let submitBaseUrl = '';

const localDev = ['aem.live', 'aem.page', 'localhost', 'hlx.live', 'hlx.page'];

function isLocalDev() {
  // eslint-disable-next-line no-restricted-globals
  const { hostname } = location;
  return localDev.some((dev) => hostname.includes(dev));
}

if (isLocalDev()) {
  submitBaseUrl = 'https://applyonline.hdfcbank.com';
}

export function setSubmitBaseUrl(url) {
  submitBaseUrl = url;
}

export function getSubmitBaseUrl() {
  return submitBaseUrl;
}
