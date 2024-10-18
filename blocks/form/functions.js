export const formIdPathMapping = {
  '/content/forms/af/hdfc_haf/cards/corporatecreditcard/uat/hdfc': '../../../creditcards/corporate-creditcard/cc-functions.js', // cc
  '/content/forms/af/hdfc_haf/cards/fdlien/forms/fdlien-dev': '../../../creditcards/fd-card/fd-functions.js', // fd
  '/content/forms/af/hdfc_haf/digital/semi': '../../../creditcards/semi/semi-functions.js', // semi
};

export default function getCustomFunctionPath(id) {
  return id ? formIdPathMapping[atob(id)] : null;
}
