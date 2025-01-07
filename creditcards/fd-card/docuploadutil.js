/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import { invokeJourneyDropOffUpdate } from './fd-journey-util.js';
import {
  displayLoader,
  hideLoaderGif,
  chainedFetchAsyncCall,
} from '../../common/makeRestAPI.js';
import { urlPath, generateUUID } from '../../common/formutils.js';
import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';
import { FD_ENDPOINTS } from './constant.js';
import finalDap from './finaldaputils.js';
/**
 * Creates a FormData payload for document upload.
 *
 * @param {Object} param0 - Parameters object.
 * @param {Object} param0.docValue - Document value object containing data to upload.
 * @param {string} param0.docType - Type of the document.
 * @param {string} param0.fileId - Unique identifier for the file.
 * @returns {Promise<FormData>} FormData object containing the document payload.
 * @throws {Error} Throws an error if document creation fails.
 */
const createDocPayload = async ({ docValue, docType, fileId }, mobileNumber) => {
  try {
    const {
      journeyName,
      journeyID,
      eRefNumber,
    } = CURRENT_FORM_CONTEXT;
    const file = docValue?.$value?.data;
    const fileBinary = file;
    const documentName = file.name?.replace(/[^a-zA-Z0-9.]/g, '');
    const { userAgent } = window.navigator;
    const uuId = generateUUID();
    const payloadKeyValuePairs = {
      [`${uuId}`]: fileBinary,
      imageBinary: fileBinary,
      docuemntType: docType,
      journeyID,
      requestNumber: eRefNumber,
      applicationRefNo: CURRENT_FORM_CONTEXT.executeInterfaceResponse.APS_APPL_REF_NUM,
      journeyName,
      mobileNumber,
      userAgent,
      docuemntName: documentName,
      fileId: uuId,
      [`existing_${fileId}`]: '',
    };
    const formData = new FormData();
    Object.entries(payloadKeyValuePairs).forEach(([key, value]) => formData.append(key?.toString(), value));
    return formData;
  } catch (error) {
    throw new Error('Failed to create document payload', error);
  }
};

/**
 * docUploadClickHandler
 * @param {object} globals - The global object containing necessary globals form data
 */
const docUploadClickHandler = async (globals) => {
  const {
    docUploadPanel,
    uploadAddressProof,
    technicalErrorDocUpload,
  } = globals.form.docUploadFlow;
  const { docUploadDropdown, DocUploadFrontWrapper, DocUploadBackWrapper } = docUploadPanel;
  const { addressProofFile1Wrapper, addressProofFile2Wrapper } = uploadAddressProof;
  const identityDocType = docUploadDropdown.$value;
  const addressDocType = uploadAddressProof.docTypeDropdown.$value;
  const mobileNumber = globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber.$value;
  const formContextCallbackData = globals.functions.exportData()?.currentFormContext || CURRENT_FORM_CONTEXT;
  const leadProfileId = globals.functions.exportData().leadProifileId || globals.form.runtime.leadProifileId.$value || '';
  const journeyId = formContextCallbackData.journeyID;
  const apiEndPoint = urlPath(FD_ENDPOINTS.documentupload);
  const method = 'POST';
  globals.functions.setProperty(technicalErrorDocUpload, { visible: false });

  const documents = [
    ...(CURRENT_FORM_CONTEXT?.identityDocUploadFlag && identityDocType !== '40_464' ? [
      { docValue: DocUploadFrontWrapper?.DocUploadFront, docType: identityDocType, fileId: '1_FS' },
      { docValue: DocUploadBackWrapper?.DocUploadBack, docType: identityDocType, fileId: '1_BS' },
    ] : []),
    ...(CURRENT_FORM_CONTEXT?.identityDocUploadFlag && identityDocType === '40_464' ? [
      { docValue: DocUploadFrontWrapper?.DocUploadFront, docType: identityDocType, fileId: '1_FS' },
    ] : []),
    ...(CURRENT_FORM_CONTEXT?.addressDocUploadFlag ? [
      { docValue: addressProofFile1Wrapper?.addressProofFile1, docType: addressDocType, fileId: '1_ADF' },
      { docValue: addressProofFile2Wrapper?.addressProofFile2, docType: addressDocType, fileId: '1_ADB' },
    ] : []),
  ];

  try {
    displayLoader();

    const payloads = await Promise.all(
      documents.map((doc) => createDocPayload(doc, mobileNumber)),
    );
    if (payloads.some((payload) => !payload)) throw new Error('Error in File');

    const responses = await chainedFetchAsyncCall(apiEndPoint, method, payloads, 'formData');

    if (responses.every((response) => response.value?.errorCode === '0000')) {
      return invokeJourneyDropOffUpdate('DOCUMENT_UPLOAD_SUCCESS', mobileNumber, leadProfileId, journeyId, globals);
    }

    globals.functions.setProperty(technicalErrorDocUpload, { visible: true });

    throw new Error('File upload failed');
  } catch (error) {
    console.error(error);
    throw new Error('File upload failed');
  } finally {
    hideLoaderGif();
  }
};

/**
 * fileUploadUIHandler
 * @param {object} globals - The global object containing necessary globals form data
 */
const fileUploadUIHandler = () => {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  const MAX_FILE_SIZE_MB = 1;

  fileInputs.forEach((fileInput) => {
    // Check if the current file input has a file selected
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const parentDiv = fileInput.closest('.field-docuploadfront, .field-docuploadback, .field-addressprooffile1, .field-addressprooffile2');
      const fileList = parentDiv.querySelector('.files-list');
      const fileDescription = parentDiv.querySelector('.field-description');
      const uploadButton = parentDiv.querySelector('.file-attachButton');
      const infoMsg = parentDiv.nextElementSibling;

      const validFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const fileSizeInKB = file.size / 1024;
      const fileSizeInMB = file.size / (1024 * 1024);

      parentDiv.classList.remove('file-uploaded', 'file-error');

      if (validFileTypes.includes(file.type) && fileSizeInMB <= MAX_FILE_SIZE_MB) {
        parentDiv.classList.add('file-uploaded');

        if (fileList) {
          fileList.textContent = file.name;
          const fileSizeSpan = document.createElement('span');
          fileSizeSpan.classList.add('file-size');
          if (fileSizeInKB < 1024) {
            fileSizeSpan.textContent = ` (${fileSizeInKB.toFixed(1)} KB)`;
          } else {
            fileSizeSpan.textContent = ` (${fileSizeInMB.toFixed(1)} MB)`;
          }
          fileList.appendChild(fileSizeSpan);
        }

        if (infoMsg && infoMsg.classList.contains('plain-text-wrapper')) {
          infoMsg.style.display = 'none';
        }

        if (uploadButton) {
          uploadButton.textContent = 'Re-upload';
        }
      } else {
        parentDiv.classList.add('file-error');

        if (!validFileTypes.includes(file.type)) {
          fileDescription.textContent = parentDiv.getAttribute('data-required-error-message');
        } else if (fileSizeInMB > MAX_FILE_SIZE_MB) {
          fileDescription.textContent = parentDiv.getAttribute('data-max-file-size-error-message');
        }

        if (uploadButton) {
          uploadButton.textContent = 'Upload';
        }
      }
    }
  });
};

const docUploadBiometricHandler = (globals) => {
  const { vkycConfirmationPanel } = globals.form.resultPanel.successResultPanel.tqSuccessWrapper;
  globals.functions.setProperty(vkycConfirmationPanel, { visible: false });
  finalDap(false, globals);
  // creditCardSummary(globals);
  // finalPagePanelVisibility('success', CURRENT_FORM_CONTEXT.executeInterfaceResponse.APS_APPL_REF_NUM, globals);
};

export {
  fileUploadUIHandler,
  docUploadClickHandler,
  docUploadBiometricHandler,
};
