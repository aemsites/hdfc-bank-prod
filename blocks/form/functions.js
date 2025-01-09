export const formIdPathMapping = {
  '/content/forms/af/hdfc_haf/liabilities/nre-nro/forms/account-opening-nre-nro': '../../../liabilities/nre-Nro/nre-nro.js', // nre-Nro
  '/content/forms/af/hdfc_haf/cards/corporatecreditcard/uat/hdfc': '../../../creditcards/corporate-creditcard/cc-functions.js', // cc
  '/content/forms/af/hdfc_haf/digital/etb-fixed-deposit-cc': '../../../creditcards/fd-card/fd-functions.js', // fd
  '/content/forms/af/hdfc_haf/digital/semi': '../../../creditcards/semi/semi-functions.js',
  '/content/forms/af/hdfc_haf/cards/semi/forms/semi': '../../../creditcards/semi/semi-functions.js',
  '/content/forms/af/hdfc_haf/digital/corporate-credit-cards-application-form': '../../../creditcards/corporate-creditcard/cc-functions.js',
  '/content/forms/af/hdfc_haf/loan-against-assets/smart-emi/smartemi': '../../../creditcards/semi/semi-functions.js', // semi
  '/content/forms/af/hdfc_haf/loan-against-assets/smartemi/smartemi': '../../../creditcards/semi/semi-functions.js',
  '/content/forms/af/hdfc_haf/digital/pvtestfdliencugtest': '../../../creditcards/fd-card/fd-functions.js', // fd
  '/content/forms/af/hdfc_haf/digital/fd-lien-cug': '../../../creditcards/fd-card/fd-functions.js', // fd
  '/content/forms/af/hdfc_haf/digital/corporate-credit-cards-application-cug': '../../../creditcards/corporate-creditcard/cc-functions.js'// ccc cug
  '/content/forms/af/hdfc_haf/digital/fdlienprodtest': '../../../creditcards/fd-card/fd-functions.js', // fd form
  '/content/forms/af/hdfc_haf/digital/account-opening-nre-nro': '../../../liabilities/nre-Nro/nre-nro.js', 
};

export default function getCustomFunctionPath(id) {
  return id ? formIdPathMapping[atob(id)] : null;
}
