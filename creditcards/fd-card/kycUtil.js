import { CURRENT_FORM_CONTEXT, FORM_RUNTIME } from '../../common/constants.js';
import { aadharLangChange } from '../domutils/domutils.js';
import { DOM_ELEMENT } from './constant.js';
import finalDap from './finaldaputils.js';

const KYC_STATE = {
  selectedKyc: '',
};
const kycProceedClickHandler = (selectedKyc, globals) => {
  const {
    addressDeclarationPanel,
    docUploadFlow,
    fdBasedCreditCardWizard,
    runtime,
  } = globals.form;
  const { inPersonBioKYCOptions } = fdBasedCreditCardWizard.basicDetails.reviewDetailsView.employeeAssistance.inPersonBioKYCPanel;
  KYC_STATE.selectedKyc = selectedKyc;
  if (CURRENT_FORM_CONTEXT.journeyID !== undefined) globals.functions.setProperty(runtime.formContext, { value: JSON.stringify(CURRENT_FORM_CONTEXT) });
  else {
    globals.functions.setProperty(runtime.formContext, { value: JSON.stringify(globals.functions.exportData()?.currentFormContext) });
    Object.assign(CURRENT_FORM_CONTEXT, globals.functions.exportData()?.currentFormContext);
  }
  if (!CURRENT_FORM_CONTEXT.executeInterfaceRequest) {
    CURRENT_FORM_CONTEXT.executeInterfaceRequest = globals.functions.exportData()?.currentFormContext?.executeInterfaceRequest;
  }
  const {
    communicationAddress1,
    communicationAddress2,
    communicationAddress3,
    communicationCity,
    comCityZip,
    communicationState,
  } = CURRENT_FORM_CONTEXT.executeInterfaceRequest.requestString;
  CURRENT_FORM_CONTEXT.aadhaarFailed = globals?.functions?.exportData()?.queryParamsvisitType === 'EKYC_AUTH_FAILED';
  const fullCurrentAddress = [communicationAddress1, communicationAddress2, communicationAddress3, communicationCity, communicationState, comCityZip].filter(Boolean).join(',');
  switch (selectedKyc) {
    case 'BIOMETRIC':
      globals.functions.setProperty(addressDeclarationPanel.currentAddressDeclarationAadhar, { visible: false });

      CURRENT_FORM_CONTEXT.selectedKyc = inPersonBioKYCOptions?._data.$_value === '0' && !CURRENT_FORM_CONTEXT.aadhaarFailed
        ? 'bioinperson'
        : 'biokyc';
      globals.functions.setProperty(addressDeclarationPanel.currentResidenceAddressBiometricOVD, { visible: true });
      globals.functions.setProperty(addressDeclarationPanel.currentResidenceAddressBiometricOVD.currentResAddressBiometricOVD, { value: fullCurrentAddress });
      break;
    case 'OVD':
      CURRENT_FORM_CONTEXT.selectedKyc = 'OVD';
      globals.functions.setProperty(docUploadFlow, { visible: true });
      globals.functions.setProperty(docUploadFlow.docUploadPanel, { visible: CURRENT_FORM_CONTEXT.customerIdentityChange });
      globals.functions.setProperty(docUploadFlow.uploadAddressProof, { visible: true });
      globals.functions.setProperty(docUploadFlow.docUploadConfirm, { visible: true });
      globals.functions.setProperty(docUploadFlow.docUploadBiometric, { visible: false });
      CURRENT_FORM_CONTEXT.addressDocUploadFlag = true;
      CURRENT_FORM_CONTEXT.identityDocUploadFlag = CURRENT_FORM_CONTEXT?.customerIdentityChange;
      break;
    default:
  }
};

const addressDeclarationProceedHandler = (globals) => {
  const { addressDeclarationPanel, docUploadFlow } = globals.form;
  if (CURRENT_FORM_CONTEXT.journeyID === undefined) {
    Object.assign(CURRENT_FORM_CONTEXT, globals?.functions?.exportData()?.currentFormContext);
  }
  if (CURRENT_FORM_CONTEXT?.customerIdentityChange && (CURRENT_FORM_CONTEXT?.selectedKyc === 'biokyc' || CURRENT_FORM_CONTEXT?.selectedKyc === 'bioinperson' || CURRENT_FORM_CONTEXT?.selectedKyc === 'aadhaar')) {
    const { docUploadPanel, uploadAddressProof } = docUploadFlow;
    globals.functions.setProperty(addressDeclarationPanel, { visible: false });
    globals.functions.setProperty(docUploadFlow, { visible: true });
    globals.functions.setProperty(docUploadPanel, { visible: true });
    globals.functions.setProperty(uploadAddressProof, { visible: false });
    CURRENT_FORM_CONTEXT.identityDocUploadFlag = true;
    return;
  }
  if (!CURRENT_FORM_CONTEXT?.customerIdentityChange && KYC_STATE?.selectedKyc === 'BIOMETRIC') {
    finalDap(false, globals);
  }
};

const aadhaarConsent = async (globals) => {
  KYC_STATE.selectedKyc = 'AADHAAR';
  CURRENT_FORM_CONTEXT.selectedKyc = 'aadhaar';
  const { selectKYCOptionsPanel, runtime } = globals.form;
  try {
    if (typeof window !== 'undefined') {
      const openModal = (await import('../../blocks/modal/modal.js')).default;
      const config = {
        content: document.querySelector(`[name = ${DOM_ELEMENT.selectKyc.aadharModalContent}]`),
        actionWrapClass: DOM_ELEMENT.selectKyc.modalBtnWrapper,
        reqConsentAgree: true,
      };
      if (typeof FORM_RUNTIME.aadharConfig === 'undefined') {
        FORM_RUNTIME.aadharConfig = config;
      }
      await openModal(FORM_RUNTIME.aadharConfig);
      aadharLangChange(FORM_RUNTIME.aadharConfig?.content, DOM_ELEMENT.selectKyc.defaultLanguage, CURRENT_FORM_CONTEXT);
      config?.content?.addEventListener('modalTriggerValue', (event) => {
        const receivedData = event.detail;
        if (receivedData?.aadharConsentAgree) {
          globals.functions.setProperty(runtime.formContext, { value: JSON.stringify(CURRENT_FORM_CONTEXT) });
          globals.functions.setProperty(selectKYCOptionsPanel.triggerAadharAPI, { value: 1 });
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export {
  kycProceedClickHandler,
  addressDeclarationProceedHandler,
  aadhaarConsent,
  KYC_STATE,
};
