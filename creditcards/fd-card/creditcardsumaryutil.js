import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';
import { maskString } from '../../common/formutils.js';

const creditCardSummary = (globals) => {
  const { functions, form } = globals;
  const { exportData, setProperty, importData } = functions;
  // const { tqSummarySection } = form.resultPanel.successResultPanel.tqSuccessWrapper;
  const { tqSummarySection } = form.resultPanel.successResultPanel.tqSuccessWrapper;

  const formData = exportData();
  const selectedCreditCard = CURRENT_FORM_CONTEXT?.selectedCreditCard || formData?.currentFormContext?.selectedCreditCard || {};
  const eligibleCreditLimitAmount = CURRENT_FORM_CONTEXT?.cardCreditLimit || formData?.currentFormContext?.cardCreditLimit;
  const { FDlienCard = {} } = formData;
  const { annualFee = 0 } = selectedCreditCard;
  const fdNumberSelection = FDlienCard.fdNumberSelection || [];
  const nameOnCard = formData?.nameOnCard
  || formData?.currentFormContext?.executeInterfaceRequest?.requestString?.nameOnCard
  || formData?.FDlienCard?.nameOnCard
  || CURRENT_FORM_CONTEXT?.executeInterfaceRequest?.requestString?.nameOnCard
  || '';
  if (tqSummarySection) {
    setProperty(tqSummarySection?.tqNameOnCard, { value: nameOnCard });
    setProperty(tqSummarySection?.tqAnnualCCFee, { value: String(annualFee) });
    setProperty(tqSummarySection?.tqCreditLimit, { value: eligibleCreditLimitAmount });
  }
  const formattedFDs = fdNumberSelection.reduce((acc, fd) => {
    if (fd.fdAccSelect === 'on') {
      acc.push({ selectedFDNum: maskString(fd?.fdNumber?.toString()) });
    }
    return acc;
  }, []);

  importData(formattedFDs, tqSummarySection?.tqSelectedFDs?.selectedFdsRepeatable?.$qualifiedName);
};

export default creditCardSummary;
