(function (exports) {
  'use strict';

  /* eslint-disable no-console */
  // eslint-disable-next-line no-use-before-define

  const restAPIDataSecurityServiceContext = {
    SEC_KEY_HEADER: 'X-ENCKEY',
    SEC_SECRET_HEADER: 'X-ENCSECRET',
    crypto,
    supportsES6: (typeof window !== 'undefined') ? (!window.msCrypto) : false,
    symmetricAlgo: 'AES-GCM',
    symmetricKeyLength: 256,
    secretLength: 12, // IV length
    secretTagLength: 128, // GCM tag length
    aSymmetricAlgo: 'RSA-OAEP',
    digestAlgo: 'SHA-256',
    initStatus: false,
    symmetricKey: null,
    encSymmetricKey: null,
    aSymmetricPublicKey: null,
  };

  /*
         * Convert a string into an array buffer
         */
  function stringToArrayBuffer(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    // eslint-disable-next-line no-plusplus
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
  /*
         * convert array buffer to string
         */
  function arrayBufferToString(str) {
    const byteArray = new Uint8Array(str);
    let byteString = '';
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < byteArray.byteLength; i++) {
      byteString += String.fromCharCode(byteArray[i]);
    }
    return byteString;
  }

  /**
         * Prepares the request headers
         */
  function getDataEncRequestHeaders(encDataPack) {
    const requestHeaders = {};
    requestHeaders[restAPIDataSecurityServiceContext.SEC_KEY_HEADER] = encDataPack.keyEnc;
    requestHeaders[restAPIDataSecurityServiceContext.SEC_SECRET_HEADER] = encDataPack.secretEnc;
    return requestHeaders;
  }

  /**
   * Initialization in browsers where ES6 is supported
   * @param {object} globals - globals form object
   */
  function initRestAPIDataSecurityServiceES6() {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line max-len
      const publicKeyPemContent = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAocLO0ZabqWBbhb/cpaHTZf53LfEymcRMuAHRpUh3yhwPROgY2u3FTEsFJSKdQAbA4205njlXq3A1ICCd1ZrEQBA7Vc60eL0suO/0Qu5U/8vtYNCPsvMX+Pd7cUcMMM6JmLxacvlThOwAxc0ChSrFhlGRHQFZbg44y0Xy0B2bvxOnEjSAtV7kLjht/EKkiPXc3wptsLEMu2qK34Djucp5AllsbxJdWFogHTcJ1vizxAge9KwxA/2GSKYr5c9Wt8EAn7kqC0t43vnhtZuhgShJEbeV7VgF2GXGQBCxbbDravhltrGI+YKnAEd/RK0P0SJx+BXR7TcEv7zDg1QgXqfTewIDAQAB';

      // Base64 decode
      const binaryDerString = atob(publicKeyPemContent);
      // Convert from a binary string to an ArrayBuffer
      const binaryDer = stringToArrayBuffer(binaryDerString);

      // Import asymmetric public key
      restAPIDataSecurityServiceContext.crypto.subtle.importKey('spki', binaryDer, {
        name: restAPIDataSecurityServiceContext.aSymmetricAlgo,
        hash: restAPIDataSecurityServiceContext.digestAlgo,
      }, true, ['encrypt'])
        .then((publicKey) => {
          restAPIDataSecurityServiceContext.aSymmetricPublicKey = publicKey;

          // Generate the symmetric key
          return restAPIDataSecurityServiceContext.crypto.subtle.generateKey({
            name: restAPIDataSecurityServiceContext.symmetricAlgo,
            length: restAPIDataSecurityServiceContext.symmetricKeyLength,
          }, true, ['encrypt', 'decrypt']);
        })
        .then((symKey) => {
          restAPIDataSecurityServiceContext.symmetricKey = symKey;

          // Export the symmetric key for further use
          return restAPIDataSecurityServiceContext.crypto.subtle.exportKey('raw', restAPIDataSecurityServiceContext.symmetricKey);
        })
        .then((symKeyData) => {
          const symmetricKeyData = symKeyData;

          // Encrypting the symmetric key with asymmetric key
          return restAPIDataSecurityServiceContext.crypto.subtle.encrypt({
            name: restAPIDataSecurityServiceContext.aSymmetricAlgo,
            hash: {
              name: restAPIDataSecurityServiceContext.digestAlgo,
            },
          }, restAPIDataSecurityServiceContext.aSymmetricPublicKey, symmetricKeyData);
        })
        .then((encSymmetricKeyBuf) => {
          restAPIDataSecurityServiceContext.encSymmetricKey = btoa(arrayBufferToString(encSymmetricKeyBuf));

          // Mark the initialization status
          restAPIDataSecurityServiceContext.initStatus = true;

          // Resolve the promise after successful initialization
          resolve();
        })
        .catch((error) => {
          // Handle any errors that occur during the process
          reject(error);
        });
    });
  }

  /**
       * Encrypts data
       */
  async function encryptDataES6(data) {
    await initRestAPIDataSecurityServiceES6();
    const dataStr = JSON.stringify(data);
    const secret = restAPIDataSecurityServiceContext.crypto.getRandomValues(new Uint8Array(restAPIDataSecurityServiceContext.secretLength));
    const dataBuf = stringToArrayBuffer(dataStr);

    const dataEncBuf = await restAPIDataSecurityServiceContext.crypto.subtle.encrypt({
      name: restAPIDataSecurityServiceContext.symmetricAlgo,
      iv: secret,
      tagLength: restAPIDataSecurityServiceContext.secretTagLength,
    }, restAPIDataSecurityServiceContext.symmetricKey, dataBuf);

    const dataEnc = btoa(arrayBufferToString(dataEncBuf));

    const encSecretBuf = await restAPIDataSecurityServiceContext.crypto.subtle.encrypt({
      name: restAPIDataSecurityServiceContext.aSymmetricAlgo,
      hash: {
        name: restAPIDataSecurityServiceContext.digestAlgo,
      },
    }, restAPIDataSecurityServiceContext.aSymmetricPublicKey, secret);

    const encSecret = btoa(arrayBufferToString(encSecretBuf));

    return {
      dataEnc,
      secret,
      secretEnc: encSecret,
      keyEnc: restAPIDataSecurityServiceContext.encSymmetricKey,
      requestHeader: getDataEncRequestHeaders(restAPIDataSecurityServiceContext.encSymmetricKey),
    };
  }

  /**
         * @name invokeRestAPIWithDataSecurity
         */
  async function invokeRestAPIWithDataSecurity(data) {
    try {
      const response = await encryptDataES6(data);
      return response;
    } catch (error) {
      console.error('Error in invoking REST API with data security:', error);
      throw error;
    }
  }

  async function decryptDataES6(encData, secret) {
    try {
      const encDataBuf = stringToArrayBuffer(atob(encData));
      const dataEncBuf = await restAPIDataSecurityServiceContext.crypto.subtle.decrypt({
        name: restAPIDataSecurityServiceContext.symmetricAlgo,
        iv: secret,
        tagLength: restAPIDataSecurityServiceContext.secretTagLength,
      }, restAPIDataSecurityServiceContext.symmetricKey, encDataBuf);
      const decData = arrayBufferToString(dataEncBuf);
      return decData;
    } catch (error) {
      console.error(error);
      return null; // Ensure the function always returns a value
    }
  }

  let submitBaseUrl = 'https://applyonline.hdfcbank.com';

  const localDev = ['aem.live', 'aem.page', 'localhost', 'hlx.live', 'hlx.page'];

  function isLocalDev() {
    // eslint-disable-next-line no-restricted-globals
    if(typeof location !== 'undefined') {
      const { hostname } = location;
      return localDev.some((dev) => hostname.includes(dev));
    }
    return false;
  }

  if (isLocalDev()) {
    submitBaseUrl = 'https://applyonline.hdfcbank.com';
  }

  function getSubmitBaseUrl() {
    return submitBaseUrl;
  }

  // declare COMMON_CONSTANTS for all forms only.
  // impoted as CONSTANT key name in all files

  const BASEURL$2 = getSubmitBaseUrl();
  const CHANNEL$1 = 'ADOBE_WEBFORMS';
  const ENDPOINTS$1 = {
    aadharCallback: '/content/hdfc_etb_wo_pacc/api/aadharCallback.json',
    aadharInit: '/content/hdfc_haf/api/aadhaarInit.json',
    fetchAuthCode: '/content/hdfc_commonforms/api/fetchauthcode.json',
    emailId: '/content/hdfc_commonforms/api/emailid.json',
    executeInterface: '/content/hdfc_haf/api/executeinterface.json',
    finalDap: '/content/hdfc_haf/api/finalDap.json',
    ipa: '/content/hdfc_haf/api/ipa.json',
    journeyDropOff: '/content/hdfc_commonforms/api/journeydropoff.json',
    journeyDropOffParam: '/content/hdfc_commonforms/api/journeydropoffparam.json',
    journeyDropOffUpdate: '/content/hdfc_commonforms/api/journeydropoffupdate.json',
    otpGen: '/content/hdfc_haf/api/otpgenerationccV4.json',
    otpValFetchAssetDemog: '/content/hdfc_haf/api/otpvaldemogV4.json',
    panValNameMatch: '/content/hdfc_forms_common_v2/api/panValNameMatch.json',
    docUpload: '/content/hdfc_etb_wo_pacc/api/documentUpload.json',
  };

  const DEAD_PAN_STATUS = ['D', 'ED', 'X', 'F'];

  const CURRENT_FORM_CONTEXT$1 = {};

  const FORM_RUNTIME = {};

  const ID_COM = {
    productCode: 'CORPCC',
    scopeMap: {
      only_casa: {
        no: 'AACC',
        yes: 'ADOBE_PACC',
      },
      casa_asset: {
        no: 'AACC',
        yes: 'ADOBE_PACC',
      },
      casa_cc: 'PADC',
      only_cc: 'OYCC',
      casa_asset_cc: 'PADC',
    },
  };

  const isNodeEnv$5 = typeof process !== 'undefined' && process.versions && process.versions.node;
  let ENV = 'dev';
  if(isNodeEnv$5) {
    ENV = 'dev';
  }

  var CONSTANT = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BASEURL: BASEURL$2,
    CHANNEL: CHANNEL$1,
    CURRENT_FORM_CONTEXT: CURRENT_FORM_CONTEXT$1,
    DEAD_PAN_STATUS: DEAD_PAN_STATUS,
    ENDPOINTS: ENDPOINTS$1,
    get ENV () { return ENV; },
    FORM_RUNTIME: FORM_RUNTIME,
    ID_COM: ID_COM
  });

  /**
   * Displays a loader with optional loading text.
   * @param {string} loadingText - The loading text to display (optional).
   */

  function displayLoader$1(loadingText) {
    const bodyContainer = document.querySelector('.appear');
    bodyContainer.classList.add('preloader');
  }

  /**
   * Hides the loader.
   */
  function hideLoaderGif$1() {
    const bodyContainer = document.querySelector('.appear');
    bodyContainer.classList.remove('preloader');
    if (bodyContainer.hasAttribute('loader-text')) {
      bodyContainer.removeAttribute('loader-text');
    }
  }

  /**
  * Initiates an http call with JSON payload to the specified URL using the specified method.
   *
   * @param {string} url - The URL to which the request is sent.
   * @param {object} payload - The data payload to send with the request.
   * @param {string} [method='POST'] - The HTTP method to use for the request (default is 'POST').
   * @param {boolean} [loader=false] - Whether to hide the loader GIF after the response is received (default is false).
   * @returns {Promise<*>} - A promise that resolves to the JSON response from the server.
   */
  // eslint-disable-next-line default-param-last
  async function fetchJsonResponse(url, payload, method, loader = false) {
    try {
      if (ENV === 'dev') {
        return fetch(url, {
          method,
          body: payload ? JSON.stringify(payload) : null,
          mode: 'cors',
          headers: {
            'Content-type': 'text/plain',
            Accept: 'application/json',
          },
        })
          .then((res) => {
            if (loader) hideLoaderGif$1();
            return res.json();
          });
      }
      const responseObj = await invokeRestAPIWithDataSecurity(payload);
      const response = await fetch(url, {
        method,
        body: responseObj.dataEnc,
        mode: 'cors',
        headers: {
          'Content-type': 'text/plain',
          Accept: 'text/plain',
          'X-Enckey': responseObj.keyEnc,
          'X-Encsecret': responseObj.secretEnc,
        },
      });
      const result = await response.text();
      const decryptedResult = await decryptDataES6(result, responseObj.secret);
      if (loader) hideLoaderGif$1();
      return JSON.parse(decryptedResult);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in fetching JSON response:', error);
      throw error;
    }
  }

  /**
   * Initiates an http call with JSON payload to the specified URL using the specified method.
   *
   * @param {string} url - The URL to which the request is sent.
   * @param {string} [method='POST'] - The HTTP method to use for the request (default is 'POST').
   * @param {object} payload - The data payload to send with the request.
   * @returns {*} - The JSON response from the server.
   */
  async function getJsonResponse(url, payload, method = 'POST') {
    try {
      if (ENV === 'dev') {
        return fetch(url, {
          method,
          body: payload ? JSON.stringify(payload) : null,
          mode: 'cors',
          headers: {
            'Content-type': 'text/plain',
            Accept: 'application/json',
          },
        })
          .then((res) => res.json())
          .catch((err) => {
            throw err;
          });
      }
      const responseObj = await invokeRestAPIWithDataSecurity(payload);
      const response = await fetch(url, {
        method,
        body: responseObj.dataEnc,
        mode: 'cors',
        headers: {
          'Content-type': 'text/plain',
          Accept: 'text/plain',
          'X-Enckey': responseObj.keyEnc,
          'X-Encsecret': responseObj.secretEnc,
        },
      });
      const result = await response.text();
      const decryptedResult = await decryptDataES6(result, responseObj.secret);
      return JSON.parse(decryptedResult);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in fetching JSON response:', error);
      throw error;
    }
  }

  const JOURNEY_NAME = 'SMART_EMI_JOURNEY';
  const PRO_CODE$1 = '009';
  const ERROR_MSG$1 = {
    mobileError: 'Enter valid mobile number',
    noEligibleTxnFlow: 'There are no eligible transactions on this card. Please try a different card.',
  };

  const FLOWS_ERROR_MESSAGES$1 = {
    XFACE_INQ_VP_0003: 'Hey, it seems like you have entered incorrect details. Request you to check & re-enter your last 4 digits of the card.',
    XFACE_E2FA_02: 'Incorrect OTP code. Please try again.', // For this case error message is hardcoded in rule
    XFACE_E2FA_04: 'Oops! you have entered wrong otp too many times please try again later',
    "1000": "Sorry, this card is not eligible for SmartEMI. You may retry with a different credit card."
  };

  const CHANNELS$1 = {
    adobeWeb: 'ADOBE_WEB',
    adobeWhatsApp: 'ADOBE_WHATSAPP',
  };

  const SEMI_ENDPOINTS = {
    otpGen: 'https://applyonline.hdfcbank.com/content/hdfc_ccforms/api/validatecardotpgen.json',
    otpVal: 'https://applyonline.hdfcbank.com/content/hdfc_hafcards/api/eligibilitycheck.json',
    preexecution: 'https://applyonline.hdfcbank.com/content/hdfc_ccforms/api/preexecution.json',
    masterChanel: 'https://applyonline.hdfcbank.com/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_CHANNEL_MASTER.json',
    ccSmartEmi: 'https://applyonline.hdfcbank.com/content/hdfc_ccforms/api/ccsmartemi.json',
    branchMaster: 'https://applyonline.hdfcbank.com/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_BRANCH_MASTER.BRANCH_CODE',
    dsaCode: 'https://applyonline.hdfcbank.com/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_DSA_MASTER.DSACODE',
  };

  const DOM_ELEMENT = {
    semiWizard: 'aem_semiWizard',
    chooseTransaction: 'aem_chooseTransactions',
    selectTenure: 'aem_selectTenure',
  };

  const MISC$1 = {
    rupeesUnicode: '\u20B9',
  };

  const OTP_TIMER = 30;
  const MAX_OTP_RESEND_COUNT = 3;
  const CURRENT_FORM_CONTEXT = {};
  const DATA_LIMITS$1 = {
    totalSelectLimit: 10,
    otpTimeLimit: 30,
    maxOtpResendLimit: 3,
  };

  var SEMI_CONSTANT = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CHANNELS: CHANNELS$1,
    CURRENT_FORM_CONTEXT: CURRENT_FORM_CONTEXT,
    DATA_LIMITS: DATA_LIMITS$1,
    DOM_ELEMENT: DOM_ELEMENT,
    ERROR_MSG: ERROR_MSG$1,
    FLOWS_ERROR_MESSAGES: FLOWS_ERROR_MESSAGES$1,
    JOURNEY_NAME: JOURNEY_NAME,
    MAX_OTP_RESEND_COUNT: MAX_OTP_RESEND_COUNT,
    MISC: MISC$1,
    OTP_TIMER: OTP_TIMER,
    PRO_CODE: PRO_CODE$1,
    SEMI_ENDPOINTS: SEMI_ENDPOINTS
  });

  // DOM - UTILS - having cer tain dom overing function which has been used in formutils.js by the imported
  // and got declared in constant name as - DOM_API.
  // search with key - DOM_API to track of all dom function to track in formutils which is used over all the functions.

  /**
   * Sets data attribute and value on the closest ancestor element with the specified class name.
   * @param {string} elementName - The name of the element to search for.
   * @param {string} fieldValue - The value to check for existence before setting data.
   * @param {string} dataAttribute - The name of the data attribute to set.
   * @param {string} value - The value to set for the data attribute.
   * @param {string} ancestorClassName - The class name of the ancestor element where the data attribute will be set.
   */
  const setDataAttributeOnClosestAncestor$1 = (elementName, fieldValue, dataAttribute, value, ancestorClassName) => {
    if (!fieldValue) {
      return;
    }

    // Get the element by name
    const element = document.getElementsByName(elementName)?.[0];

    // If element exists, set data attribute on the closest ancestor with the specified class name
    if (element) {
      const closestAncestor = element.closest(`.${ancestorClassName}`);
      if (closestAncestor) {
        closestAncestor.setAttribute(dataAttribute, value);
      }
    }
  };

  /**
   * Sets the options of a select element based on the provided option lists.
   * @param {Array<object>} optionLists - An array of objects representing the options to be set.
   * @param {string} elementName - The name attribute of the select element.
   */
  const setSelectOptions$1 = (optionLists, elementName) => {
    const selectOption = document.querySelector(`[name=${elementName}]`);
    optionLists?.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option?.value;
      optionElement.textContent = option?.label;
      const parent = selectOption?.parentNode;
      selectOption?.appendChild(optionElement);
      parent?.setAttribute('data-active', true);
    });
  };

  /**
   * Moves the corporate card wizard view from one step to the next step.
   * @param {String} source - The name attribute of the source element (parent wizard panel).
   * @param {String} target - The name attribute of the destination element.
   */
  const moveWizardView$1 = (source, target) => {
    const navigateFrom = document.getElementsByName(source)?.[0];
    const current = navigateFrom?.querySelector('.current-wizard-step');
    const currentMenuItem = navigateFrom?.querySelector('.wizard-menu-active-item');
    const navigateTo = document.getElementsByName(target)?.[0];
    current?.classList?.remove('current-wizard-step');
    navigateTo?.classList?.add('current-wizard-step');
    // add/remove active class from menu item
    const navigateToMenuItem = navigateFrom?.querySelector(`li[data-index="${navigateTo?.dataset?.index}"]`);
    currentMenuItem?.classList?.remove('wizard-menu-active-item');
    navigateToMenuItem?.classList?.add('wizard-menu-active-item');
    const event = new CustomEvent('wizard:navigate', {
      detail: {
        prevStep: { id: current?.id, index: parseInt(current?.dataset?.index || 0, 10) },
        currStep: { id: navigateTo?.id, index: parseInt(navigateTo?.dataset?.index || 0, 10) },
      },
      bubbles: false,
    });
    navigateFrom?.dispatchEvent(event);
  };

  /**
   * Changes the language of the Aadhar content to the specified language.
   * @param {Object} content - The content configuration for Aadhar.
   * @param {string} defaultLang - The language to show us default.
   * @param {Object} currentFormContext - current form context to store the language selected for aadhar
   */
  // select dropdow-aadhar
  const aadharLangChange$1 = async (adharContentDom, defaultLang, currentFormContext) => {
    const selectOp = adharContentDom.querySelector(`[name= ${'selectLanguage'}]`);
    const findFieldSet = adharContentDom?.querySelectorAll('fieldset');
    const selectedClass = 'selected-language';
    const defaultOptionClass = `field-aadharconsent-${defaultLang?.toLowerCase()}`;
    const applySelected = (fieldNode, optionClass, nameClass) => {
      fieldNode?.forEach((element) => {
        if (element?.classList?.contains(optionClass)) {
          element.style.display = 'block';
          element?.classList.add(nameClass);
        } else {
          element.style.display = 'none';
          element?.classList.remove(nameClass);
        }
      });
    };
    applySelected(findFieldSet, defaultOptionClass, selectedClass);
    currentFormContext.languageSelected = defaultLang;
    selectOp.value = defaultLang;
    selectOp?.addEventListener('change', (e) => {
      e.preventDefault();
      const { value: valueSelected } = e.target;
      selectOp.value = valueSelected;
      currentFormContext.languageSelected = valueSelected;
      const optionClass = `field-aadharconsent-${valueSelected?.toLowerCase()}`;
      applySelected(findFieldSet, optionClass, selectedClass);
    });
  };

  /**
   * Hides the incorrect OTP text message when the user starts typing in the OTP input field.
   */
  const removeIncorrectOtpText = () => {
    const otpNumFormName = 'otpNumber';// constantName-otpNumberfieldName
    const otpNumbrQry = document.getElementsByName(otpNumFormName)?.[0];
    const incorectOtp = document.querySelector('.field-incorrectotptext');
    otpNumbrQry?.addEventListener('input', (e) => {
      if (e.target.value) {
        incorectOtp.style.display = 'none';
      }
    });
  };

  /**
   * Adds the 'wrapper-disabled' class to the parent elements of inputs or selects within the given panel
   * if their values are truthy (or) the name of the panel input is 'middleName'.
   * @param {HTMLElement} selectedPanel - The panel element containing the inputs or selects.
   */
  const addDisableClass$1 = (selectedPanel) => {
    const panelInputs = Array.from(selectedPanel.querySelectorAll('input, select'));

    // Iterates over each input or select element
    panelInputs.forEach((panelInput) => {
      // Checks if the input or select element has a truthy value
      if (panelInput.value || panelInput.name === 'middleName') {
        // Adds the 'wrapper-disabled' class to the parent element
        panelInput.parentElement.classList.add('wrapper-disabled');
      }
    });
  };

  /**
   * Creates a label element and appends it to a specified element in the DOM.
   * @param {string} elementSelector - The CSS selector for the target element.
   * @param {string} labelClass - The class to be applied to the created label element.
   * @returns {void}
   */
  const createLabelInElement$1 = (elementSelector, labelClass) => {
    /**
  * The main element in the DOM where the form resides.
  * @type {HTMLElement}
  */
    const mainEl = document.getElementsByTagName('main')[0];
    /**
  * The form element containing the target element.
  * @type {HTMLElement}
  */
    const formEl = mainEl.querySelector('form');
    /**
  * The target element to which the label will be appended.
  * @type {HTMLElement}
  */
    const element = formEl.querySelector(elementSelector);
    if (!element) {
      return;
    }

    /**
  * The text content of the label element.
  * @type {string}
  */
    const labelText = element.getElementsByTagName('label')[0].innerHTML;
    element.getElementsByTagName('label')[0].innerHTML = '';
    if (!labelText) {
      return;
    }

    /**
  * The newly created label element.
  * @type {HTMLLabelElement}
  */
    const labelElement = document.createElement('label');
    labelElement.classList.add(labelClass);
    labelElement.textContent = labelText;
    element.appendChild(labelElement);
  };
  /**
   * Decorates the stepper for CC yourDetails panel
   * @name decorateStepper Runs after yourDetails panel is initialized
   */
  function decorateStepper$1() {
    const totalIndex = document.querySelector('.field-corporatecardwizardview.wizard').style.getPropertyValue('--wizard-step-count');
    const ccDetailsWizard = document.querySelector('.field-corporatecardwizardview.wizard ul');
    Array.from(ccDetailsWizard.children).forEach((child) => {
      if (child.tagName.toLowerCase() === 'li' && Number(child.getAttribute('data-index')) !== totalIndex - 1) {
        child?.classList?.add('stepper-style');
      }
    });
  }

  /**
   * Displays a loading indicator by adding a 'preloader' class to the body container.
   * Optionally sets a loading text as a custom attribute.
   *
   * @param {string} [loadingText] - The text to display as a loading message.
   */
  const displayLoader = (loadingText) => {
    const bodyContainer = document?.querySelector('.appear');
    bodyContainer?.classList?.add('preloader');
    if (loadingText) {
      bodyContainer.setAttribute('loader-text', loadingText);
    }
  };

  /**
   * Hides the loading indicator by removing the 'preloader' class from the body container.
   * Removes the loading text attribute if it exists.
   */
  const hideLoaderGif = () => {
    const bodyContainer = document?.querySelector('.appear');
    bodyContainer?.classList?.remove('preloader');
    if (bodyContainer.hasAttribute('loader-text')) {
      bodyContainer.removeAttribute('loader-text');
    }
  };

  /**
   * Sets the maximum allowable date for an input field to today's date.
   * @param {string} inputName - The name attribute of the input field to be validated.
   */
  const setMaxDateToToday = (inputName) => {
    const calendarEl = document.querySelector(`[name= ${inputName}]`);
    calendarEl?.setAttribute('max', new Date()?.toISOString()?.split('T')?.[0]);
  };

  /**
   * Filters out non-numeric characters,spaces and special characters from the input value.
   * This function binds an 'input' event listener to the input field identified by the given name attribute.
   *
   * @param {string} inputName - The name attribute value of the input field to be validated.
   * @returns {void}
   */
  const restrictToAlphabetsNoSpaces = (inputName) => {
    const inputField = document.querySelector(`[name= ${inputName}]`);
    inputField?.addEventListener('input', (e) => {
      const input = e.target;
      input.value = input.value.replace(/(?![A-Z])[`!@#$%^&*_=[\]{};':"\\|,.<>/?~0-9()+-_ ]/g, ''); // Replace non-numeric characters with an empty string
    });
  };

  /**
   * Groups characters in an input field, adding a space after every specified number of characters.
   *
   * @param {HTMLInputElement} inputField - The input field element whose value is to be formatted.
   * @param {number[]} gapLengths - An array of integers representing the lengths of groups between gaps.
   */
  const groupCharacters = (inputField, gapLengths) => {
    const value = inputField.value.replace(/\s+/g, '');
    let formattedValue = '';
    let position = 0;
    let gapsIndex = 0;
    let gapPosition = gapLengths[gapsIndex] || Infinity;

    for (let i = 0; i < value.length; i += 1) {
      if (position === gapPosition) {
        formattedValue += ' ';
        gapsIndex += 1;
        gapPosition = gapLengths[gapsIndex] || Infinity;
        position = 0;
      }
      formattedValue += value[i];
      position += 1;
    }

    inputField.value = formattedValue;
  };

  /**
   * Validates and formats a phone number input field.
   *
   * @param {HTMLInputElement} inputField - The input field element containing the phone number.
   * @param {number[]} validStartingDigits - An array of valid starting digits for the phone number.
   */
  const validatePhoneNumber = (inputField, validStartingDigits) => {
    let { value } = inputField;

    // Ensure the input starts with a valid digit
    if (value.length > 0 && !validStartingDigits.includes(value[0])) {
      inputField.value = '';
      return;
    }

    // Remove invalid characters (non-digits) from the entire input
    value = value.replace(/\D/g, '');

    // Check if all 10 characters would be the same
    if (value.length === 10) {
      const isAllSame = value.split('').every((digit) => digit === value[0]);
      if (isAllSame) {
        value = value.slice(0, 9); // Remove the last character to avoid all being the same
      } else {
        const firstNine = value.slice(0, 9);
        const lastDigit = value[9];
        if (firstNine.split('').every((digit) => digit === lastDigit)) {
          value = value.slice(0, 9); // Remove the last character if it's the same as the previous 9
        }
      }
    }
    inputField.value = value;
  };

  const validateCardDigits = (inputField) => {
    let { value } = inputField;

    // Ensure the input starts with a valid digit
    if (value.length > 0 && !/\d/.test(value[0])) {
      inputField.value = '';
      return;
    }

    // Remove invalid characters (non-digits) from the entire input
    value = value.replace(/\D/g, '');

    inputField.value = value;
  };

  const validateOTPInput = (inputField) => {
    const { value } = inputField;

    // Ensure the input values are digits
    if (!/^\d+$/.test(value)) {
      inputField.value = inputField.value.slice(0, -1);
    }
  };

  /**
   * Attaches a click handler to an element that redirects to a specified URL.
   *
   * @param {string} selector - The CSS selector for the element to make clickable.
   * @param {string} url - The URL to navigate to when the element is clicked.
   * @param {string} [target='_blank'] - The target window or tab for the URL (e.g., '_blank', '_self').
   */
  const attachRedirectOnClick$1 = (selector, url, target = '_blank') => {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        window?.open(url, target);
      });
    }
  };

  var DOM_API = /*#__PURE__*/Object.freeze({
    __proto__: null,
    aadharLangChange: aadharLangChange$1,
    addDisableClass: addDisableClass$1,
    attachRedirectOnClick: attachRedirectOnClick$1,
    createLabelInElement: createLabelInElement$1,
    decorateStepper: decorateStepper$1,
    displayLoader: displayLoader,
    groupCharacters: groupCharacters,
    hideLoaderGif: hideLoaderGif,
    moveWizardView: moveWizardView$1,
    removeIncorrectOtpText: removeIncorrectOtpText,
    restrictToAlphabetsNoSpaces: restrictToAlphabetsNoSpaces,
    setDataAttributeOnClosestAncestor: setDataAttributeOnClosestAncestor$1,
    setMaxDateToToday: setMaxDateToToday,
    setSelectOptions: setSelectOptions$1,
    validateCardDigits: validateCardDigits,
    validateOTPInput: validateOTPInput,
    validatePhoneNumber: validatePhoneNumber
  });

  /* eslint-disable no-underscore-dangle */
  /* eslint no-bitwise: ["error", { "allow": ["^", ">>", "&"] }] */


  const {
    setDataAttributeOnClosestAncestor,
    setSelectOptions,
    moveWizardView,
    aadharLangChange,
    addDisableClass,
    createLabelInElement,
    decorateStepper,
    attachRedirectOnClick,
  } = DOM_API; // DOM_MANIPULATE_CODE_FUNCTION

  const { BASEURL: BASEURL$1 } = CONSTANT;

  // declare-CONSTANTS
  const DATA_ATTRIBUTE_EMPTY = 'data-empty';
  const ANCESTOR_CLASS_NAME = 'field-wrapper';

  /**
   * Generates the full API path based on the environment.
   * @param {string} uri - The endpoint to be appended to the base URL.
   * @returns {string} - The complete API URL including the base URL and the provided endpoint.
   */

  const urlPath$1 = (path) => `${BASEURL$1}${path}`;

  /**
   * Removes spaces and special characters from a given string.
   * @param {string} str - The input string to be cleaned
   * @returns {string} - The input string with spaces and special characters removed.
   */
  const clearString = (str) => (str ? str?.replace(/[\s~`!@#$%^&*(){}[\];:"'<,.>?/\\|_+=-]/g, '') : '');

  /**
   * Utility function for managing properties of a panel.
   * @param {object} globalObj - The global object containing functions.
   * @param {object} panelName - The name of the panel to manipulate.
   * @returns {void}
   */

  const formUtil = (globalObj, panelName) => ({
    /**
      * Sets the visibility of the panel.
      * @param {boolean} val -The visibility value to set.
      * @returns {void}
      */
    visible: (val) => {
      globalObj.functions.setProperty(panelName, { visible: val });
    },
    /**
      * Sets the enabled/disabled state of the panel.
      * @param {boolean} val -The enabled/disabled value to set.
      * @returns {void}
      */

    enabled: (val) => {
      globalObj.functions.setProperty(panelName, { enabled: val });
    },
    /**
   * Sets the value of a panel and updates the data attribute if specified.
   * @param {any} val - The value to set for the panel.
   * @param {Object} changeDataAttr - An object containing information about whether to change the data attribute.
   * @param {boolean} changeDataAttr.attrChange - Indicates whether to change the data attribute.
   * @param {string} changeDataAttr.value - The value to set for the data attribute.
   */
    setValue: (val, changeDataAttr) => {
      globalObj.functions.setProperty(panelName, { value: val });
      if (changeDataAttr?.attrChange && val) {
        const element = document.getElementsByName(panelName._data.$_name)?.[0] || document.getElementsByName(panelName.$name)?.[0];
        if (element) {
          const closestAncestor = element.closest(`.${ANCESTOR_CLASS_NAME}`);
          if (closestAncestor) {
            closestAncestor.setAttribute(DATA_ATTRIBUTE_EMPTY, changeDataAttr.value);
          }
        }
        if (changeDataAttr?.disable && val) {
          globalObj.functions.setProperty(panelName, { readOnly: true });
        }
      }
    },
    /**
     * Sets the value of an enum field with the provided options and value.
     * @param {Array} enumOptions - An array containing the options for the enum field.
     * @param {String} val - The value to set for the enum field
     */
    setEnum: (enumOptions, val) => {
      globalObj.functions.setProperty(panelName, { enum: enumOptions, value: val }); // setting initial value among enums options
    },
    /**
     *  Resets the field by setting its value to empty and resetting floating labels.
     */
    resetField: () => {
      globalObj.functions.setProperty(panelName, { value: '' });
      const element = document.getElementsByName(panelName._data.$_name)?.[0] || document.getElementsByName(panelName.$name)?.[0];
      if (element) {
        const closestAncestor = element.closest(`.${ANCESTOR_CLASS_NAME}`);
        if (closestAncestor) {
          closestAncestor.setAttribute(DATA_ATTRIBUTE_EMPTY, true);
        }
      }
    },
  });
  /**
     * Removes all undefined keys from the form datand reduces overall size of the object.
     * @param {object} jsonObj
     */
  const removeUndefinedKeys = (jsonObj) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(jsonObj)) {
      if (value === null || value === undefined) delete jsonObj[key];
    }
  };

  /**
     * Filters out all defined values from the form data using the globals object.
     * @param {object} globaObj- Globals variables object containing form configurations.
     * * @param {object} currentFormContext - additional data variables object containing form configurations.
     * @returns {object} -Object containing only defined values.
     */
  const santizedFormDataWithContext = (globals, currentFormContext) => {
    try {
      const formData = (Object.prototype.hasOwnProperty.call(globals, 'form') && Object.prototype.hasOwnProperty.call(globals, 'functions')) ? globals.functions.exportData() : globals;
      formData.currentFormContext = currentFormContext;
      if (formData.form) {
        const {
          data, analytics, queryParams, ...formDataPayload
        } = formData;
        removeUndefinedKeys(formDataPayload);
        removeUndefinedKeys(formDataPayload?.form);
        return JSON.parse(JSON.stringify(formDataPayload));
      }
      return formData;
    } catch (ex) {
      return null;
    }
  };

  /**
   * Generates a Version 4 UUID (Universally Unique Identifier) using a cryptographically secure method.
   * @returns {string} The generated UUID string.
   */
  const generateUUID = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
  /**
   * Creates a deep copy of the given blueprint object.
   *
   * This function returns a new object that is a deep copy of the blueprint object,
   * ensuring that nested objects are also copied rather than referenced.
   *
   * @param {Object} blueprint - The blueprint object to copy.
   * @returns {Object} A deep copy of the blueprint object.
   */
  function createDeepCopyFromBlueprint(blueprint) {
    return JSON.parse(JSON.stringify(blueprint));
  }

  // import semitcRedirectURI from '../../blocks/form/constant.js';
  /**
   * Function validates the Mobile Input Field
   *
   */
  const addMobileValidation = async () => {
    const validFirstDigits = ['6', '7', '8', '9'];
    if (typeof document === 'undefined') return;
    const inputField = document.querySelector('.field-aem-mobilenum input');
    inputField?.addEventListener('input', () => validatePhoneNumber(inputField, validFirstDigits));
  };

  /**
     * Function validates the Card Last 4 digits Input Field
     *
     */
  const addCardFieldValidation = () => {
    if (typeof document === 'undefined') return;
    const inputField = document.querySelector('.field-aem-cardno input');
    inputField?.addEventListener('input', () => validateCardDigits(inputField));
  };

  /**
    * Function validates the OTP Input Field
    *
    */
  const addOtpFieldValidation = () => {
    if (typeof document === 'undefined') return;
    const inputField = document.querySelector('.field-aem-otpnumber input');
    const inputField2 = document.querySelector('.field-aem-otpnumber2 input');
    [inputField, inputField2].forEach((ip) => ip?.addEventListener('input', () => validateOTPInput(ip)));
  };

  /**
    * Function validates the OTP Input Field
    *
    */
  const linkToPopupToggle = (hyperLink, popupOverlay, popupContent, closeBtn = false, redirectBtn = false) => {
    if (typeof document === 'undefined') return;
    const links = document.querySelectorAll(hyperLink);
    let redirectionLink = '';
    [...links].forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        document.querySelector(popupOverlay).setAttribute('data-visible', 'true');
        document.querySelector(popupContent).setAttribute('data-visible', 'true');
        redirectionLink = link.getAttribute('href');
      });
    });

    if (closeBtn) {
      document.querySelector(closeBtn)?.addEventListener('click', (event) => {
        event.preventDefault();
        document.querySelector(popupOverlay).setAttribute('data-visible', 'false');
        document.querySelector(popupContent).setAttribute('data-visible', 'false');
      });
    }
    if (redirectBtn) {
      document.querySelector(redirectBtn).addEventListener('click', (event) => {
        event.preventDefault();
        window.open(redirectionLink, '_blank').focus();
      });
    }
  };

  /**
   * Retrieves the value of a query parameter from the URL, case insensitively.
   * This function searches the current URL's query parameters for a parameter that matches the provided name, ignoring case sensitivity.
   * @param {string} param - The name of the query parameter to retrieve.
   * @returns {string|null} The value of the query parameter if found; otherwise, `null`.
   */
  const getUrlParamCaseInsensitive = (param) => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const paramEntry = [...urlSearchParams.entries()]
      .find(([key]) => key.toLowerCase() === param.toLowerCase());
    return paramEntry ? paramEntry[1] : null;
  };

  const isNodeEnv$4 = typeof process !== 'undefined' && process.versions && process.versions.node;

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
    createLabelInElement$1('.field-employeeassistancetoggle', 'employee-assistance-toggle__label');
    createLabelInElement$1('.field-mailingaddresstoggle', 'mailing-address-toggle__label');
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
      minimumFractionDigits: minimumFractionDigits,
    };
    const interestNumber = (number / 100).toFixed(minimumFractionDigits);
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

  if (!isNodeEnv$4) {
    setTimeout(() => {
      validationField();
    }, 1000);
  }

  const { SEMI_ENDPOINTS: semiEndpoints$1 } = SEMI_CONSTANT;

  /* Utp-Params */
  const UTM_PARAMS = {
    channel: null, // CHANNEL
    lgcode: null, // LGCODE
    smcode: null, // SMCODE
    lc2: null, // LC1
    lc1: null, // LC2
    dsacode: null, // DSACODE
    branchcode: null, // BRANCHCODE
  };

  /**
   * Extracts specific tenure-related fields from the global form object.
   * @param {object} globals - global form object
   * @returns {object} - An object containing the extracted tenure-related fields:
   *  - `continueToTQbtn` {Object}: The continue button element.
   *  - `tNCCheckBox` {Object}: The terms and conditions checkbox element.
   *  - `tnCMadCheckBox` {Object}: The T&C MAD checkbox element.
   */
  const getSelectTenureFields = async (globals) => {
    const selectTenure = globals.form.aem_semiWizard.aem_selectTenure;
    const {
      aem_continueToTQ: continueToTQbtn,
      tnCPanelWrapper: {
        aem_tandC: tNCCheckBox,
      },
      aem_tandCMAD: tnCMadCheckBox,
    } = selectTenure;
    return {
      continueToTQbtn,
      tNCCheckBox,
      tnCMadCheckBox,
    };
  };

  /**
   * extract all the asst panal form object by passing globals
   * @param {object} globals - global form object;
   * @returns {object} - All pannel object present inside employee asst pannel
   */

  const extractEmpAsstPannels = async (globals) => {
    const employeeAsstPanel = globals.form.aem_semiWizard.aem_selectTenure.aem_employeeAssistancePanel;
    const {
      aem_channel: channel,
      aem_bdrLc1Code: bdrLc1Code,
      aem_branchCity: branchCity,
      aem_branchCode: branchCode,
      aem_branchName: branchName,
      aem_branchTseLgCode: branchTseLgCode,
      aem_dsaCode: dsaCode,
      aem_dsaName: dsaName,
      aem_lc1Code: lc1Code,
      aem_lc2Code: lc2Code,
      aem_lgTseCode: lgTseCode,
      aem_smCode: smCode,
    } = employeeAsstPanel;
    return {
      channel, bdrLc1Code, branchCity, branchCode, branchName, branchTseLgCode, dsaCode, dsaName, lc1Code, lc2Code, lgTseCode, smCode,
    };
  };

  /**
   * Sets the value of a form field using the provided globals and field.
   * @param {Object} globals - The global state object.
   * @param {string} field - The name of the field to set.
   * @param {string|null} value - The value to set for the field.
   */
  const setFieldsValue = (globals, field, value) => {
    const fieldUtil = formUtil(globals, field);
    const changeDataAttrObj = { attrChange: true, value: false, disable: true };
    const valueInUC = (String(value))?.toUpperCase();
    fieldUtil.setValue(valueInUC, changeDataAttrObj);
  };

  /**
   * Pre-fills form fields based on UTM parameters if they exist.
   * The function maps UTM parameters to their respective fields and sets their values.
   * @async
   * @param {Object} globals - The global state object used for fetching fields and values.
   */
  const preFillFromUtm = async (globals) => {
    const {
      branchCode, dsaCode, lc1Code, bdrLc1Code, lc2Code, smCode, lgTseCode,
    } = await extractEmpAsstPannels(globals);
    // dsa, branch based on that lc1 code fields should be changed.
    const decideLC1Code = (UTM_PARAMS?.dsacode || UTM_PARAMS?.branchcode) ? bdrLc1Code : lc1Code;
    // Mapping UTM params to field names
    const fieldMapping = {
      dsacode: dsaCode,
      lc1: decideLC1Code,
      lc2: lc2Code,
      branchcode: branchCode,
      smcode: smCode,
      lgcode: lgTseCode,
    };
      // Iterate over the UTM_PARAMS object
    Object.entries(UTM_PARAMS).forEach(([key, value]) => {
      if (value && fieldMapping[key]) {
        setFieldsValue(globals, fieldMapping[key], value);
      }
    });
  };

  /**
     * initiate master channel api on toggle switch
     * @param {object} globals - global form object
     */
  const assistedToggleHandler = async (globals) => {
    try {
      const response = await getJsonResponse(semiEndpoints$1.masterChanel, null, 'GET');
      const { channel, ...asstPannels } = await extractEmpAsstPannels(globals);
      const {
        continueToTQbtn,
        tNCCheckBox,
        tnCMadCheckBox,
      } = await getSelectTenureFields(globals);
      const asstPannelArray = Object.entries(asstPannels).map(([, proxyFiels]) => proxyFiels);
      const channelDropDown = channel;
      const DEF_OPTION = [{ label: 'Website Download', value: 'Website Download' }];
      const responseOption = response?.map((item) => ({ label: item?.CHANNELS, value: item?.CHANNELS }));
      const channelOptions = responseOption?.length ? DEF_OPTION.concat(responseOption) : DEF_OPTION;
      const chanelEnumNames = channelOptions?.map((item) => item?.label);
      setSelectOptions$1(channelOptions, channelDropDown?.$name);
      if (UTM_PARAMS.channel) {
        const findParamChanelValue = channelOptions?.find((el) => clearString(el.value)?.toLocaleLowerCase() === clearString(UTM_PARAMS.channel)?.toLocaleLowerCase());
        globals.functions.setProperty(channelDropDown, {
          enum: chanelEnumNames, enumNames: chanelEnumNames, value: findParamChanelValue.value, enabled: false,
        });
        await preFillFromUtm(globals);
      } else {
        globals.functions.setProperty(channelDropDown, { enum: chanelEnumNames, enumNames: chanelEnumNames, value: DEF_OPTION[0].value });
        if ((channelDropDown.$value === DEF_OPTION[0].value) && (tNCCheckBox.$value) && (tnCMadCheckBox.$value)) {
          globals.functions.setProperty(continueToTQbtn, { enabled: true });
        }
        asstPannelArray?.forEach((pannel) => globals.functions.setProperty(pannel, { visible: false }));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  /**
     * change handler in channel dropdown
     * @param {object} globals - global form object
     */
  const channelDDHandler = async (globals) => {
    const { channel, ...asstPannels } = await extractEmpAsstPannels(globals);
    const asstPannelArray = Object.entries(asstPannels).map(([, proxyFiels]) => proxyFiels);
    asstPannelArray?.forEach((item) => globals.functions.setProperty(item, { visible: false }));
    const {
      bdrLc1Code, branchCity, branchCode, branchName, branchTseLgCode, dsaCode, dsaName, lc1Code, lc2Code, lgTseCode, smCode,
    } = asstPannels;
    const pannelSetting = {
      websiteDownload: asstPannelArray,
      branch: [branchCode, branchName, branchCity, smCode, bdrLc1Code, lc2Code, branchTseLgCode],
      dsa: [dsaCode, dsaName, smCode, bdrLc1Code, lc2Code, lgTseCode],
      defaultCase: [smCode, lc1Code, lc2Code, lgTseCode],
    };
    const CHANNEL_VALUE = clearString(channel.$value)?.toLowerCase();
    switch (CHANNEL_VALUE) {
      case 'websitedownload':
        asstPannelArray?.forEach((item) => globals.functions.setProperty(item, { visible: false }));
        break;
      case 'branch':
        pannelSetting.branch?.forEach((item) => globals.functions.setProperty(item, { visible: true }));
        break;
      case 'dsa':
        pannelSetting.dsa?.forEach((item) => globals.functions.setProperty(item, { visible: true }));
        break;
      default:
        pannelSetting.defaultCase?.forEach((item) => globals.functions.setProperty(item, { visible: true }));
    }
  };

  /**
     * branchcode handler
     * @param {object} globals - globals form object
     */
  const branchHandler = async (globals) => {
    const { branchName, branchCity, branchCode } = await extractEmpAsstPannels(globals);
    const {
      continueToTQbtn,
      // eslint-disable-next-line no-unused-vars
      tNCCheckBox,
      // eslint-disable-next-line no-unused-vars
      tnCMadCheckBox,
    } = await getSelectTenureFields(globals);
    const branchNameUtil = formUtil(globals, branchName);
    const branchCityUtil = formUtil(globals, branchCity);
    const INVALID_MSG = 'Please enter valid Branch Code';
    if (!branchCode.$value) {
      globals.functions.markFieldAsInvalid(branchCode.$qualifiedName, INVALID_MSG, { useQualifiedName: true });
      return;
    }
    try {
      const branchCodeUrl = `${semiEndpoints$1.branchMaster}-${branchCode.$value}.json`;
      const response = await getJsonResponse(branchCodeUrl, null, 'GET');
      const data = response?.[0];
      if (data?.errorCode === '500') {
        throw new Error(data?.errorMessage);
      } else {
        const cityName = data?.CITY_NAME;
        const branchnameVal = data?.BRANCH_NAME;
        const changeDataAttrObj = { attrChange: true, value: false, disable: true };
        branchNameUtil.setValue(branchnameVal, changeDataAttrObj);
        branchCityUtil.setValue(cityName, changeDataAttrObj);
      }
    } catch (error) {
      if (error.message === 'No Records Found') {
        globals.functions.markFieldAsInvalid(branchCode.$qualifiedName, INVALID_MSG, { useQualifiedName: true });
      }
      globals.functions.setProperty(continueToTQbtn, { enabled: false });
      branchNameUtil.resetField();
      branchCityUtil.resetField();
    }
  };

  /**
     * dsa code change handler
     * @param {globals} globals - globals - form object
     */
  const dsaHandler = async (globals) => {
    //  'XKSD' //BSDG003
    const { dsaCode, dsaName } = await extractEmpAsstPannels(globals);
    const {
      continueToTQbtn,
      // eslint-disable-next-line no-unused-vars
      tNCCheckBox,
      // eslint-disable-next-line no-unused-vars
      tnCMadCheckBox,
    } = await getSelectTenureFields(globals);
    const INVALID_MSG = 'Please enter valid DSA Code';
    const dsaNameUtil = formUtil(globals, dsaName);
    if (!dsaCode.$value) {
      globals.functions.markFieldAsInvalid(dsaCode.$qualifiedName, INVALID_MSG, { useQualifiedName: true });
      return;
    }
    try {
      const dsaCodeUrl = `${semiEndpoints$1.dsaCode}-${dsaCode.$value?.toLowerCase()}.json`;
      const response = await getJsonResponse(dsaCodeUrl, null, 'GET');
      const data = response?.[0];
      if (data?.errorCode === '500') {
        throw new Error(data?.errorMessage);
      } else {
        const dsaNameVal = data?.DSANAME;
        const changeDataAttrObj = { attrChange: true, value: false, disable: true };
        dsaNameUtil.setValue(dsaNameVal, changeDataAttrObj);
      }
    } catch (error) {
      if (error.message === 'No Records Found') {
        globals.functions.markFieldAsInvalid(dsaCode.$qualifiedName, INVALID_MSG, { useQualifiedName: true });
      }
      globals.functions.setProperty(continueToTQbtn, { enabled: false });
      dsaNameUtil.resetField();
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

  /**
   * To handle utm parameter
   */
  const handleMdmUtmParam = async (globals) => {
    if (window !== undefined) {
      Object.entries(UTM_PARAMS).forEach(([key]) => {
        UTM_PARAMS[key] = getUrlParamCaseInsensitive(key);
      });
      const paramFound = Object.entries(UTM_PARAMS).some(([, val]) => val);
      if (paramFound) {
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_bankAssistedToggle, { value: 'Yes' });
      }
    }
  };

  /* temproraily added this journey utils for SEMI , journey utils common file has to be changed to generic */
  const CHANNEL = 'ADOBE_WEBFORMS';
  const isNodeEnv$3 = typeof process !== 'undefined' && process.versions && process.versions.node;

  const {
    CURRENT_FORM_CONTEXT: currentFormContext$2,
  } = SEMI_CONSTANT;

  const BASEURL = "https://applyonline.hdfcbank.com";
  const urlPath = (path) => `${BASEURL}${path}`;

  /**
   * For Web returing currentFormContext as defined in variable
   * Ideally every custom function should be pure function, i.e it should not have any side effect
   * As per current implementation `currentFormContext` is a state outside of the function,
   * so for Flow we have did special handling by storing strigified value in `globals.form.runtime.currentFormContext`
   *
   * @param {scope} globals
   * @returns
   */
  const getCurrentFormContext$1 = (globals) => {
    if (isNodeEnv$3) {
      return JSON.parse(globals.form.runtime.currentFormContext.$value || '{}');
    }
    return currentFormContext$2;
  };

  /**
     * @name invokeJourneyDropOff to log on success and error call backs of api calls
     * @param {state} state
     * @param {string} mobileNumber
     * @param {Object} globals - globals variables object containing form configurations.
     * @return {PROMISE}
     */
  const invokeJourneyDropOff = async (state, mobileNumber, globals) => {
    const journeyJSONObj = {
      RequestPayload: {
        userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
        leadProfile: {
          mobileNumber,
        },
        formData: {
          channel: CHANNEL,
          journeyName: globals.form.runtime.journeyName.$value,
          journeyID: globals.form.runtime.journeyId.$value,
          journeyStateInfo: [
            {
              state,
              stateInfo: JSON.stringify(santizedFormDataWithContext(globals)),
              timeinfo: new Date().toISOString(),
            },
          ],
        },
      },
    };
    const url = urlPath(ENDPOINTS$1.journeyDropOff);
    const method = 'POST';
    return fetchJsonResponse(url, journeyJSONObj, method);
  };

  /**
       * @name invokeJourneyDropOffUpdate
       * @param {string} state
       * @param {string} mobileNumber
       * @param {string} leadProfileId
       * @param {string} journeyId
       * @param {Object} globals - globals variables object containing form configurations.
       * @return {PROMISE}
       */
  const invokeJourneyDropOffUpdate = async (state, mobileNumber, leadProfileId, journeyId, globals) => {
    const formContext = getCurrentFormContext$1(globals);
    if (state === 'CUSTOMER_ONBOARDING_COMPLETE') {
      formContext.LoanReferenceNumber = journeyId?.loanNbr;
    }
    const sanitizedFormData = santizedFormDataWithContext(globals, formContext);
    const journeyJSONObj = {
      RequestPayload: {
        userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : '',
        leadProfile: {
          mobileNumber,
          leadProfileId: leadProfileId?.toString(),
        },
        formData: {
          channel: CHANNEL,
          journeyName: globals.form.runtime.journeyName.$value,
          journeyID: globals.form.runtime.journeyId.$value,
          journeyStateInfo: [
            {
              state,
              stateInfo: JSON.stringify(sanitizedFormData),
              timeinfo: new Date().toISOString(),
            },
          ],
        },
      },
    };
    const url = urlPath(ENDPOINTS$1.journeyDropOffUpdate);
    const method = 'POST';
    return fetchJsonResponse(url, journeyJSONObj, method);
  };

  /**
    * @name invokeJourneyDropOffByParam
    * @param {string} mobileNumber
    * @param {string} leadProfileId
    * @param {string} journeyId
    * @return {PROMISE}
    */
  const invokeJourneyDropOffByParam = async (mobileNumber, leadProfileId, journeyID) => {
    mobileNumber = mobileNumber?.trim();
    const journeyJSONObj = {
      RequestPayload: {
        leadProfile: {
          ...(mobileNumber?.length < 10 ? {} :  { mobileNumber }),
        },
        journeyInfo: {
          journeyID,
        },
      },
    };
    const url = urlPath("/content/hdfc_commonforms/api/whatsappdata.json");
    const method = 'POST';
    return fetchJsonResponse(url, journeyJSONObj, method);
  };

  /* eslint-disable no-unused-vars */
  /* eslint-disable no-console */

  const {
    ENDPOINTS,
    CURRENT_FORM_CONTEXT: currentFormContext$1,
  } = CONSTANT;

  /**
   * Reloads the current page.
   * lead idParam is been strored in current formContext after otpGen btn click
   * @name reloadPage
   * @param {object} globals
   */
  function reloadPage(globals) {
    const leadIdParam = globals.functions.exportData()?.currentFormContext?.leadIdParam || currentFormContext$1?.leadIdParam;
    const { origin, pathname } = window.location;
    const homeUrl = `${origin}${pathname}?leadId=${leadIdParam?.leadId}${(leadIdParam?.mode === 'dev') ? '&mode=dev' : ''} `;
    if (leadIdParam?.leadId) {
      window.location.href = homeUrl;
    } else {
      window.location.reload();
    }
  }

  const ANALYTICS_JOURNEY_STATE = {
    'page load': 'CUSTOMER_IDENTITY_ACQUIRED',
    'otp click': 'CUSTOMER_IDENTITY_RESOLVED',
    'submit otp': 'CUSTOMER_LEAD_QUALIFIED',
    'resend otp': 'CUSTOMER_RESEND_OTP',
    'transaction view': 'CUSTOMER_TXN_SELECTED',
    'tenure page': 'CUSTOMER_PREEXECUTION_SUCCESS',
    'confirm tenure': 'CUSTOMER_ONBOARDING_COMPLETE',
    'resendOtp confirmTenure': 'RESEND_OTP_CUSTOMER_ONBOARDING',
    'thank you': 'CUSTOMER_ONBOARDING_COMPLETE',
    'submit review': 'CUSTOMER_FEEDBACK_SUBMITTED',
  };

  const ANALYTICS_PAGE_NAME = {
    'page load': 'Step 1 - Identify Yourself',
    'otp click': 'Step 1 - Identify Yourself',
    'submit otp': 'Step 2 - Verify with OTP',
    'resend otp': 'Step 2 - Verify with OTP',
    'transaction view': 'Step 3 - View Spends - Select Transactions',
    'tenure page': 'Step 3 - View Spends - Select Tenure',
    'confirm tenure': 'Step 4 - Confirm with OTP',
    'resendOtp confirmTenure': 'Step 4 - Confirm with OTP',
    'thank you': 'Step 5 - Confirmation',
    'submit review': 'Step 5 - Confirmation',
    'Error Page': 'Error Page',
  };

  const ANALYTICS_LINK_BTN = {
    'otp click': {
      linkType: 'button',
      linkName: 'Get OTP',
      StepName: 'Step 1 - Identify Yourself',
      linkPosition: 'Form',
      pageName: ANALYTICS_PAGE_NAME['otp click'],
    },
    'submit otp': { // otp1 typing
      linkType: 'button',
      linkName: 'Submit OTP',
      StepName: 'Step 2 - Verify with OTP',
      linkPosition: 'Form',
      pageName: ANALYTICS_PAGE_NAME['submit otp'],
    },
    'resend otp': { // resendotp1 typing
      linkType: 'button',
      linkName: 'Resend OTP',
      StepName: 'Step 2 - Verify with OTP',
      linkPosition: 'Form',
      pageName: ANALYTICS_PAGE_NAME['resend otp'],
    },
    'transaction view': { // continue on transaction scrren
      linkType: 'button',
      linkName: 'View EMI Amount',
      StepName: 'Step 3 - View Spends - Select Transactions',
      linkPosition: 'Form',
      pageName: ANALYTICS_PAGE_NAME['transaction view'],
    },
    'tenure page': { // preExecution ok
      linkType: 'button',
      linkName: 'Confirm',
      StepName: 'Step 3 - View Spends - Select Tenure',
      linkPosition: 'Form',
      pageName: ANALYTICS_PAGE_NAME['tenure page'],
    },
    'confirm tenure': { // otp2
      linkType: 'button',
      linkName: 'Authenticate',
      StepName: 'Step 4 - Confirm with OTP',
      linkPosition: 'Form',
      pageName: ANALYTICS_PAGE_NAME['confirm tenure'],
    },
    'resendOtp confirmTenure': { // resendotp2 typing
      linkType: 'button',
      linkName: 'Resend OTP',
      StepName: 'Step 4 - Confirm with OTP',
      linkPosition: 'Form',
      pageName: ANALYTICS_PAGE_NAME['confirm tenure'],
    },
    'submit review': {
      linkType: 'button',
      linkName: 'Submit',
      StepName: 'Step 5 - Confirmation',
      linkPosition: 'Form',
      pageName: ANALYTICS_PAGE_NAME['thank you'],
    },
  };

  const ANALYTICS_OBJECT_SEMI = {
    page: {
      pageInfo: {
        pageName: '',
        errorCode: '',
        errorMessage: '',
      },
    },
    user: {
      pseudoID: '',
      journeyID: '',
      journeyName: '',
      journeyState: '',
      casa: '',
      gender: '',
      email: '',
    },
    form: {
      name: '',
    },
    link: {
      linkName: '',
      linkType: '',
      linkPosition: '',
    },
    event: {
      phone: '',
      validationMethod: '',
      status: '',
      rating: '',
    },
  };

  const ANALYTICS_PAGE_LOAD_OBJECT_SEMI = {
    page: {
      pageInfo: {
        pageName: '',
        errorCode: '',
        errorMessage: '',
      },
    },
    user: {
      pseudoID: '',
      journeyID: '',
      journeyName: '',
      journeyState: '',
      casa: '',
    },
    form: {
      name: '',
    },
  };

  /* eslint-disable no-undef */

  const currentState = {
    pageName: '',
  };

  const isNodeEnv$2 = typeof process !== 'undefined' && process.versions && process.versions.node;

  /**
   * Hashes a phone number using SHA-256 algorithm.
   *
   * @function hashInSha256
   * @param {string}  - The phone number to be hashed.
   * @returns {Promise<string>} A promise that resolves to the hashed phone number in hexadecimal format.
   */
  const hashInSha256 = async (inputString) => {
    const encoder = new TextEncoder();
    const rawdata = encoder.encode(inputString);
    const hash = await crypto.subtle.digest('SHA-256', rawdata);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const hashPhNo = async (phoneNumber) => {
    const hashed = await hashInSha256(String(phoneNumber));
    return hashed;
  };

  /**
     * set analytics generic props for page load
     * @name setAnalyticPageLoadProps
     * @param {string} linkName - linkName
     * @param {string} linkType - linkName
     * @param {object} formContext - currentFormContext.
     * @param {object} digitalData
     */

  const setAnalyticPageLoadProps = (journeyState, formData, digitalData) => {
    digitalData.user.pseudoID = '';// Need to check
    digitalData.user.journeyName = formData?.journeyName || formData?.smartemi?.journeyName;
    digitalData.user.journeyID = formData?.journeyId || formData?.smartemi?.journeyId;
    digitalData.user.journeyState = journeyState;
    digitalData.user.casa = '';
    digitalData.user.aan = '';
    digitalData.form.name = 'SmartEMI';
    digitalData.form.emiCategory = '';
  };

  /**
     * set analytics generic props for click event
     * @name setAnalyticClickGenericProps
     * @param {string} linkName - linkName
     * @param {string} linkType - linkName
     * @param {object} formContext - currentFormContext.
     * @param {object} digitalData
     */

  const setAnalyticClickGenericProps = (linkName, linkType, formData, journeyState, digitalData) => {
    digitalData.link = {};
    digitalData.link.linkName = ANALYTICS_LINK_BTN[linkName].linkName;
    digitalData.link.linkType = ANALYTICS_LINK_BTN[linkName].linkType;
    digitalData.link.linkPosition = ANALYTICS_LINK_BTN[linkName].linkPosition;
    digitalData.user.pseudoID = '';
    digitalData.user.journeyName = CURRENT_FORM_CONTEXT?.journeyName || formData?.smartemi?.journeyName;
    digitalData.user.journeyID = CURRENT_FORM_CONTEXT?.journeyID || formData?.smartemi?.journeyId;
    digitalData.user.journeyState = journeyState;
    if (linkName === 'otp click') {
      digitalData.form.name = JOURNEY_NAME;
      digitalData.user.casa = '';
    }
  };

  /**
     * Sends analytics event on page load.
     * @name sendPageloadEvent
     * @param {string} journeyState.
     * @param {object} formData.
     * @param {string} pageName.
     */
  const sendPageloadEvent = (journeyState, formData, pageName) => {
    const digitalData = createDeepCopyFromBlueprint(ANALYTICS_PAGE_LOAD_OBJECT_SEMI);
    digitalData.page.pageInfo.pageName = pageName;
    setAnalyticPageLoadProps(journeyState, formData, digitalData);
    if (currentState.pageName === ANALYTICS_PAGE_NAME['transaction view']) {
      digitalData.formDetails = {};
      digitalData.formDetails.eligibleTransactions = ''; // eligible transaction on load of transaction page
      currentState.pageName = null;
    }
    if (currentState.pageName === ANALYTICS_PAGE_NAME['tenure page']) {
      /* default selected on load of this page */
      const selectedData = formData?.aem_tenureSelectionRepeatablePanel?.find((el) => el.aem_tenureSelection);
      digitalData.formDetails = {};
      digitalData.formDetails.installment = selectedData?.aem_tenureSelectionEmi ?? '';
      digitalData.formDetails.tenure = selectedData?.aem_tenure_display ?? '';
      digitalData.formDetails.roi = selectedData?.aem_roi_monthly ?? '';
      currentState.pageName = null;
    }
    if (currentState.pageName === ANALYTICS_PAGE_NAME['thank you']) {
      digitalData.formDetails = {};
      digitalData.formDetails.reference = formData?.smartemi?.originAcct ?? '';
      digitalData.formDetails.amtCreditedDealer = formData?.smartemi?.SmartEMIAmt ?? '';
      digitalData.user.casa = 'YES';
      digitalData.user.aan = formData?.smartemi?.originAcct;
      currentState.pageName = null;
    }
    if (!isNodeEnv$2) {
      window.digitalData = digitalData || {};
    }
    _satellite.track('pageload');
  };

  /**
     *Creates digital data for otp click event.
     * @param {string} validationType
     * @param {string} eventType
     * @param {object} formContext
     * @param {object} digitalData
     */
  const sendSubmitClickEvent = async (eventType, linkType, formData, journeyState, digitalData) => {
    setAnalyticClickGenericProps(eventType, linkType, formData, journeyState, digitalData);
    digitalData.page.pageInfo.pageName = ANALYTICS_PAGE_NAME[eventType];
    switch (eventType) {
      case 'otp click': {
        digitalData.event = {
          phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
          validationMethod: 'credit card',
          status: '1',
        };
        if (!isNodeEnv$2) {
          window.digitalData = digitalData || {};
        }
        _satellite.track('submit');
        setTimeout(() => {
          sendPageloadEvent(ANALYTICS_JOURNEY_STATE['otp click'], formData, ANALYTICS_PAGE_NAME['submit otp']);
        }, 1000);
        break;
      }

      case 'submit otp': {
        digitalData.event = {
          phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
          validationMethod: 'credit card',
          status: '1',
        };
        if (!isNodeEnv$2) {
          window.digitalData = digitalData || {};
        }
        _satellite.track('submit');
        setTimeout(() => {
          currentState.pageName = ANALYTICS_PAGE_NAME['transaction view'];
          sendPageloadEvent(ANALYTICS_JOURNEY_STATE['submit otp'], formData, ANALYTICS_PAGE_NAME['transaction view']);
        }, 1000);
        break;
      }

      case 'resend otp': {
        digitalData.event = {
          phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
          validationMethod: 'credit card',
          status: '1',
        };
        if (!isNodeEnv$2) {
          window.digitalData = digitalData || {};
        }
        _satellite.track('submit');
        break;
      }

      case 'transaction view': {
        digitalData.event.status = {
          phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
          validationMethod: 'credit card',
          status: '1',
        };
        digitalData.formDetails = {};
        digitalData.formDetails.amt = formData?.smartemi?.SmartEMIAmt || CURRENT_FORM_CONTEXT.SMART_EMI_AMOUNT; // total amount
        digitalData.formDetails.eligibleTransactions = ''; // eligible transaction ?. no of eligible transaction available
        digitalData.formDetails.selectedTransactions = CURRENT_FORM_CONTEXT?.TXN_SELECTED_COUNTS?.total; // no of selected
        if (!isNodeEnv$2) {
          window.digitalData = digitalData || {};
        }
        _satellite.track('submit');
        setTimeout(() => {
          currentState.pageName = ANALYTICS_PAGE_NAME['tenure page'];
          sendPageloadEvent(ANALYTICS_JOURNEY_STATE['transaction view'], formData, ANALYTICS_PAGE_NAME['tenure page']);
        }, 1000);
        break;
      }

      case 'tenure page': {
        digitalData.event = {
          phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
          validationMethod: 'credit card',
          status: '1',
        };
        const selectedData = formData?.aem_tenureSelectionRepeatablePanel?.find((el) => el.aem_tenureSelection);
        digitalData.formDetails = {};
        digitalData.formDetails.installment = selectedData?.aem_tenureSelectionEmi ?? '';
        digitalData.formDetails.tenure = selectedData?.aem_tenure_display ?? '';
        digitalData.formDetails.roi = selectedData?.aem_roi_monthly ?? '';
        digitalData.formDetails.amt = formData?.smartemi?.SmartEMIAmt || CURRENT_FORM_CONTEXT.SMART_EMI_AMOUNT; // total amount
        digitalData.assisted = {};
        digitalData.assisted.flag = formData?.aem_bankAssistedToggle;
        digitalData.assisted.lg = formData?.aem_lgCode ?? '';
        digitalData.assisted.lc = formData?.aem_lcCode ?? '';
        const EMI_CATEGORY = (formData?.smartemi?.TransactionType === 'Both') ? 'Billed / Unbilled ' : formData?.smartemi?.TransactionType;
        const ccBilledData = CURRENT_FORM_CONTEXT?.EligibilityResponse?.ccBilledTxnResponse?.responseString ? CURRENT_FORM_CONTEXT?.EligibilityResponse?.ccBilledTxnResponse?.responseString : [];
        const ccUnBilledData = CURRENT_FORM_CONTEXT?.EligibilityResponse?.ccUnBilledTxnResponse?.responseString ? CURRENT_FORM_CONTEXT?.EligibilityResponse?.ccUnBilledTxnResponse?.responseString : [];
        const errorMessages = {
          noBilled: 'No transactions available in billed category',
          noUnBilled: 'No transactions available in unbilled category',
          noTransactions: 'No transactions to convert',
        };
        if ((ccUnBilledData?.length === 0) && (ccBilledData?.length === 0)) {
          digitalData.page.pageInfo.errorMessage = errorMessages.noTransactions;
        } else if ((ccUnBilledData?.length === 0)) {
          digitalData.page.pageInfo.errorMessage = errorMessages.noUnBilled;
        } else if ((ccBilledData?.length === 0)) {
          digitalData.page.pageInfo.errorMessage = errorMessages.noBilled;
        }
        digitalData.form.emiCategory = EMI_CATEGORY;
        if (!isNodeEnv$2) {
          window.digitalData = digitalData || {};
        }
        const trackingEvent = ((ccUnBilledData?.length === 0) && (ccBilledData?.length === 0)) ? 'unbilled_clicked' : 'submit';
        _satellite.track(trackingEvent);
        setTimeout(() => {
          sendPageloadEvent(ANALYTICS_JOURNEY_STATE['tenure page'], formData, ANALYTICS_PAGE_NAME['confirm tenure']);
        }, 1000);
        break;
      }

      case 'confirm tenure': {
        digitalData.event = {
          phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
          validationMethod: 'credit card',
          status: '1',
        };
        if (!isNodeEnv$2) {
          window.digitalData = digitalData || {};
        }
        _satellite.track('submit');
        setTimeout(() => {
          currentState.pageName = ANALYTICS_PAGE_NAME['thank you'];
          sendPageloadEvent(ANALYTICS_JOURNEY_STATE['thank you'], formData, ANALYTICS_PAGE_NAME['thank you']);
        }, 7000);
        break;
      }

      case 'resendOtp confirmTenure': {
        digitalData.event = {
          phone: await hashPhNo(String(formData.smartemi.aem_mobileNum)), // sha-256 encrypted ?.
          validationMethod: 'credit card',
          status: '1',
        };
        if (!isNodeEnv$2) {
          window.digitalData = digitalData || {};
        }
        _satellite.track('submit');
        break;
      }
      case 'submit review': {
        digitalData.event = {};
        digitalData.event.rating = formData?.ratingvalue || formData.rating;
        if (!isNodeEnv$2) {
          window.digitalData = digitalData || {};
        }
        _satellite.track('submit');
        break;
      }
          // do nothing
    }
  };

  const populateResponse = (payload, eventType, digitalData) => {
    switch (eventType) {
      case 'otp click':
      case 'transaction view':
      case 'tenure page':
        if (payload === 'Record successfully updated!') {
          digitalData.page.pageInfo.errorCode = '0';
          digitalData.page.pageInfo.errorMessage = 'success';
        } else {
          digitalData.page.pageInfo.errorCode = payload?.errorCode ?? '';
          digitalData.page.pageInfo.errorMessage = payload?.errorMsg ?? '';
        }
        break;
      case 'confirm tenure':
      case 'resend otp':
      case 'resendOtp confirmTenure':
      case 'submit review':
      case 'submit otp': {
        digitalData.page.pageInfo.errorCode = payload?.errorCode ?? '';
        digitalData.page.pageInfo.errorMessage = payload?.errorMsg ?? '';
        break;
      }
        // do nothing
    }
  };

  /**
     * Send analytics events.
     * @param {string} eventType
     * @param {object} payload
     * @param {string} journeyState
     * @param {object} formData
     * @param {object} currentFormContext
     */
  const sendAnalyticsEvent = (eventType, payload, journeyState, formData) => {
    const digitalData = createDeepCopyFromBlueprint(ANALYTICS_OBJECT_SEMI);
    const attributes = ANALYTICS_LINK_BTN[eventType];
    populateResponse(payload, eventType, digitalData);
    sendSubmitClickEvent(eventType, attributes?.linkType, formData, journeyState, digitalData);
  };

  /**
    * sendErrorAnalytics
    * @param {string} errorCode
    * @param {string} errorMsg
    * @param {string} journeyState
    * @param {object} globals
    */
  function sendErrorAnalytics(errorCode, errorMsg, journeyState, globals) {
    const digitalData = createDeepCopyFromBlueprint(ANALYTICS_PAGE_LOAD_OBJECT_SEMI);
    setAnalyticPageLoadProps(journeyState, santizedFormDataWithContext(globals), digitalData);
    digitalData.page.pageInfo.errorCode = errorCode;
    digitalData.page.pageInfo.errorMessage = errorMsg;
    digitalData.page.pageInfo.errorAPI = ''; // "OTP_Validation|EligibilityCheck"
    digitalData.page.pageInfo.pageName = ANALYTICS_PAGE_NAME['Error Page'];
    if (!isNodeEnv$2) {
      window.digitalData = digitalData || {};
    }
    _satellite.track('pageload');
  }

  /**
    * sendAnalytics
    * @param {string} eventType
    * @param {string} payload
    * @param {string} journeyState
    * @param {object} globals
    */
  function sendAnalytics(eventType, payload, journeyState, globals) {
    const formData = santizedFormDataWithContext(globals);
    if (eventType.includes('page load')) {
      const pageName = ANALYTICS_PAGE_NAME['page load'];
      sendPageloadEvent(journeyState, formData, pageName);
    } else {
      sendAnalyticsEvent(eventType, payload, journeyState, formData);
    }
  }

  const {
    CURRENT_FORM_CONTEXT: currentFormContext,
    JOURNEY_NAME: journeyName,
    SEMI_ENDPOINTS: semiEndpoints,
    PRO_CODE,
    DOM_ELEMENT: domElements,
    MISC,
    DATA_LIMITS,
    CHANNELS,
    ERROR_MSG,
    FLOWS_ERROR_MESSAGES,
  } = SEMI_CONSTANT;

  const isNodeEnv$1 = typeof process !== 'undefined' && process.versions && process.versions.node;

  // Initialize all SEMI Journey Context Variables & formRuntime variables.
  currentFormContext.totalSelect = 0;
  currentFormContext.billed = 0;
  currentFormContext.unbilled = 0;
  currentFormContext.tadMinusMadValue = 0;
  currentFormContext.txnSelectExceedLimit = 1000000; // ten lakhs txn's select exceeding limit
  let tnxPopupAlertOnce = 0; // flag alert for the pop to show only once on click of continue
  let resendOtpCount = 0;
  let resendOtpCount2 = 0;
  const userPrevSelect = {};

  const onPageLoadAnalytics = async () => {
    const journeyData = {};
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-underscore-dangle, no-undef
      journeyData.journeyId = myForm.resolveQualifiedName('$form.runtime.journeyId')._data.$_value;
      journeyData.journeyName = journeyName;
      sendAnalytics(
        'page load',
        {},
        ANALYTICS_JOURNEY_STATE['page load'],
        journeyData,
      );
    }
  };

  setTimeout(() => {
    if (typeof window !== 'undefined') {
      onPageLoadAnalytics();
    }
  }, 5000);

  /**
   * For Web returing currentFormContext as defined in variable
   * Ideally every custom function should be pure function, i.e it should not have any side effect
   * As per current implementation `currentFormContext` is a state outside of the function,
   * so for Flow we have did special handling by storing strigified value in `globals.form.runtime.currentFormContext`
   *
   * @param {scope} globals
   * @returns
   */
  function getCurrentFormContext(globals) {
    if (isNodeEnv$1) {
      return JSON.parse(globals.form.runtime.currentFormContext.$value || '{}');
    }
    return currentFormContext;
  }

  /**
     * generates the journeyId
     * @param {string} visitMode - The visit mode (e.g., "online", "offline").
     * @param {string} journeyAbbreviation - The abbreviation for the journey.
     * @param {string} channel - The channel through which the journey is initiated.
     * @param {object} globals
     */
  function createJourneyId(visitMode, journeyAbbreviation, channelValue, globals) {
    const dynamicUUID = generateUUID();
    // var dispInstance = getDispatcherInstance();
    let channel = channelValue;
    journeyAbbreviation = 'SEMI';
    channel = 'WEB';
    if (isNodeEnv$1) {
      channel = 'WHATSAPP';
    }
    const journeyId = globals.functions.exportData().smartemi?.journeyId || `${dynamicUUID}_01_${journeyAbbreviation}_${visitMode}_${channel}`;
    globals.functions.setProperty(globals.form.runtime.journeyId, { value: journeyId });

    // Update the form context
    currentFormContext.journeyName = journeyName;
    currentFormContext.journeyID = journeyId;
    globals.functions.setProperty(globals.form.runtime.currentFormContext, { value: JSON.stringify({ ...currentFormContext }) });
  }

  /**
   * generates the otp
   * @param {string} mobileNumber
   * @param {string} cardDigits
   * @param {string} channel
   * @param {object} globals
   * @return {PROMISE}
   */
  function getOTPV1(mobileNumber, cardDigits, channel, globals) {
    if (!isNodeEnv$1) {
      /* restrict to show otp-resend option once it reaches max-attemt and to show otptimer */
      const { otpPanel } = globals.form.aem_semiWizard.aem_identifierPanel.aem_otpPanel;
      if (resendOtpCount < DATA_LIMITS.maxOtpResendLimit) {
        globals.functions.setProperty(otpPanel.secondsPanel, { visible: true });
        globals.functions.setProperty(otpPanel.aem_otpResend, { visible: false });
      } else {
        globals.functions.setProperty(otpPanel.secondsPanel, { visible: false });
      }
      displayLoader$1();
    }
    let path = semiEndpoints.otpGen;
    let jsonObj = {
      requestString: {
        mobileNo: mobileNumber,
        cardNo: cardDigits,
        journeyID: globals.form.runtime.journeyId.$value || currentFormContext.journeyID,
        journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
      },
    };
    if (channel === CHANNELS.adobeWhatsApp) {
      path = semiEndpoints.otpVal;
      jsonObj = {
        requestString: {
          mobileNo: mobileNumber,
          cardNo: cardDigits,
          proCode: PRO_CODE,
          journeyID: globals.form.runtime.journeyId.$value,
          journeyName: globals.form.runtime.journeyName.$value,
          channel: CHANNELS.adobeWhatsApp,
        },
      };
    }
    // eslint-disable-next-line no-unneeded-ternary
    return fetchJsonResponse(path, jsonObj, 'POST', isNodeEnv$1 ? false : true);
  }

  /**
   * generates the otp
   * @param {string} mobileNumber
   * @param {string} cardDigits
   * @param {object} globals
   * @return {PROMISE}
   */
  function otpValV1(mobileNumber, cardDigits, otpNumber, globals) {
    const jsonObj = {
      requestString: {
        mobileNo: mobileNumber,
        cardNo: cardDigits,
        OTP: otpNumber,
        proCode: PRO_CODE,
        journeyID: globals.form.runtime.journeyId.$value || currentFormContext.journeyID,
        journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
      },
    };
    const path = semiEndpoints.otpVal;
    if (isNodeEnv$1) {
      jsonObj.requestString.channel = CHANNELS.adobeWhatsApp;
      delete jsonObj.requestString.OTP;
    }
    if (!isNodeEnv$1) displayLoader$1();
    return fetchJsonResponse(path, jsonObj, 'POST', true);
  }

  /**
   * @name handleWrongCCDetailsFlows
   * @param {object} ccNumber
   * @param {object} wrongNumberCount
   * @param {string} errorMessage
   * @param {scope} globals
   */
  function handleWrongCCDetailsFlows(ccNumber, wrongNumberCount, errorMessage, globals) {
    // wrong CC number retry is handled in the flow only
    if (!isNodeEnv$1) return;
    const count = wrongNumberCount.$value;
    if (count < 2) {
      globals.functions.markFieldAsInvalid(ccNumber.$qualifiedName, errorMessage, { useQualifiedName: true });
      globals.functions.setProperty(wrongNumberCount, { value: count + 1 });
    }
  }

  /**
   * pre  execute loan fullfilment process, generated final otp for loan booking
   * @param {string} mobileNumber
   * @param {string} cardDigits
   * @param {object} globals
   * @return {PROMISE}
   */
  function preExecution(mobileNumber, cardDigits, globals) {
    /* restrict to show otp-resend option once it reaches max-attemt and to show otptimer */
    const otpPanel = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
    if (resendOtpCount2 < DATA_LIMITS.maxOtpResendLimit) {
      globals.functions.setProperty(otpPanel.secondsPanel, { visible: true });
      globals.functions.setProperty(otpPanel.aem_otpResend2, { visible: false });
    } else {
      globals.functions.setProperty(otpPanel.secondsPanel, { visible: false });
    }
    const formContext = getCurrentFormContext(globals);
    const jsonObj = {
      requestString: {
        mobileNo: mobileNumber,
        cardNo: cardDigits,
        encryptedToken: formContext.EligibilityResponse.responseString.records[0].encryptedToken,
        journeyID: globals.form.runtime.journeyId.$value,
        journeyName: globals.form.runtime.journeyName.$value,
      },
    };
    const path = semiEndpoints.preexecution;
    if (!isNodeEnv$1) displayLoader$1();
    return fetchJsonResponse(path, jsonObj, 'POST', !isNodeEnv$1);
  }
  const nfObject = new Intl.NumberFormat('hi-IN');

  /**
   * Formats a transaction amount into the Indian Rupee (INR) format with two decimal places.
   * If the transaction amount starts with '0', it is considered an unbilled amount and is divided by 100
   * before formatting.
   * @param {number|string} txnAmt - The transaction amount to be formatted. It can be a number or a string.
   * @returns {string} The formatted transaction amount in INR currency format with two decimal places.
   */
  const txnInrFormat = (txnAmt) => {
    const amt = String(txnAmt).trim();
    const isUnBilledAmt = amt.startsWith('0');

    const nfInrObj = new Intl.NumberFormat('hi-IN', {
      minimumFractionDigits: 2, // Minimum number of digits after the decimal
      maximumFractionDigits: 2, // Maximum number of digits after the decimal
    });

    const formattedAmt = isUnBilledAmt
      ? nfInrObj.format(parseFloat(amt) / 100)
      : nfInrObj.format(parseFloat(amt));

    return formattedAmt;
  };

  /**
   * sets the data for the instance of repetable panel
   *
   * @param {object} globals - gobal form object
   * @param {Object} panel - The panel for unbilled transactions.
   * @param {Object} txn - current tramsaction object
   * @param {number} i - current instance of panel row
   */
  const setData = (globals, panel, txn, i) => {
    let enabled = true;
    if (currentFormContext.totalSelect === 10 && txn?.aem_Txn_checkBox !== 'on') enabled = false;
    globals.functions.setProperty(panel[i]?.aem_Txn_checkBox, { value: txn?.checkbox || txn?.aem_Txn_checkBox });
    globals.functions.setProperty(panel[i]?.aem_Txn_checkBox, { enabled });// set the checbox value
    const paiseAppendAmt = txnInrFormat((txn?.amount || txn?.aem_TxnAmt));
    const TXN_AMT = `${MISC.rupeesUnicode} ${paiseAppendAmt}`;
    globals.functions.setProperty(panel[i]?.aem_TxnAmt, { value: TXN_AMT });
    globals.functions.setProperty(panel[i]?.aem_TxnDate, { value: txn?.date || txn?.aem_TxnDate });
    globals.functions.setProperty(panel[i]?.aem_TxnID, { value: txn?.id || txn?.aem_TxnID });
    globals.functions.setProperty(panel[i]?.aem_TxnName, { value: txn?.name || txn?.aem_TxnName });
    globals.functions.setProperty(panel[i]?.authCode, { value: txn?.AUTH_CODE || txn?.authCode || txn?.authcode });
    globals.functions.setProperty(panel[i]?.logicMod, { value: txn?.LOGICMOD || txn?.logicMod });
    globals.functions.setProperty(panel[i]?.aem_txn_type, { value: txn?.type });
  };
  /*
   * Displays card details by updating the UI with response data.
   * @param {object} globals - global object
   * @param {object} response - response from the checkEligibilty
   */
  const cardDisplay = (globals, response) => {
    const creditCardDisplay = globals.form.aem_semicreditCardDisplay;
    const nCardNumber = 4;
    const cardNumberLength = Number.isNaN(response?.blockCode.cardNumber.length) ? 0 : response.blockCode.cardNumber.length;
    const lastNDigits = globals.form.aem_semiWizard.aem_identifierPanel.aem_loginPanel.aem_cardNo.$value;
    const cardDigits = `${'X'.repeat(nCardNumber)}-`.repeat(Math.round(cardNumberLength / nCardNumber) - 1) + lastNDigits;
    globals.functions.setProperty(creditCardDisplay, { visible: true });
    globals.functions.setProperty(creditCardDisplay.aem_semicreditCardContent.aem_customerNameLabel, { value: `Dear ${response?.cardHolderName}` });
    globals.functions.setProperty(creditCardDisplay.cardFaciaCardName, { value: `${response?.address.name}` });
    globals.functions.setProperty(creditCardDisplay.cardFaciaCardNo, { value: `${cardDigits}` });
    // eslint-disable-next-line radix
    const totalAmt = nfObject.format(parseInt(response.responseString.creditLimit) - Math.round(parseInt(response?.blockCode?.bbvlogn_card_outst) / 100));
    const TOTAL_OUTSTANDING_AMT = `${MISC.rupeesUnicode} ${totalAmt}`;
    currentFormContext.totalOutstandingAmount = TOTAL_OUTSTANDING_AMT;
    globals.functions.setProperty(creditCardDisplay.aem_semicreditCardContent.aem_outStandingAmt, { value: TOTAL_OUTSTANDING_AMT });
    globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_cardfacia, { value: urlPath$1(response.cardTypePath) });
    const imageEl = document.querySelector('.field-aem-cardfacia > picture');
    const imagePath = `${urlPath$1(response.cardTypePath)}?width=2000&optimize=medium`;
    imageEl?.childNodes[5].setAttribute('src', imagePath);
    imageEl?.childNodes[3].setAttribute('srcset', imagePath);
    imageEl?.childNodes[1].setAttribute('srcset', imagePath);
  };

  const DELAY = 0;
  const DELTA_DELAY = 120;

  /**
   * sets the data for the instance of repetable panel
   *
   * @param {object} globals - gobal form object
   * @param {Object} panel - The panel for unbilled transactions.
   * @param {Object} txn - current tramsaction object
   * @param {number} i - current instance of panel row
   */
  const getTranactionPanelData = (transactions) => {
    const txnsData = transactions?.map((txn) => {
      const paiseAppendAmt = txnInrFormat((txn?.amount || txn?.aem_TxnAmt));
      const TXN_AMT = `${MISC.rupeesUnicode} ${paiseAppendAmt}`;
      return {
        aem_Txn_checkBox: txn?.checkbox || txn?.aem_Txn_checkBox,
        aem_TxnAmt: TXN_AMT,
        aem_TxnDate: txn?.date || txn?.aem_TxnDate,
        aem_TxnID: txn?.id || txn?.aem_TxnID,
        aem_TxnName: txn?.name || txn?.aem_TxnName,
        authCode: txn?.AUTH_CODE || txn?.authCode,
        logicMod: txn?.LOGICMOD || txn?.logicMod,
        aem_txn_type: txn?.type,
      };
    });
    return txnsData;
  };

  // Special handling for whatsapp flow, can be removed once proper fix is done
  function addTransactions(allTxn, globals) {
    const transactions = allTxn || [];
    const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const data = getTranactionPanelData(transactions);
    globals.functions.importData(data, billedTxnPanel.$qualifiedName);
  }

  /**
   * Combines transaction data and updates the appropriate panels.
   *
   * @param {Array} allTxn - Array of all transactions.
   * @param {number} [btxn] - Number of billed transactions.
   * @param {Object} billedTxnPanel - The panel for billed transactions.
   * @param {Object} [unBilledTxnPanel] - The panel for unbilled transactions.
   * @param {Object} globals - Global variables and functions.
   */
  const setTxnPanelData = async (allTxn, btxn, uBtxn, billedTxnPanel, unBilledTxnPanel, globals) => {
    if (!allTxn?.length) return;
    if (!isNodeEnv$1) {
      allTxn.forEach((_txn, i) => {
        const isBilled = i < btxn;
        let panel = billedTxnPanel;
        if (btxn !== undefined && unBilledTxnPanel !== undefined) {
          // Case where we have both billed and unbilled transactions
          panel = isBilled ? billedTxnPanel : unBilledTxnPanel;
        }
        const delay = DELAY + (DELTA_DELAY * i);
        const panelIndex = isBilled ? i : i - btxn;
        setTimeout(() => {
          if (isBilled && (btxn - 1 >= billedTxnPanel.length)) {
            /* condition to skip the default txn list data */
            globals.functions.dispatchEvent(panel, 'addItem');
          }
          if (!isBilled && (uBtxn - 1) >= unBilledTxnPanel.length) {
            /* condition to skip the default txn list data */
            globals.functions.dispatchEvent(panel, 'addItem');
          }
          const txnData = {
            ..._txn,
            type: isBilled ? 'BILLED' : 'UNBILLED',
          };
          setData(globals, panel, txnData, panelIndex);
        }, delay);
      });
    } else {
      // special handling for whatsapp flow
      addTransactions(allTxn, globals);
    }
  };

  /**
   * @name customDispatchEvent - to dispatch custom event on form
   * @param {string} eventName - event name
   * @param {object} payload - payload to dispatch
   * @param {scope} globals - globals
   */
  function customDispatchEvent(eventName, payload, globals) {
    let evtPayload = payload;
    if (isNodeEnv$1 && payload?.errorCode) {
      if (FLOWS_ERROR_MESSAGES[payload.errorCode]) {
        evtPayload = { ...evtPayload, errorMsg: FLOWS_ERROR_MESSAGES[payload.errorCode] };
      }
    }
    globals.functions.dispatchEvent(globals.form, `custom:${eventName}`, evtPayload);
  }

  const handleResendOtp2VisibilityInFlow = (countOfResendOtp, globals) => {
    if (!isNodeEnv$1) return;
    const otpPanel = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
    if (countOfResendOtp >= DATA_LIMITS.maxOtpResendLimit) {
      const properties = otpPanel.aem_otpResend2.$properties;
      globals.functions.setProperty(otpPanel.aem_otpResend2, { properties: { ...properties, 'flow:setVisible': false } });
    }
  };

  /**
   * calls function to add styling to completed steppers
   *
   * @function changeWizardView
   * @returns {void}
   */
  const changeWizardView = () => {
    if (isNodeEnv$1) return;
    const completedStep = document.querySelector('.field-aem-semiwizard .wizard-menu-items .wizard-menu-active-item');
    completedStep.classList.add('wizard-completed-item');
  };

  /**
   * Modifies the response payload based on the difference between 'tad' and 'mad' values.
   *
   * If the difference between 'tad' and 'mad' is zero, the original response is returned.
   * Otherwise, it returns a modified response with an empty `ccBilledTxnResponse.responseString`.
   * @param {Object} res - The original response payload containing `blockCode`, `tad`, and `mad`.
   * @returns {Object} The modified response payload, or the original if no change is necessary.
   */
  const modifyResponseByTadMad = (res) => {
    if (!(res?.blockCode?.tad && res?.blockCode?.mad)) return null;
    const tadMinusValue = ((parseFloat(res?.blockCode?.tad) / 100) - (parseFloat(res?.blockCode?.mad) / 100));
    const mappedResPayload = structuredClone(res);
    if (isNodeEnv$1) {
      mappedResPayload.ccBilledTxnResponse = mappedResPayload.ccBilledTxnResponse?.filter((el) => el.type !== 'billed');
    } else {
      mappedResPayload.ccBilledTxnResponse.responseString = [];
    }
    const resPayload = (!(tadMinusValue === 0)) ? res : mappedResPayload;
    return resPayload;
  };

  /**
  * @param {resPayload} Object - checkEligibility response.
  * @param {object} globals - global object
  * @return {PROMISE}
  */
  // eslint-disable-next-line no-unused-vars
  function checkELigibilityHandler(resPayload1, globals) {
    // const resPayload = RESPONSE_PAYLOAD.response;
    const resPayload = modifyResponseByTadMad(resPayload1);
    const response = {};
    const formContext = getCurrentFormContext(globals);
    try {
      /* billed txn maximum amount select limt */
      formContext.tadMinusMadValue = ((parseFloat(resPayload.blockCode.tad) / 100) - (parseFloat(resPayload.blockCode.mad) / 100));
      /* continue btn disabling code added temorary, can be removed after form authoring */
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
      let ccBilledData = resPayload?.ccBilledTxnResponse?.responseString ? resPayload?.ccBilledTxnResponse?.responseString : [];
      let ccUnBilledData = resPayload?.ccUnBilledTxnResponse?.responseString ? resPayload?.ccUnBilledTxnResponse?.responseString : [];
      if (isNodeEnv$1) {
        ccBilledData = resPayload?.ccBilledTxnResponse || [];
        if (ccBilledData.length === 0) {
          customDispatchEvent('showErrorSnackbar', { errorMessage: ERROR_MSG.noEligibleTxnFlow }, globals);
          response.nextscreen = 'failure';
          return response;
        }
      } else {
        // Note: In whatsapp data is already sorted, format of billed and unbilled is different (rupee vs paisa) so sorting should not be done for WA.
        // apply sort by amount here to ccBilledData
        ccBilledData = sortDataByAmount(ccBilledData, 'amount');
        // apply sort by amount here to ccBilledData
        ccUnBilledData = sortDataByAmount(ccUnBilledData, 'amount');
      }
      formContext.EligibilityResponse = resPayload;
      globals.functions.setProperty(globals.form.runtime.currentFormContext, { value: JSON.stringify({ ...formContext }) });
      const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
      const unBilledTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
      const allTxn = ccBilledData.concat(ccUnBilledData);
      setTxnPanelData(allTxn, ccBilledData.length, ccUnBilledData.length, billedTxnPanel, unBilledTxnPanel, globals);
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_eligibleTxnLabel, { value: `Eligible Transactions (${allTxn?.length})` });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_TxnAvailable, { value: `Billed Transaction (${ccBilledData?.length})` });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_TxnAvailable, { value: `Unbilled Transaction (${ccUnBilledData?.length})` });
      // set runtime values
      globals.functions.setProperty(globals.form.runtime.originAcct, { value: formContext.EligibilityResponse.responseString.aanNumber });
      changeWizardView();
      // Display card and move wizard view
      if (!isNodeEnv$1) {
        cardDisplay(globals, resPayload);
        moveWizardView(domElements.semiWizard, domElements.chooseTransaction);
      }
      response.nextscreen = 'success';
      /* to display available count to select */
      currentFormContext.MAX_SELECT = (allTxn?.length >= DATA_LIMITS.totalSelectLimit) ? DATA_LIMITS.totalSelectLimit : allTxn?.length;
      const TOTAL_SELECT = `Total selected ${formContext.totalSelect}/${currentFormContext.MAX_SELECT}`;
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });// total no of select billed or unbilled txn list
      //
      // show txn summery text value
      if ((ccUnBilledData.length) || (ccUnBilledData.length)) {
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnsSummaryText, { visible: true });
      }
      // hide the unbilled / unbillled accordian if the response payload of txn is not present
      if (ccBilledData.length === 0) {
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment, { visible: false });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList, { visible: false });
      }
      if (ccUnBilledData?.length === 0) {
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment, { visible: false });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList, { visible: false });
      }
      return response;
    } catch (error) {
      response.nextscreen = 'failure';
      return response;
    }
  }

  const getLoanOptionsInfo = (responseStringJsonObj) => {
    // Loop through the periods, interests, and tids
    const keyPosInResponse = [1, 2, 3, 4, 5];
    const loanoptions = keyPosInResponse.map((el) => {
      const periodKey = `period${el === 1 ? '' : el}`;
      const interestKey = `interest${el === 1 ? '' : el}`;
      const tidKey = `tid${el === 1 ? '' : el}`;
      if (responseStringJsonObj[0][periodKey] !== undefined);
      return {
        period: responseStringJsonObj[0][periodKey],
        interest: responseStringJsonObj[0][interestKey],
        tid: responseStringJsonObj[0][tidKey],
        processingFee: responseStringJsonObj[0].memoLine1,
      };
    });
    return loanoptions;
  };

  /**
   * Sets the data for a specific tenure panel option
   * @param {object} globals - globals form object
   * @param {Array} panel - The array of tenure selection panels.
   * @param {object} option - option object containing details of emi, processing fee, roi
   * @param {number} i -The index of the current tenure
   */
  const setDataTenurePanel = (globals, panel, option, i) => {
    globals.functions.setProperty(panel[i].aem_tenureSelection, { enumNames: [option?.period] });
    globals.functions.setProperty(panel[i].aem_tenure_display, { value: option?.period }); // - > temporray fix
    // globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.test, { enum: [0], enumNames: ['test'] });
    // globals.functions.setProperty(panel[i].aem_tenureSelection, { enum: [0], enumNames: [option?.period] });
    /* */
    // const monthlyEmi = `${MISC.rupeesUnicode} ${Number(clearString(option?.monthlyEMI))}`;
    // const processingFees = `${MISC.rupeesUnicode} ${option?.procesingFee}`;
    const monthEmiNumVal = Number(clearString(option?.monthlyEMI));
    const emiAmt = `${MISC.rupeesUnicode} ${nfObject.format(monthEmiNumVal)}`;
    const procesFees = `${MISC.rupeesUnicode} ${nfObject.format(option?.procesingFee)}`;
    globals.functions.setProperty(panel[i].aem_tenureSelectionEmi, { value: emiAmt });
    globals.functions.setProperty(panel[i].aem_tenureSelectionProcessing, { value: procesFees });
    globals.functions.setProperty(panel[i].aem_roi_monthly, { value: option?.roiMonthly });
    globals.functions.setProperty(panel[i].aem_roi_annually, { value: option?.roiAnnually });
    /* emi substance incldes tid, period, interest without parsed which required for ccSmart emi payload */
    const emiSubstance = JSON.stringify(option?.emiSubStance);
    globals.functions.setProperty(panel[i].aem_tenureRawData, { value: emiSubstance });
  };

  const tenureOption = (loanOptions, loanAmt) => {
    const arrayOptions = loanOptions?.map((option) => {
      const roiMonthly = ((parseInt(option.interest, 10) / 100) / 12).toFixed(2);
      const roiAnnually = currencyUtil(parseFloat(option?.interest), 2);
      const monthlyEMI = nfObject.format(calculateEMI(loanAmt, roiMonthly, parseInt(option.period, 10)));
      const period = `${parseInt(option.period, 10)} Months`;
      const procesingFee = nfObject.format(option.processingFee);
      const emiSubStance = option;
      return ({
        ...option,
        procesingFee,
        period,
        monthlyEMI,
        roiAnnually,
        roiMonthly,
        emiSubStance,
      });
    });
    return arrayOptions;
  };

  const getTotalAmount = (globals) => {
    const semiFormData = globals.functions.exportData().smartemi;
    const selectedTxnList = (semiFormData?.aem_billedTxn?.aem_billedTxnSelection?.concat(semiFormData?.aem_unbilledTxn?.aem_unbilledTxnSection))?.filter((txn) => txn.aem_Txn_checkBox === 'on');
    const totalAmountOfTxn = selectedTxnList?.reduce((prev, acc) => prev + parseFloat(acc.aem_TxnAmt.replace(/[^\d.-]/g, '')), 0);
    currentFormContext.SMART_EMI_AMOUNT = totalAmountOfTxn;
    return totalAmountOfTxn;
  };

  /**
   * Setting essential hidden fields for reports
   * @param {Array} selectedTxnList
   * @param {string} dispAmt
   * @param {Object} globals
   */
  const setReporthiddenFields = (selectedTxnList, dispAmt, globals) => {
    let combinedTransactionType = '';
    let hiddenBilledAmt = 0;
    let hiddenUnbilledAmt = 0;
    const allTxnTypes = selectedTxnList.map((el) => ({
      amt: Number(String(el.aem_TxnAmt).replace(/[^\d]/g, '') / 100),
      typ: el.aem_txn_type,
    })) || [];
    const mapTypes = allTxnTypes?.map((el) => el.typ);
    const mapAmt = allTxnTypes?.map((el) => el.amt);
    if (mapTypes.every((el) => el === 'BILLED')) {
      combinedTransactionType = 'Billed';
      hiddenBilledAmt = Number(mapAmt?.reduce((prev, acc) => prev + acc, 0));
    } else if (mapTypes.every((el) => el === 'UNBILLED')) {
      combinedTransactionType = 'Unbilled';
      hiddenUnbilledAmt = Number(mapAmt?.reduce((prev, acc) => prev + acc, 0));
    } else if (mapTypes.includes('BILLED') && mapTypes.includes('UNBILLED')) {
      combinedTransactionType = 'Both';
      hiddenBilledAmt = Number(allTxnTypes?.map((el) => (el.typ === 'BILLED') && el.amt)?.reduce((prev, acc) => prev + acc, 0));
      hiddenUnbilledAmt = Number(allTxnTypes?.map((el) => (el.typ === 'UNBILLED') && el.amt)?.reduce((prev, acc) => prev + acc, 0));
    } else {
      combinedTransactionType = 'none';
    }
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.combinedTransactionType, { value: combinedTransactionType });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.hiddenUnBilledTotal, { value: hiddenUnbilledAmt });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.hiddenBilledTotal, { value: hiddenBilledAmt });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_success.smartEMIAmountHidden, { value: Number(String(dispAmt)?.replace(/[^\d]/g, '')) });
  };

  /**
   * Updates the UI to display the selected transaction amount for SmartEMI and pre-selects the last tenure option.
   * @param {object} globals - global form object
   */
  const tenureDisplay = (globals) => {
    const tenureRepatablePanel = globals.form.aem_semiWizard.aem_selectTenure.aem_tenureSelectionMainPnl.aem_tenureSelectionRepeatablePanel;
    const semiFormData = globals.functions.exportData().smartemi;
    const selectedTxnList = (semiFormData?.aem_billedTxn?.aem_billedTxnSelection?.concat(semiFormData?.aem_unbilledTxn?.aem_unbilledTxnSection))?.filter((txn) => txn.aem_Txn_checkBox === 'on');
    const totalAmountOfTxn = selectedTxnList?.reduce((prev, acc) => prev + parseFloat((String(acc.aem_TxnAmt)).replace(/[^\d.-]/g, '')), 0);
    const totalAmountSelected = (parseInt(totalAmountOfTxn, 10));
    // Reading context value from hidden field
    // eslint-disable-next-line no-underscore-dangle
    const _context = getCurrentFormContext(globals);
    const loanArrayOption = getLoanOptionsInfo(_context.EligibilityResponse?.responseString?.records);
    const tenureArrayOption = tenureOption(loanArrayOption, totalAmountSelected);
    const LABEL_AMT_SELCTED = 'Amount selected for SmartEMI';
    const DISPLAY_TOTAL_AMT = `${MISC.rupeesUnicode} ${nfObject.format(totalAmountSelected)}`;
    const TOTAL_AMT_IN_WORDS = `${numberToText(totalAmountOfTxn)}`;
    /* set the total amount in hidden field - thank u scrren */
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_success.aem_hiddenTotalAmt, { value: DISPLAY_TOTAL_AMT });
    /* hidden fields to set for reports */
    /* display amount */
    if (!isNodeEnv$1) {
      globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_customerNameLabel, { value: LABEL_AMT_SELCTED });
      globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_outStandingLabel, { value: DISPLAY_TOTAL_AMT });
      globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_outStandingAmt, { value: `${MISC.rupeesUnicode} ${TOTAL_AMT_IN_WORDS}` });
    }
    /* set hidden field values for report */
    setReporthiddenFields(selectedTxnList, DISPLAY_TOTAL_AMT, globals);
    /* pre-select the last tenure option (radio btn) by default */
    const DEFUALT_SELCT_TENURE = (tenureRepatablePanel.length > 0) ? (tenureRepatablePanel.length - 1) : 0;
    globals.functions.setProperty(tenureRepatablePanel[DEFUALT_SELCT_TENURE].aem_tenureSelection, { value: '0' });
    /* discount */
    // const discount = globals.form.aem_semiWizard.aem_selectTenure.discount.$value; ///
    // const calcDiscount = ((Number().toFixed(2)) - (Number(discount) / 100));
    // const roi = parseFloat(globals.form.aem_semiWizard.aem_selectTenure.aem_ROI.$value) + calcDiscount;
    // const roiPercentage = `${roi.toFixed(2)}%`;
    // globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_ROI, { value: roiPercentage });
    /* set data for tenure panel */
    tenureArrayOption?.forEach((option, i) => {
      setDataTenurePanel(globals, tenureRepatablePanel, option, i);
    });

    // setting data to display on whatsapp flow
    const procesFees = tenureArrayOption[0]?.procesingFee;
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_flow_processingFees, { value: `${MISC.rupeesUnicode} ${nfObject.format(procesFees)}` });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_flowDisplayTotalAmountSelected, { value: `Rs ${nfObject.format(totalAmountSelected)}/-` });
  };

  /**
   * Continue button on choose transactions.
   *
   * @param {Object} globals - Global variables and functions.
   */
  function selectTenure(globals) {
    if (currentFormContext.totalSelect < DATA_LIMITS.totalSelectLimit) {
      tnxPopupAlertOnce += 1;
    }
    if (!isNodeEnv$1 && (tnxPopupAlertOnce === 1) && (currentFormContext.MAX_SELECT >= DATA_LIMITS.totalSelectLimit)) { // option of selecting ten txn alert should be occured only once.
      const MSG = 'Great news! You can enjoy the flexibility of converting up to 10 transactions into EMI.';
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: MSG });
    } else {
      if (!isNodeEnv$1) {
        moveWizardView(domElements.semiWizard, domElements.selectTenure);
        handleMdmUtmParam(globals);
      }
      tenureDisplay(globals);
    }
  }
  let selectTopTenFlag = false;
  let isUserSelection = false;
  /**
   * function sorts the billed / Unbilled Txn  array in based on the orderBy field
   * @param {string} txnType  - BILLED /  UNBILLED
   * @param {string} orderBy - orderby amount or date
   */
  function sortData(txnType, orderBy, globals) {
    isUserSelection = !isUserSelection;
    if (!txnType) return;
    // orderBy - 0 - amount ; 1 - date
    const BILLED_FRAG = 'billedTxnFragment';
    const UNBILLED_FRAG = 'unbilledTxnFragment';
    const TXN_FRAG = txnType === 'BILLED' ? BILLED_FRAG : UNBILLED_FRAG;
    const pannel = globals.form.aem_semiWizard.aem_chooseTransactions?.[`${TXN_FRAG}`].aem_chooseTransactions.aem_TxnsList;
    const billed = globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection;
    const unBilled = globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection;
    const dataTxnList = txnType === 'BILLED' ? billed : unBilled;
    const sortedData = (orderBy === '0') ? sortDataByAmountSymbol(dataTxnList) : sortByDate(dataTxnList);
    const mapSortedDat = sortedData?.map((item) => ({
      ...item,
      aem_TxnAmt: (currencyStrToNum(item?.aem_TxnAmt)),
    }));
    if (currentFormContext.MAX_SELECT === DATA_LIMITS.totalSelectLimit) {
      userPrevSelect.selectedTenMaxTxn = true;
    }
    try {
      mapSortedDat?.forEach((_data, i) => {
        const data = {
          ..._data,
          type: txnType,
        };
        const delay = DELAY + (DELTA_DELAY * i);
        setTimeout(() => {
          setData(globals, pannel, data, i);
        }, delay);
      });
      userPrevSelect.prevTxnType = 'SORT_BY';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error, 'sortEr');
    }
    setTimeout(() => {
      isUserSelection = !isUserSelection;
    }, 1000);
    setTimeout(() => {
      userPrevSelect.selectedTenMaxTxn = false;
    }, 3000);
  }

  /**
   * disable the unselected fields of transaction from billed or unbilled.
   * @param {Array} txnList - array of repeatable pannel
   * @param {boolean} allCheckBoxes - array of repeatable pannel
   * @param {object} globals - global object
   */
  const disableCheckBoxes = (txnList, allCheckBoxes, globals) => {
    txnList?.forEach((item) => {
      if (item.aem_Txn_checkBox.$value === 'on' && !allCheckBoxes) {
        globals.functions.setProperty(item.aem_Txn_checkBox, { enabled: true });
      } else {
        globals.functions.setProperty(item.aem_Txn_checkBox, { value: undefined });
        globals.functions.setProperty(item.aem_Txn_checkBox, { enabled: false });
      }
    });
  };

  /**
   * enable all fields of transaction from billed or unbilled.
   * @param {Array} txnList - array of repeatable pannel
   * @param {object} globals - global object
   */
  const enableAllTxnFields = (txnList, globals) => txnList?.forEach((list) => globals.functions.setProperty(list.aem_Txn_checkBox, { enabled: true }));
  /**
   * disable all fields of transaction from billed or unbilled.
   * @param {Array} txnList - array of repeatable pannel
   * @param {object} globals - global object
   */
  const disableAllTxnFields = (txnList, globals) => txnList?.forEach((list) => globals.functions.setProperty(list.aem_Txn_checkBox, { enabled: (list.aem_Txn_checkBox.$value === 'on') }));

  /**
   * function will be triggered on click of ok button of tag/mad alert
   * Unselect the previous checkbox value if it reaches the tad/ mad calculation.
   * @param {object} globals - global form object.
   */
  const handleTadMadAlert = (globals) => {
    const prevSelectedRowData = userPrevSelect.txnRowData;
    if (userPrevSelect.prevTxnType === 'SELECT_TOP') {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: false });
      const billedList = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
      const mapBiledList = billedList?.map((el) => ({ checkVal: el.aem_Txn_checkBox.$value, amtVal: (Number(String(el.aem_TxnAmt.$value).replace(/[^\d]/g, '')) / 100), id: el.aem_TxnID.$value }));
      let billedTotal = currentFormContext.sumOfbilledTxnOnly;

      /* track selected index calculate break point for tad-mad */
      let breakReducer = null;
      const mapBiledSelected = mapBiledList?.filter((el) => el.checkVal);
      const trackLastIndex = mapBiledSelected?.reduceRight((acc, curr, i) => {
        billedTotal -= curr.amtVal;
        if (billedTotal < currentFormContext.tadMinusMadValue) {
          if (!breakReducer) {
            breakReducer = i;
            if (breakReducer) {
              acc.push(i);
            }
          }
        } else {
          acc.push(i);
        }
        return acc;
      }, []);

      /* unselect each billed values based on tracklastIndex */
      trackLastIndex?.forEach(async (selectedIndex) => globals.functions.setProperty(billedList[selectedIndex].aem_Txn_checkBox, { value: undefined }));

      /* Select Top Ten Handling - After unchecking the billed items based on the TAD-MAD value, if the user has selected 'Top Ten',
       the 'Select Top Ten' functionality should apply to the remaining available unbilled transaction list */
      const prevSelectedBilled = mapBiledSelected;
      const billedSelected = prevSelectedBilled.length - trackLastIndex.length;
      const availableToSelectInUnbilled = userPrevSelect.txnAvailableToSelectInTopTen - billedSelected;
      if (availableToSelectInUnbilled) {
        const unbilledSortByAmt = sortDataByAmount(globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection);
        const unbilledAvailableToselect = unbilledSortByAmt?.slice(0, availableToSelectInUnbilled);
        const unbilledPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
        const billedPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
        try {
          unbilledAvailableToselect?.forEach((item) => {
            const foundMatch = unbilledPanel.find((el) => (el.aem_TxnAmt.$value === item.aem_TxnAmt) && ((el.aem_TxnDate.$value === item.aem_TxnDate) && (el.aem_TxnName.$value === item.aem_TxnName) && (el.logicMod.$value === item.logicMod) && (el.aem_TxnID.$value === item.aem_TxnID)));
            globals.functions.setProperty(foundMatch.aem_Txn_checkBox, { value: 'on', enabled: true });
          });
          if ((availableToSelectInUnbilled + billedSelected) === DATA_LIMITS.totalSelectLimit) { // selected top ten
            userPrevSelect.tadMadReachedTopTen = true;
            setTimeout(() => {
              disableCheckBoxes(billedPanel, false, globals);
              disableCheckBoxes(unbilledPanel, false, globals);
              userPrevSelect.tadMadReachedTopTen = false;
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(error);
        }
      }
      /* */
      userPrevSelect.prevTxnType = null;
      return;
    }
    const BILLED_FRAG = 'billedTxnFragment';
    const UNBILLED_FRAG = 'unbilledTxnFragment';
    const TXN_FRAG = (userPrevSelect.prevTxnType === 'BILLED') ? BILLED_FRAG : UNBILLED_FRAG;

    const txnList = globals.form.aem_semiWizard.aem_chooseTransactions[`${TXN_FRAG}`].aem_chooseTransactions.aem_TxnsList;
    if (currentFormContext.sumOfbilledTxnOnly > currentFormContext.tadMinusMadValue) {
      const txnArrayList = txnList?.map((el) => ({ checkVal: el.aem_Txn_checkBox.$value, amtVal: el.aem_TxnAmt.$value, id: el.aem_TxnID.$value }));
      const findExactSelect = txnList?.find((el) => (prevSelectedRowData?.txnAmt === el.aem_TxnAmt.$value) && (prevSelectedRowData?.txnDate === el.aem_TxnDate.$value) && (prevSelectedRowData?.txnId === el.aem_TxnID.$value) && (prevSelectedRowData?.txnType === el.aem_txn_type.$value));
      const indexOfPrevSelect = txnArrayList.findIndex((el) => el.id === findExactSelect.aem_TxnID.$value);
      globals.functions.setProperty(txnList[indexOfPrevSelect].aem_Txn_checkBox, { value: undefined });
    }
  };

  /**
   * getSelectedCount
   * get the total count of txn selected both billed and unbilled.
   * @param {object} globals - global form object.
   * @returns {object} - returns selectedbilledCount, selectedUnbilledCount, totallySelectedCount
   */
  const getSelectedCount = (globals) => {
    const billedData = globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection;
    const unbilledData = globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection;
    const totalSelectCount = billedData.concat(unbilledData).filter((el) => el.aem_Txn_checkBox).length;
    const billedSelectCount = billedData.filter((el) => el.aem_Txn_checkBox)?.length;
    const unBilledSelectCount = unbilledData.filter((el) => el.aem_Txn_checkBox)?.length;
    currentFormContext.TXN_SELECTED_COUNTS = {
      billed: billedSelectCount,
      unBilled: unBilledSelectCount,
      total: totalSelectCount,
    };
    return ({
      billed: billedSelectCount,
      unBilled: unBilledSelectCount,
      total: totalSelectCount,
    });
  };

  /**
  * function to update number of transaction selected.
  * @param {string} checkboxVal
  * @param {number} amount
  * @param {string} ID
  * @param {date} date
  * @param {string} txnType
  * @name txnSelectHandler
  */
  function txnSelectHandler(checkboxVal, amount, ID, date, txnType, globals) {
    /* enable-popup once it reaches BILLED-MAX-AMT-LIMIT */

    const formContext = getCurrentFormContext(globals);
    const billedTxnList = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const unbilledTxnList = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const MAX_SELECT = formContext?.MAX_SELECT;
    const BILLED_FRAG = 'billedTxnFragment';
    const UNBILLED_FRAG = 'unbilledTxnFragment';
    const TXN_FRAG = txnType === 'BILLED' ? BILLED_FRAG : UNBILLED_FRAG;
    const COUNT = getSelectedCount(globals);
    const txnSelected = globals.form.aem_semiWizard.aem_chooseTransactions?.[`${TXN_FRAG}`].aem_chooseTransactions.aem_txnHeaderPanel.aem_txnSelected;
    const SELECTED = `${(txnType === 'BILLED') ? COUNT?.billed : COUNT?.unBilled} Selected`;
    /* popup alert hanldles for the tad-mad values */
    const sumOfbilledTxnOnly = billedTxnList?.filter((el) => {
      // In case of Web only billed transaction is displayed on billedTxn panel but in whatsapp both billed and unbilled are displayed
      if (isNodeEnv$1) {
        return el.aem_Txn_checkBox.$value && el.aem_txn_type.$value === 'billed';
      }
      return el.aem_Txn_checkBox.$value;
    })?.reduce((acc, prev) => (acc + Number(String(prev.aem_TxnAmt.$value).replace(/[^\d]/g, '') / 100)), 0);
    formContext.sumOfbilledTxnOnly = sumOfbilledTxnOnly;
    if (sumOfbilledTxnOnly) {
      /* popup alert hanldles */
      const selectedTotalTxn = globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection.filter((el) => el.aem_Txn_checkBox).length + globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection.filter((el) => el.aem_Txn_checkBox).length;
      if (sumOfbilledTxnOnly > formContext.tadMinusMadValue) {
        const SELECTED_MAX_BILL = ` Please select Billed Transactions Amount Max up to Rs.${nfObject.format(formContext.tadMinusMadValue)}`;
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: SELECTED_MAX_BILL });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation1, { visible: false });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
        /* disabling selected fields in case disabled */
        disableAllTxnFields(unbilledTxnList, globals);
        disableAllTxnFields(billedTxnList, globals);

        // display error message in whatsapp flow
        customDispatchEvent('showErrorSnackbar', { errorMessage: SELECTED_MAX_BILL }, globals);

        formContext.totalSelect = COUNT?.total;
        userPrevSelect.txnRowData = {
          txnCheck: checkboxVal,
          txnAmt: amount,
          txnId: ID,
          txnDate: date,
          txnType,
        };
        if (userPrevSelect.prevTxnType === 'SELECT_TOP') {
          userPrevSelect.prevTxnType = 'SELECT_TOP';
        } else {
          userPrevSelect.prevTxnType = txnType;
        }
        const TOTAL_SELECT = `Total selected ${formContext.totalSelect}/${MAX_SELECT}`;
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });// total no of select billed or unbilled txn list
        globals.functions.setProperty(txnSelected, { value: SELECTED }); // set number of select in billed or unbilled txn list
        return;
      }
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: true });
      /* enabling selected fields in case disabled */
      enableAllTxnFields(unbilledTxnList, globals);
      enableAllTxnFields(billedTxnList, globals);
      formContext.totalSelect = selectedTotalTxn;
      const TOTAL_SELECT = `Total selected ${formContext.totalSelect}/${MAX_SELECT}`;
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });// total no of select billed or unbilled txn list
      globals.functions.setProperty(txnSelected, { value: SELECTED }); // set number of select in billed or unbilled txn list
      // return;
    }

    /* enable alert message if the user exceed selecting the txn above 10 laksh. */
    const totalSelectTxnAmt = getTotalAmount(globals);
    const emiProceedCheck = (totalSelectTxnAmt <= formContext.txnSelectExceedLimit);
    if (!emiProceedCheck) {
      const alertMsg = 'You can select up to Rs 10 lacs. To proceed further please unselect some transaction.';
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: alertMsg });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation1, { visible: false });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
      // display error message in whatsapp flow
      customDispatchEvent('showErrorSnackbar', { errorMessage: alertMsg }, globals);
      return;
    }
    customDispatchEvent('showErrorSnackbar', { errorMessage: undefined }, globals);
    // null || ON
    if (selectTopTenFlag || isUserSelection) return;
    globals.functions.setProperty(txnSelected, { value: SELECTED }); // set number of select in billed or unbilled txn list
    formContext.totalSelect = COUNT?.total;
    const TOTAL_SELECT = `Total selected ${formContext.totalSelect}/${MAX_SELECT}`;
    if ((formContext.totalSelect <= MAX_SELECT)) {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });// total no of select billed or unbilled txn list
    }
    if (formContext.totalSelect < MAX_SELECT) {
      /* enabling selected fields in case disabled */
      enableAllTxnFields(unbilledTxnList, globals);
      enableAllTxnFields(billedTxnList, globals);
    }
    if ((formContext.totalSelect === DATA_LIMITS.totalSelectLimit) && (!userPrevSelect.tadMadReachedTopTen)) {
      /* popup alert hanldles */
      if (!(userPrevSelect.selectedTenMaxTxn)) {
        const CONFIRM_TXT = 'You can select up to 10 transactions at a time, but you can repeat the process to convert more transactions into SmartEMI.';
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: CONFIRM_TXT });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation1, { visible: true });
      }
      /* disabling unselected checkBoxes */
      disableCheckBoxes(unbilledTxnList, false, globals);
      disableCheckBoxes(billedTxnList, false, globals);
    }
    /* enable disable select-tenure continue button */
    if ((formContext.totalSelect === 0) || (!emiProceedCheck)) {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
    } else if ((formContext.totalSelect > 0) || (emiProceedCheck)) {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: true });
    }
  }

  /**
     * Switches the visibility of panels in the card wizard interface.
     * @name semiWizardSwitch to switch panel visibility
     * @param {string} source -  The source of the card wizard (e.g., 'aem_semiWizard' - parent).
     * @param {string} target -  The target panel to switch to (e.g., 'aem_selectTenure' or 'aem_chooseTransactions').
     * @param {string} current-  The current view before switching.
     * @param {object} global -  global form object
     * @returns {void}
     */
  const semiWizardSwitch = (source, target, current, globals) => {
    /* reset the value of card display while coming back from tenure section */
    if ((target === domElements.chooseTransaction) && (current === domElements.selectTenure)) {
      const LABEL_OUTSTANDING_AMT = 'Your Total Outstanding Amount is';
      const CUST_NAME_LABEL = `Dear ${currentFormContext.EligibilityResponse?.cardHolderName}`;
      const TOTAL_OUTSTANDING_AMT = currentFormContext.totalOutstandingAmount;
      globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_customerNameLabel, { value: CUST_NAME_LABEL });
      globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_outStandingAmt, { value: TOTAL_OUTSTANDING_AMT });
      globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_semicreditCardContent.aem_outStandingLabel, { value: LABEL_OUTSTANDING_AMT });
    }
    return (!isNodeEnv$1) && moveWizardView(source, target);
  };

  /**
   * select top txnlist
  * @param {object} globals - global object
   */
  function selectTopTxn(globals) {
    selectTopTenFlag = !selectTopTenFlag;
    userPrevSelect.prevTxnType = 'SELECT_TOP';
    const SELECT_TOP_TXN_LIMIT = currentFormContext?.MAX_SELECT;
    const resPayload = currentFormContext.EligibilityResponse;
    const billedResData = resPayload?.ccBilledTxnResponse?.responseString;
    const unBilledResData = resPayload?.ccUnBilledTxnResponse?.responseString;
    const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const unBilledTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const billed = billedResData?.length ? globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection : [];
    const unBilled = unBilledResData?.length ? globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection : [];
    const allTxn = billed.concat(unBilled);
    const sortedArr = sortDataByAmountSymbol(allTxn);
    const txnAvailableToSelect = SELECT_TOP_TXN_LIMIT;
    userPrevSelect.txnAvailableToSelectInTopTen = txnAvailableToSelect;
    const sortedTxnList = sortedArr?.slice(0, txnAvailableToSelect);
    let unbilledCheckedItems = 0;
    let billedCheckedItems = 0;
    const topSelectByAmt = sortedArr?.slice(0, txnAvailableToSelect);
    try {
      [unBilledTxnPanel, billedTxnPanel]?.forEach((pannel) => {
        pannel?.forEach((txnList) => globals.functions.setProperty(txnList.aem_Txn_checkBox, { enabled: false, value: undefined }));
      });
      topSelectByAmt?.forEach((item) => {
        let pannel;
        if ((item.aem_txn_type === 'BILLED')) {
          pannel = billedTxnPanel;
          billedCheckedItems += 1;
        } else {
          pannel = unBilledTxnPanel;
          unbilledCheckedItems += 1;
        }
        const findAllAmtMatch = pannel.filter((el) => (el.aem_TxnAmt.$value === item.aem_TxnAmt) && ((el.aem_TxnDate.$value === item.aem_TxnDate) && (el.aem_TxnName.$value === item.aem_TxnName) && (el.logicMod.$value === item.logicMod)));
        setTimeout(() => {
          findAllAmtMatch?.forEach((matchedAmt) => globals.functions.setProperty(matchedAmt.aem_Txn_checkBox, { value: 'on', enabled: true }));
        }, 1200);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error, 'error in select top ten');
    }

    const billedTxnSelected = globals.form.aem_semiWizard.aem_chooseTransactions?.billedTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_txnSelected;
    const unbilledTxnSelected = globals.form.aem_semiWizard.aem_chooseTransactions?.unbilledTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_txnSelected;
    globals.functions.setProperty(billedTxnSelected, { value: `${billedCheckedItems} Selected` });
    globals.functions.setProperty(unbilledTxnSelected, { value: `${unbilledCheckedItems} Selected` });
    currentFormContext.totalSelect = sortedTxnList.length;
    const TOTAL_SELECT = `Total selected ${currentFormContext.totalSelect}/${sortedTxnList.length}`;
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });
    globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: true });
    setTimeout(() => {
      selectTopTenFlag = !selectTopTenFlag;
    }, 1000);
  }

  /**
  * Commits the selected radio button value and updates the UI with the corresponding rate of interest.
  * @param {object} arg1
  * @param {object} globals - global object
  */
  function radioBtnValCommit(arg1, globals) {
    if (arg1?.$value) {
      const selectedQlyFormValue = arg1?.$qualifiedName?.substring(1); // "form.aem_semiWizard.aem_selectTenure.aem_tenureSelectionMainPnl.aem_tenureSelectionRepeatablePanel[2].aem_tenureSelection"
      const selectedIndex = Number(selectedQlyFormValue?.match(/\d+/g)?.[0]); // 0, 1, 2 or 3 indicates the index of the selected
      const radioBtnOption = globals.form.aem_semiWizard.aem_selectTenure.aem_tenureSelectionMainPnl.aem_tenureSelectionRepeatablePanel;
      const tenureData = globals.functions.exportData().aem_tenureSelectionRepeatablePanel;
      radioBtnOption?.forEach((item, i) => {
        if (selectedIndex === i) {
          globals.functions.setProperty(item.aem_tenureSelection, { value: '0' });
          /* set roi based on radio select */
          const roiMonthly = `${Number(tenureData[i].aem_roi_monthly).toFixed(2)} %`;
          const roiAnnually = `${tenureData[i].aem_roi_annually}% per annum`;
          globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_ROI, { value: roiMonthly });
          globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.rateOfInterestPerAnnumValue, { value: roiAnnually });
          // /* discount */
          // const discount = globals.form.aem_semiWizard.aem_selectTenure.discount.$value; ///
          // const calcDiscount = ((Number(tenureData[i].aem_roi_monthly).toFixed(2)) - (Number(discount) / 100));
          // const roiMonthly = `${calcDiscount.toFixed(2)} %`;
          // const roiAnnually = `${tenureData[i].aem_roi_annually}% per annum`;
          // globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.aem_ROI, { value: roiMonthly });
          // globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.rateOfInterestPerAnnumValue, { value: roiAnnually });

          /* set the same data for review panel screen - whatsapp flow. */
          const rawTenureData = JSON.parse(tenureData[i].aem_tenureRawData);
          const duration = `${parseInt(rawTenureData.period, 10)} Months`;
          globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_reviewAmount, { value: `${MISC.rupeesUnicode} ${nfObject.format(getTotalAmount(globals))}` });
          globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_monthlyEmi, { value: `${tenureData[i].aem_tenureSelectionEmi} @ ${roiMonthly}` });
          globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_duration, { value: duration });
          globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_roi, { value: roiMonthly });
          globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_processingFee, { value: tenureData[i].aem_tenureSelectionProcessing });
        } else {
          globals.functions.setProperty(item.aem_tenureSelection, { value: null });
        }
      });
    }
  }

  /**
   * Generates an EMI conversion array option for the ccsmart API payload.
   * @param {object} globals - global form object
   * @returns {Array<Object>}
   */
  const getEmiArrayOption = (globals) => {
    const semiFormData = globals.functions.exportData().smartemi;
    const selectedTxnList = (semiFormData?.aem_billedTxn?.aem_billedTxnSelection?.concat(semiFormData?.aem_unbilledTxn?.aem_unbilledTxnSection))?.filter((txn) => txn.aem_Txn_checkBox === 'on');
    const CARD_SEQ = globals.form.runtime.cardSeq.$value;
    const PLAN = globals.form.runtime.plan.$value;
    const ORIG_ACCOUNT = globals.form.runtime.originAcct.$value || getCurrentFormContext()?.EligibilityResponse.responseString.aanNumber;
    const mappedTxnArray = selectedTxnList?.map(((el) => ({
      authCode: el?.authCode ?? '',
      cardSeq: CARD_SEQ,
      effDate: clearString(el?.aem_TxnDate),
      logicMod: el?.logicMod,
      itemNbr: el?.aem_TxnID,
      tranAmt: Number((String(el?.aem_TxnAmt))?.replace(/[^\d]/g, '')),
      txnDesc: el?.aem_TxnName,
      plan: PLAN,
      originAcct: ORIG_ACCOUNT,
    })));
    return mappedTxnArray;
  };

  /**
   * Generates payload for the WhatsApp flow.
   * @param {object} responseString - responseString
   * @param {object} globals - globals form object
   * @returns {Promise<Object>} - A promise that resolves to the JSON response from the ccsmart API.
   */
  const getFlowSuccessPayload = (responseString, globals) => {
    const loanNbr = responseString?.loanNbr;
    // TODO: repeated code, needed to avoid recomputation
    const emiConversionArray = getEmiArrayOption(globals);
    const loanAmount = emiConversionArray?.reduce((prev, acc) => prev + acc.tranAmt, 0);
    const loanAmountInInr = `${nfObject.format(loanAmount / 100)}`;
    // const LOAN_AMOUNT = String(emiConversionArray?.reduce((prev, acc) => prev + acc.tranAmt, 0));
    const tenurePlan = globals.functions.exportData().aem_tenureSelectionRepeatablePanel;
    const selectedTenurePlan = tenurePlan?.find((emiPlan) => emiPlan.aem_tenureSelection === '0');
    const emiSubData = JSON.parse(selectedTenurePlan?.aem_tenureRawData);
    const PROC_FEES = String(currencyStrToNum(selectedTenurePlan?.aem_tenureSelectionProcessing));
    const TENURE = (parseInt(emiSubData?.period, 10).toString().length === 1) ? (parseInt(emiSubData?.period, 10).toString().padStart(2, '0')) : parseInt(emiSubData?.period, 10).toString(); // '003' into '03' / '18'-'18'

    return {
      amount: loanAmountInInr,
      tenureMonths: TENURE,
      rateOfInterest: selectedTenurePlan?.aem_roi_monthly,
      annualRateOfInterest: selectedTenurePlan?.aem_roi_annually,
      processingFees: PROC_FEES,
      monthlyEMI: String(currencyStrToNum(selectedTenurePlan?.aem_tenureSelectionEmi)),
      loanReferenceNumber: loanNbr,
      billingCycle: getBillingCycleDate(Number(getCurrentFormContext(globals)?.EligibilityResponse?.blockCode?.billingCycle)),
    };
  };

  /**
   * Generates and sends an EMI conversion request payload for the ccsmart API.
   * @param {string} mobileNum - mobile number
   * @param {string} cardNum - card digit number
   * @param {string} otpNum - otp number
   * @param {object} globals - globals form object
   * @returns {Promise<Object>} - A promise that resolves to the JSON response from the ccsmart API.
   */
  const getCCSmartEmi = (mobileNum, cardNum, otpNum, globals) => {
    const AGENCY_CODE = 'Adobe Webforms';
    const MEM_CATEGORY = 'Adobe Webforms';
    const MEM_SUB_CAT = 'Adobe';
    const MEMO_LINE_4 = 'Adobe';
    const MEMO_LINE_5 = 'Adobe';
    const LTR_EXACT_CODE = 'Y  ';
    const DEPT = 'IT';
    const emiConversionArray = getEmiArrayOption(globals);
    const REQ_NBR = String(emiConversionArray?.length === 1) ? ((String(emiConversionArray?.length)).padStart(2, '0')) : (String(emiConversionArray?.length)); // format '01'? or '1'
    const LOAN_AMOUNT = String(emiConversionArray?.reduce((prev, acc) => prev + acc.tranAmt, 0));
    // eslint-disable-next-line no-underscore-dangle
    const _context = getCurrentFormContext(globals);
    const eligibiltyResponse = _context.EligibilityResponse;
    const tenurePlan = globals.functions.exportData().aem_tenureSelectionRepeatablePanel;
    const selectedTenurePlan = tenurePlan?.find((emiPlan) => emiPlan.aem_tenureSelection === '0');
    const emiSubData = JSON.parse(selectedTenurePlan?.aem_tenureRawData);
    String(currencyStrToNum(selectedTenurePlan?.aem_tenureSelectionProcessing));
    const INTEREST = emiSubData?.interest; // '030888'
    const TENURE = (parseInt(emiSubData?.period, 10).toString().length === 1) ? (parseInt(emiSubData?.period, 10).toString().padStart(2, '0')) : parseInt(emiSubData?.period, 10).toString(); // '003' into '03' / '18'-'18'
    const TID = emiSubData?.tid; // '000000101'
    const jsonObj = {
      requestString: {
        cardNo: cardNum,
        OTP: otpNum,
        proCode: PRO_CODE,
        prodId: eligibiltyResponse.responseString.records[0].prodId,
        agencyCode: AGENCY_CODE,
        tenure: TENURE,
        interestRate: INTEREST,
        encryptedToken: eligibiltyResponse.responseString.records[0].encryptedToken,
        loanAmt: LOAN_AMOUNT,
        ltrExctCode: LTR_EXACT_CODE,
        caseNumber: mobileNum,
        dept: DEPT,
        memCategory: MEM_CATEGORY,
        memSubCat: MEM_SUB_CAT,
        memoLine4: MEMO_LINE_4,
        memoLine5: MEMO_LINE_5,
        mobileNo: mobileNum,
        tid: TID,
        reqAmt: LOAN_AMOUNT,
        procFeeWav: '000',
        reqNbr: REQ_NBR,
        emiConversion: emiConversionArray,
        journeyID: globals.form.runtime.journeyId.$value,
        journeyName: globals.form.runtime.journeyName.$value,
        ...(!isNodeEnv$1 && { userAgent: window.navigator.userAgent }),
      },
    };
    const path = semiEndpoints.ccSmartEmi;
    if (!isNodeEnv$1) displayLoader$1();
    // For whatsapp flow visibility controlled via custom property so need to ensure on resend/submit button click property is updated.
    handleResendOtp2VisibilityInFlow(globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2.aem_resendOtpCount2.$value, globals);
    return fetchJsonResponse(path, jsonObj, 'POST', !isNodeEnv$1);
  };

  /**
   * otp timer logic to handle based on the screen of otp
   * @param {string} - otp pannel - firstotp or secondotp
   * @param {object} globals - global form object
   */
  const otpTimerV1 = (pannelName, globals) => {
    if (isNodeEnv$1) return;
    let sec = DATA_LIMITS.otpTimeLimit;
    let dispSec = DATA_LIMITS.otpTimeLimit;
    const FIRST_PANNEL_OTP = 'firstotp';
    const SECOND_PANNEL_OTP = 'secondotp';
    const panelOtp = {
      otpTimerPanel: null,
      otpTimerSecond: null,
      resendOtp: null,
      limitCheck: null,
    };
    if (pannelName === FIRST_PANNEL_OTP) {
      const otp1 = globals.form.aem_semiWizard.aem_identifierPanel.aem_otpPanel.otpPanel;
      panelOtp.otpTimerSecond = otp1.secondsPanel.seconds;
      panelOtp.otpTimerPanel = otp1.secondsPanel;
      panelOtp.resendOtp = otp1.aem_otpResend;
      panelOtp.limitCheck = resendOtpCount < DATA_LIMITS.maxOtpResendLimit;
    }
    if (pannelName === SECOND_PANNEL_OTP) {
      const otp2 = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
      panelOtp.otpTimerSecond = otp2.secondsPanel.seconds2;
      panelOtp.otpTimerPanel = otp2.secondsPanel;
      panelOtp.resendOtp = otp2.aem_otpResend2;
      panelOtp.limitCheck = resendOtpCount2 < DATA_LIMITS.maxOtpResendLimit;
    }
    const timer = setInterval(() => {
      globals.functions.setProperty(panelOtp.otpTimerSecond, { value: dispSec });
      sec -= 1;
      dispSec = sec;
      if (sec < 10) {
        dispSec = `0${dispSec}`;
      }
      if (sec < 0) {
        clearInterval(timer);
        globals.functions.setProperty(panelOtp.otpTimerPanel, { visible: false });
        if (panelOtp.limitCheck) {
          globals.functions.setProperty(
            panelOtp.resendOtp,
            { visible: true },
          );
        }
      }
    }, 1000);
  };

  /**
   * @name resendOTPV1 - to handle resend otp for otpv1 &  preExecution
   * @param {Object} globals - The global form object
   * @param {string} - otp pannel - firstotp or secondotp
   * @return {PROMISE}
   */
  const resendOTPV1 = async (pannelName, globals) => {
    const channel = 'web';
    const FIRST_PANNEL_OTP = 'firstotp';
    const SECOND_PANNEL_OTP = 'secondotp';
    const panelOtp = {
      otpTimerPanel: null,
      otpTimerSecond: null,
      resendOtp: null,
      limitCheck: null,
      maxLimitOtp: null,
      resendOtpCount: null,
    };
    if (pannelName === FIRST_PANNEL_OTP) {
      const otp1 = globals.form.aem_semiWizard.aem_identifierPanel.aem_otpPanel.otpPanel;
      panelOtp.otpTimerSecond = otp1.secondsPanel.seconds;
      panelOtp.otpTimerPanel = otp1.secondsPanel;
      panelOtp.resendOtp = otp1.aem_otpResend;
      panelOtp.limitCheck = resendOtpCount < DATA_LIMITS.maxOtpResendLimit;
      panelOtp.maxLimitOtp = otp1.aem_maxlimitOTP;
      resendOtpCount += 1;
      panelOtp.resendOtpCount = resendOtpCount;
    }
    if (pannelName === SECOND_PANNEL_OTP) {
      const otp2 = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
      panelOtp.otpTimerSecond = otp2.secondsPanel.seconds2;
      panelOtp.otpTimerPanel = otp2.secondsPanel;
      panelOtp.resendOtp = otp2.aem_otpResend2;
      panelOtp.limitCheck = resendOtpCount2 < DATA_LIMITS.maxOtpResendLimit;
      panelOtp.maxLimitOtp = otp2.aem_maxlimitOTP2;
      resendOtpCount2 += 1;
      panelOtp.resendOtpCount = resendOtpCount2;
      if (isNodeEnv$1) {
        panelOtp.resendOtpCountField = otp2.aem_resendOtpCount2;
        panelOtp.limitCheck = otp2.aem_resendOtpCount2.$value < DATA_LIMITS.maxOtpResendLimit;
        panelOtp.resendOtpCount = otp2.aem_resendOtpCount2.$value + 1;
      }
    }
    const mobileNumber = globals.form.aem_semiWizard.aem_identifierPanel.aem_loginPanel.mobilePanel.aem_mobileNum.$value;
    const cardDigits = globals.form.aem_semiWizard.aem_identifierPanel.aem_loginPanel.aem_cardNo.$value;
    if (panelOtp.resendOtpCountField) {
      globals.functions.setProperty(panelOtp.resendOtpCountField, { value: panelOtp.resendOtpCount });
    }
    globals.functions.setProperty(panelOtp.otpTimerPanel, { visible: true });
    if (panelOtp.limitCheck) {
      if (panelOtp.resendOtpCount === DATA_LIMITS.maxOtpResendLimit) {
        globals.functions.setProperty(panelOtp.otpTimerPanel, { visible: false });
        globals.functions.setProperty(panelOtp.resendOtp, { visible: false });
        globals.functions.setProperty(panelOtp.maxLimitOtp, { visible: true });
        // In web resend OTP button is visible after 30 sec, until this it is hidded. So we have usd custom property to control
        // visibility in whatsapp Flow.
        if (pannelName === SECOND_PANNEL_OTP) {
          handleResendOtp2VisibilityInFlow(panelOtp.resendOtpCount, globals);
        }
      }
      if (pannelName === FIRST_PANNEL_OTP) {
        return getOTPV1(mobileNumber, cardDigits, channel, globals);
      }
      if (pannelName === SECOND_PANNEL_OTP) {
        return preExecution(mobileNumber, cardDigits, globals);
      }
    }
    return null;
  };

  /**
   * on click of t&c navigation, open Url in new tab
   */
  const tAndCNavigation = () => {
    const TNC_LINK = 'https://www.hdfcbank.com/content/bbp/repositories/723fb80a-2dde-42a3-9793-7ae1be57c87f/?path=/Personal/Borrow/Loan%20Against%20Asset%20Landing/Smart%20EMI/SmartEMI-TC-Dec20.pdf';
    if (window !== undefined) {
      window.open(TNC_LINK, '_blank');
    }
  };

  const isNodeEnv = typeof process !== 'undefined' && process.versions && process.versions.node;

  if (isNodeEnv) {
     // eslint-disable-next-line no-restricted-globals
    global._satellite = {
      track: () => {},
    };
  }

  exports.assistedToggleHandler = assistedToggleHandler;
  exports.branchHandler = branchHandler;
  exports.changeCheckboxToToggle = changeCheckboxToToggle;
  exports.changeWizardView = changeWizardView;
  exports.channelDDHandler = channelDDHandler;
  exports.checkELigibilityHandler = checkELigibilityHandler;
  exports.createJourneyId = createJourneyId;
  exports.customDispatchEvent = customDispatchEvent;
  exports.dsaHandler = dsaHandler;
  exports.getCCSmartEmi = getCCSmartEmi;
  exports.getFlowSuccessPayload = getFlowSuccessPayload;
  exports.getOTPV1 = getOTPV1;
  exports.handleTadMadAlert = handleTadMadAlert;
  exports.handleWrongCCDetailsFlows = handleWrongCCDetailsFlows;
  exports.invokeJourneyDropOff = invokeJourneyDropOff;
  exports.invokeJourneyDropOffByParam = invokeJourneyDropOffByParam;
  exports.invokeJourneyDropOffUpdate = invokeJourneyDropOffUpdate;
  exports.otpTimerV1 = otpTimerV1;
  exports.otpValV1 = otpValV1;
  exports.preExecution = preExecution;
  exports.radioBtnValCommit = radioBtnValCommit;
  exports.reloadPage = reloadPage;
  exports.resendOTPV1 = resendOTPV1;
  exports.selectTenure = selectTenure;
  exports.selectTopTxn = selectTopTxn;
  exports.semiWizardSwitch = semiWizardSwitch;
  exports.sendAnalytics = sendAnalytics;
  exports.sendErrorAnalytics = sendErrorAnalytics;
  exports.sortData = sortData;
  exports.tAndCNavigation = tAndCNavigation;
  exports.txnSelectHandler = txnSelectHandler;

  return exports;

})({});
