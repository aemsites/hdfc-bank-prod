import { formUtil } from '../../common/formutils.js';

const finalPagePanelVisibility = (formStatus, arn, globals) => {
  const {
    addressDeclarationPanel,
    resultPanel,
    fdBasedCreditCardWizard,
    docUploadFlow,
  } = globals.form;
  const { successResultPanel, errorResultPanel } = resultPanel;
  globals.functions.setProperty(addressDeclarationPanel, { visible: false });
  globals.functions.setProperty(fdBasedCreditCardWizard, { visible: false });
  globals.functions.setProperty(docUploadFlow, { visible: false });
  globals.functions.setProperty(resultPanel, { visible: true });
  globals.functions.setProperty(globals.form?.loginMainPanel?.bankLoginPanel, { visible: false });
  if (formStatus === 'success') {
    globals.functions.setProperty(successResultPanel?.tqSuccessWrapper?.refNumPanel?.referenceNumber, { value: arn });
    globals.functions.setProperty(successResultPanel, { visible: true });
  } else {
    globals.functions.setProperty(errorResultPanel, { visible: true });
  }
};

const ratingButtonUI = (param, globals) => {
  const thankyouSubmit = formUtil(globals, globals.form.resultPanel.successResultPanel.tqSuccessWrapper.feedbackConfirmation.tqSubmitWrapper.tqSubmitButton);
  document.querySelectorAll('.field-ratingbuttons .button').forEach((btn) => {
    btn.classList.remove('active');
  });
  document.querySelector(`#${param._jsonModel.id}`).classList.add('active');
  const ratingValue = `${param._jsonModel.label.value}`;
  if (ratingValue) {
    const ratingInput = formUtil(globals, globals.form.resultPanel.successResultPanel.tqSuccessWrapper.feedbackConfirmation.tqSubmitWrapper.captureRating);
    ratingInput.setValue(ratingValue);
    thankyouSubmit.enabled(true);
  }
};

const ratingSubmitted = () => {
  const ratingSubmittedText = document.querySelector('.field-ratingsubmittedtext');
  if (ratingSubmittedText) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    ratingSubmittedText.setAttribute('data-visible', 'true');
  }
};

const copyToClipBoard = async (globals) => {
  const referenceNumberLabel = globals.form.resultPanel.successResultPanel.tqSuccessWrapper.refNumPanel.referenceNumber._jsonModel.label.value;
  const referenceNumberValue = document.querySelector('.field-refnumpanel .field-referencenumber input').value;
  if (referenceNumberValue) {
    try {
      await navigator.clipboard.writeText(referenceNumberValue);
      alert(`Copied ${referenceNumberLabel}: ${referenceNumberValue}`);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  } else {
    alert('No reference number available to copy.');
  }
};

export {
  finalPagePanelVisibility,
  ratingButtonUI,
  ratingSubmitted,
  copyToClipBoard,
};
