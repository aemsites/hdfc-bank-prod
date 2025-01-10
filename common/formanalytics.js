/**
 * set analytics generic props for page load
 * @name setAnalyticPageLoadProps
 * @param {string} linkName - linkName
 * @param {string} linkType - linkType
 * @param {object} formContext - currentFormContext.
 * @param {string} formName - formName
 * @param {object} digitalData
 */

function setAnalyticPageLoadProps(journeyState, formData, digitalData, formName, pageName, currentFormContext) {
  digitalData.page.pageInfo.pageName = pageName;
  digitalData.user.pseudoID = '';// Need to check
  digitalData.user.journeyName = currentFormContext?.journeyName;
  digitalData.user.journeyID = formData?.journeyId;
  digitalData.user.journeyState = journeyState;
  digitalData.user.casa = '';
  digitalData.form.name = formName;
}

/**
 * set analytics generic props for click event
 * @name setAnalyticClickGenericProps
 * @param {string} linkName - linkName
 * @param {string} linkType - linkType
 * @param {string} linkPosition - linkPosition
 * @param {object} formContext - currentFormContext.
 * @param {string} formName - formName
 * @param {object} digitalData
 */

function setAnalyticClickGenericProps(linkName, linkType, linkPosition, formData, journeyState, digitalData, formName, currentFormContext) {
  digitalData.link = {
    linkName,
    linkType,
  };
  digitalData.link.linkPosition = linkPosition;
  digitalData.user.pseudoID = '';
  digitalData.user.journeyName = currentFormContext?.journeyName;
  digitalData.user.journeyID = currentFormContext?.journeyID;
  digitalData.user.journeyState = journeyState;
  if (linkName === 'otp click') {
    digitalData.form.name = formName;
    digitalData.user.casa = '';
  } else {
    digitalData.form.name = formData.etbFlowSelected === 'on' ? `${formName}-ETB` : `${formName}-NTB`;
    digitalData.user.casa = formData.etbFlowSelected === 'on' ? 'Yes' : 'No';
  }
  // window.digitalData = digitalData || {};
}

const getValidationMethod = (formContext) => {
  if (formContext && formContext?.login && formContext.login.panDobSelection) {
    return formContext.login.panDobSelection === '0' ? 'DOB' : 'PAN';
  }
  return '';
};

async function hashPhoneNumber(phoneNumber) {
  const encoder = new TextEncoder();
  const rawdata = encoder.encode(phoneNumber);
  const hash = await crypto.subtle.digest('SHA-256', rawdata);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const getGender = (gender) => {
  if (gender === '1') return 'Male';
  if (gender === '2') return 'Female';
  if (gender === '3') return 'Others';
  return 'Unknown';
};

const getEmploymentType = (type) => {
  switch (type) {
    case '1': return 'Salaried';
    case '2': return 'Self Employed';
    case '3': return 'Student';
    case '4': return 'Housewife';
    case '5': return 'Retired';
    default: return 'Unknown';
  }
};

export {
  setAnalyticClickGenericProps,
  setAnalyticPageLoadProps,
  getValidationMethod,
  hashPhoneNumber,
  getGender,
  getEmploymentType,
};
