(function (exports) {
  'use strict';

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
  * @param {string} [method='POST'] - The HTTP method to use for the request (default is 'POST').
  * @param {object} payload - The data payload to send with the request.
  * @returns {*} - The JSON response from the server.
  */
  function fetchJsonResponse(url, payload, method, loader = false) {
    // apiCall-fetch
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

  /**
   * Initiates an http call with JSON payload to the specified URL using the specified method.
   *
   * @param {string} url - The URL to which the request is sent.
   * @param {string} [method='POST'] - The HTTP method to use for the request (default is 'POST').
   * @param {object} payload - The data payload to send with the request.
   * @returns {*} - The JSON response from the server.
   */
  function getJsonResponse(url, payload, method = 'POST') {
    // apiCall-fetch
    return fetch(url, {
      method,
      body: null,
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

  const JOURNEY_NAME = 'SMART_EMI_JOURNEY';
  const PRO_CODE$1 = '009';
  const ERROR_MSG$1 = {
    mobileError: 'Enter valid mobile number',
    noEligibleTxnFlow: "There are no eligible transactions on this card. Please try a different card."
  };

  const FLOWS_ERROR_MESSAGES$1 = {
    "XFACE_INQ_VP_0003": "Hey, it seems like you have entered incorrect details. Request you to check & re-enter your last 4 digits of the card.",
    "XFACE_E2FA_02": "Incorrect OTP code. Please try again.", // For this case error message is hardcoded in rule
    "XFACE_E2FA_04": "Oops! you have entered wrong otp too many times please try again later"
  };

  const CHANNELS$1 = {
    adobeWeb: 'ADOBE_WEB',
    adobeWhatsApp: 'ADOBE_WHATSAPP',
  };

  const SEMI_ENDPOINTS = {
    otpGen: 'https://applyonlinedev.hdfcbank.com/content/hdfc_ccforms/api/validatecardotpgen.json',
    otpVal: 'https://applyonlinedev.hdfcbank.com/content/hdfc_ccforms/api/eligibilitycheck.json',
    preexecution: 'https://applyonlinedev.hdfcbank.com/content/hdfc_ccforms/api/preexecution.json',
    masterChanel: 'https://applyonlinedev.hdfcbank.com/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_CHANNEL_MASTER.json',
    ccSmartEmi: 'https://applyonlinedev.hdfcbank.com/content/hdfc_ccforms/api/ccsmartemi.json',
    branchMaster: 'https://applyonlinedev.hdfcbank.com/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_BRANCH_MASTER.BRANCH_CODE',
    dsaCode: 'https://applyonlinedev.hdfcbank.com/content/hdfc_commonforms/api/mdm.CREDIT.POST_ISSUANCE_DSA_MASTER.DSACODE',
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
  const CURRENT_FORM_CONTEXT$1 = {};
  const DATA_LIMITS$1 = {
    totalSelectLimit: 10,
    otpTimeLimit: 30,
    maxOtpResendLimit: 3,
  };
  const RESPONSE_PAYLOAD$1 = {
    response: {
      pseudoID: '',
      blockCode: {
        mad: '00000001960000',
        bbvlogn_card_outst: '-00000001347935',
        billingCycle: '19',
        tad: '00000224980000',
        cardNumber: '1012350000002025',
      },
      address: {
        city: 'JALPAIGURI',
        postalCode: '745202',
        name: 'TEST FLOTRAPI TEST FLOTRAPI',
        addressLine1: 'TESTING TESTING TESTING XX',
        addressLine2: 'TEST TEST TEST TEST12',
        addressLine3: 'TESTING TESTING123',
        state: 'WB',
        addressLine4: '',
      },
      ccBilledTxnResponse: {
        responseString: [
          {
            date: '19-03-2021',
            amount: 1123000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '22',
            id: '80201',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 9994000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '21',
            id: '80193',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 4300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '20',
            id: '80185',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 4200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '19',
            id: '80177',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 4100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '18',
            id: '80169',
            PLANNO: '10002',
          },
          {
            date: '19-02-2020',
            amount: 998000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '17',
            id: '80151',
            PLANNO: '10002',
          },
          {
            date: '19-02-2022',
            amount: 3900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '16',
            id: '80144',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 3800,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '15',
            id: '80136',
            PLANNO: '10002',
          },
          {
            date: '19-08-2022',
            amount: 3700,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '14',
            id: '80128',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 971000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '13',
            id: '80110',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 3400,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '11',
            id: '80094',
            PLANNO: '10002',
          },
          {
            date: '19-05-2024',
            amount: 3300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '10',
            id: '80086',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 3200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '9',
            id: '80078',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 3100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '8',
            id: '80060',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 3000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '7',
            id: '80052',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 2900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '6',
            id: '80045',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 2800,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '5',
            id: '80037',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 2700,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '4',
            id: '80029',
            PLANNO: '10002',
          },
          {
            date: '19-02-2021',
            amount: 2600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '3',
            id: '80011',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4500,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '43',
            id: '70206',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4400,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '42',
            id: '70198',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '41',
            id: '70180',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '40',
            id: '70172',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '39',
            id: '70164',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '38',
            id: '70156',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '37',
            id: '70149',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3800,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '36',
            id: '70131',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3700,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '35',
            id: '70123',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '34',
            id: '70115',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3500,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '33',
            id: '70107',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3400,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '32',
            id: '70099',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '31',
            id: '70081',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '30',
            id: '70073',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '29',
            id: '70065',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '28',
            id: '70057',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 2900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '27',
            id: '70040',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 2800,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '26',
            id: '70032',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 2700,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '25',
            id: '70024',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 2600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '24',
            id: '70016',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '23',
            id: '20218',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4500,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '22',
            id: '20200',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4400,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '21',
            id: '20192',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '20',
            id: '20184',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '19',
            id: '20176',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '18',
            id: '20168',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '17',
            id: '20150',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '16',
            id: '20143',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4500,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '43',
            id: '70206',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4400,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '42',
            id: '70198',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '41',
            id: '70180',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '40',
            id: '70172',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '39',
            id: '70164',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 4000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '38',
            id: '70156',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '37',
            id: '70149',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3800,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '36',
            id: '70131',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3700,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '35',
            id: '70123',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '34',
            id: '70115',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3500,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '33',
            id: '70107',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3400,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '32',
            id: '70099',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '31',
            id: '70081',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '30',
            id: '70073',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '29',
            id: '70065',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 3000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '28',
            id: '70057',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 2900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '27',
            id: '70040',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 2800,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '26',
            id: '70032',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 2700,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '25',
            id: '70024',
            PLANNO: '10002',
          },
          {
            date: '17-02-2021',
            amount: 2600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 BILLED TXN',
            lasttxnseqno: '24',
            id: '70016',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '23',
            id: '20218',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4500,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '22',
            id: '20200',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4400,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '21',
            id: '20192',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '20',
            id: '20184',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '19',
            id: '20176',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '18',
            id: '20168',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 4000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '17',
            id: '20150',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '16',
            id: '20143',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3800,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '15',
            id: '20135',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3700,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '14',
            id: '20127',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '13',
            id: '20119',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3500,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '12',
            id: '20101',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3400,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '11',
            id: '20093',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3300,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '10',
            id: '20085',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3200,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '9',
            id: '20077',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3100,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '8',
            id: '20069',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 3000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '7',
            id: '20051',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 2900,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '6',
            id: '20044',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 2800,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '5',
            id: '20036',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 2700,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '4',
            id: '20028',
            PLANNO: '10002',
          },
          {
            date: '13-02-2021',
            amount: 2600,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '1',
            name: '20 UNBILLED TXN',
            lasttxnseqno: '3',
            id: '20010',
            PLANNO: '10002',
          },
          {
            date: '17-01-2021',
            amount: 10000,
            AUTH_CODE: '',
            STS: 'N',
            LOGICMOD: '11',
            name: 'FIRST YEAR MEMBERSHIP FEE',
            lasttxnseqno: '3',
            id: '90080',
            PLANNO: '10002',
          },
        ],
        status: {
          errorCode: '0',
          errorMsg: '0',
        },
      },
      responseString: {
        relationNumber: '0001010000000245767',
        primaryCardHolderName: 'TEST FLOTRAPI TEST',
        records: [
          {
            maxEligibleAmt: '00000000000700000',
            procWaiv2: '00',
            procWaiv4: '00',
            procWaiv3: '00',
            period4: '018',
            period3: '012',
            procWaiv5: '0',
            period2: '006',
            maximumProcessingFee5: '>9999999 99',
            plan: '00000',
            maximumProcessingFee4: '00',
            maximumProcessingFee3: '00',
            period5: '024',
            maximumProcessingFee2: '00',
            period: '003',
            minimumProcessingFee2: '00',
            thresholdAmount5: '000000000000',
            maximumProcessingFeeRedef2: '00',
            minimumProcessingFee4: '00',
            thresholdAmount4: '000000000000',
            minimumProcessingFee3: '00',
            thresholdAmount3: '000000000000',
            processingFeeRedef: '799 00',
            maximumProcessingFeeRedef4: '00',
            maximumProcessingFeeRedef3: '00',
            percentageRedef: '> 00',
            maximumProcessingFeeRedef5: '>9999999 99',
            thresholdAmount2: '000000000000',
            interestX4: '01500',
            minimumProcessingFeeRedef: '00',
            interestX5: '01600',
            minimumProcessingFee5: '00',
            interestX2: '01188',
            interestX3: '02488',
            planDescription: '',
            proCode: '009',
            thresholdAmountRedef2: '000000000000',
            prodId: '00009',
            thresholdAmountRedef4: '000000000000',
            thresholdAmountRedef3: '000000000000',
            thresholdAmountRedef5: '000000000000',
            percentage2: '00',
            memoLine1: '499',
            percentage3: '> 00',
            feeWaiverFlg: '0',
            percentage4: '00',
            percentage5: '00',
            memoLine4: 'MEMOLINE004',
            memoLine3: 'MEMOLINE003',
            memoLine2: 'MEMOLINE002',
            plan5: '00000',
            plan2: '00000',
            plan3: '00000',
            plan4: '00000',
            interestR2: '1188',
            interestR3: '2488',
            planDescription5: '',
            planDescription3: '',
            interestR4: '1500',
            planDescription4: '',
            interestR5: '1600',
            planDescription2: '',
            processingFee5: '99 00',
            processingFee4: '799 00',
            processingFee3: '799 00',
            processingFeeRedef3: '799 00',
            thresholdAmountRedef: '000000000000',
            processingFeeRedef4: '799 00',
            processingFeeRedef5: '99 00',
            processingFee: '799 00',
            tid: '000000106',
            processingFeeRedef2: '799 00',
            interestO: '0',
            minimumProcessingFee: '00',
            percentage: '> 00',
            logo: '000',
            interestX: '03088',
            prodDesc: 'SMART EMI DIAL AN EMI',
            interestR: '3088',
            eligibleAmtPercent: 'A',
            tid5: '000000192',
            tid3: '000000109',
            tid4: '000000113',
            tid2: '000000101',
            processingFee2: '799 00',
            interest3: '02488',
            interest2: '01188',
            interest5: '01600',
            interest4: '01500',
            encryptedToken: '[B@12a3a380TMDAwMTAxMjM1MDAwMDAwMjAyNTAwMDAwMDAwMDAwMDAwMDA=',
            maximumProcessingFee: '00',
            percentageRedef3: '> 00',
            percentageRedef2: '00',
            logo2: '000',
            interestO5: '0',
            maximumProcessingFeeRedef: '00',
            minimumProcessingFeeRedef5: '00',
            percentageRedef5: '00',
            percentageRedef4: '00',
            minimumProcessingFeeRedef2: '00',
            minimumProcessingFeeRedef3: '00',
            minimumProcessingFeeRedef4: '00',
            logo4: '000',
            logo3: '000',
            procWaivredef5: '0',
            logo5: '000',
            procWaivredef2: '00',
            procWaivredef4: '00',
            procWaivredef3: '00',
            interest: '03088',
            eligible: 'Y',
            eligibleAmt: '00000000000700000',
            interestO3: '0',
            interestO4: '0',
            interestO2: '0',
            thresholdAmount: '000000000000',
            savingAcctNumber: '0000000000000000',
            processingFeeFlag: 'F',
            processingFeeFlag4: 'F',
            processingFeeFlag3: 'F',
            processingFeeFlag5: 'F',
            procWaiv: '00',
            processingFeeFlag2: 'F',
          },
        ],
        custNumber: '0001012350000002025',
        creditLimit: '000300000',
        aanNumber: '0001012350000002025',
      },
      cardHolderName: 'TEST FLOTRAPI TEST FLOTRAPI',
      ccUnBilledTxnResponse: {
        responseString: [
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000410000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00016',
            id: '60167 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000400000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00015',
            id: '60159 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000390000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00014',
            id: '60142 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000380000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00013',
            id: '60134 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000370000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00012',
            id: '60126 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000360000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00011',
            id: '60118 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000350000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00010',
            id: '60100 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000440000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00009',
            id: '60092 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000330000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00008',
            id: '60084 ',
            PLANNO: '10002',
          },
          {
            date: '23-01-2021',
            authcode: '',
            amount: ' 00000000620000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00007',
            id: '60076 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000710000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00006',
            id: '60068 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000300000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00005',
            id: '60050 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000290000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00004',
            id: '60043 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2021',
            authcode: '',
            amount: ' 00000000280000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00003',
            id: '60035 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2022',
            authcode: '',
            amount: ' 00000000970000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00002',
            id: '60027 ',
            PLANNO: '10002',
          },
          {
            date: '23-02-2023',
            authcode: '',
            amount: ' 00000000260000',
            STS: 'N',
            LOGICMOD: '01',
            name: '20 UNBILLED TXN                         ',
            lasttxnseqno: '00001',
            id: '60019 ',
            PLANNO: '10002',
          },
        ],
        status: {
          errorCode: '00000',
          lasttxnseqno: '7',
          errorMsg: '0',
        },
      },
      cardTypePath: '/content/dam/hdfc/cc-forms/card_facia/1-Infinia-Visa.jpg',
      productDetails: {
        currentCardDetails: {
          features: {
            'Catalogue \u2013 Redemption (up to)': '50 Paise',
            'Flight & Hotel \u2013 Redemption': '100 Paise',
            'International Lounge Access/Year': 'UNLIMITED',
            'Cashback \u2013 Redemption': '30 Paise',
            'Domestic Lounge Access/year': 'UNLIMITED',
            'Reward Points / Rs150 spent': '5 RP',
          },
          PRODUCT: 'INFINIA',
          cardType: 'Visa',
          verticalcard: '',
          cardTypePath: '/content/dam/hdfc/cc-forms/card_facia/1-Infinia-Visa.jpg',
        },
        showLinkFlag: 'false',
      },
      email: {
        residenceEmail: 'TESTING1234567898765432@MAIL.COM',
        officeEmail: '',
      },
      status: {
        errorCode: '0',
        errorMsg: 'Success',
      },
    },
  };

  var SEMI_CONSTANT = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CHANNELS: CHANNELS$1,
    CURRENT_FORM_CONTEXT: CURRENT_FORM_CONTEXT$1,
    DATA_LIMITS: DATA_LIMITS$1,
    DOM_ELEMENT: DOM_ELEMENT,
    ERROR_MSG: ERROR_MSG$1,
    FLOWS_ERROR_MESSAGES: FLOWS_ERROR_MESSAGES$1,
    JOURNEY_NAME: JOURNEY_NAME,
    MAX_OTP_RESEND_COUNT: MAX_OTP_RESEND_COUNT,
    MISC: MISC$1,
    OTP_TIMER: OTP_TIMER,
    PRO_CODE: PRO_CODE$1,
    RESPONSE_PAYLOAD: RESPONSE_PAYLOAD$1,
    SEMI_ENDPOINTS: SEMI_ENDPOINTS
  });

  // declare COMMON_CONSTANTS for all forms only.
  // impoted as CONSTANT key name in all files
  const BASEURL$1 = 'https://applyonlinedev.hdfcbank.com';
  const CHANNEL$3 = 'ADOBE_WEBFORMS';
  const ENDPOINTS$2 = {
    aadharCallback: '/content/hdfc_etb_wo_pacc/api/aadharCallback.json',
    aadharInit: '/content/hdfc_haf/api/aadhaarInit.json',
    fetchAuthCode: '/content/hdfc_commonforms/api/fetchauthcode.json',
    emailId: '/content/hdfc_commonforms/api/emailid.json',
    executeInterface: '/content/hdfc_haf/api/executeinterface.json',
    finalDap: '/content/hdfc_etb_wo_pacc/api/finaldap.json',
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

  const CURRENT_FORM_CONTEXT = {};

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
    },
  };

  var CONSTANT = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BASEURL: BASEURL$1,
    CHANNEL: CHANNEL$3,
    CURRENT_FORM_CONTEXT: CURRENT_FORM_CONTEXT,
    DEAD_PAN_STATUS: DEAD_PAN_STATUS,
    ENDPOINTS: ENDPOINTS$2,
    FORM_RUNTIME: FORM_RUNTIME,
    ID_COM: ID_COM
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
   */
  // select dropdow-aadhar
  const aadharLangChange$1 = (adharContentDom, defaultLang) => {
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
    selectOp.value = defaultLang;
    selectOp?.addEventListener('change', (e) => {
      e.preventDefault();
      const { value: valueSelected } = e.target;
      selectOp.value = valueSelected;
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

  var DOM_API = /*#__PURE__*/Object.freeze({
    __proto__: null,
    aadharLangChange: aadharLangChange$1,
    addDisableClass: addDisableClass$1,
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
  } = DOM_API; // DOM_MANIPULATE_CODE_FUNCTION

  const { BASEURL } = CONSTANT;

  // declare-CONSTANTS
  const DATA_ATTRIBUTE_EMPTY = 'data-empty';
  const ANCESTOR_CLASS_NAME = 'field-wrapper';

  /**
   * Generates the full API path based on the environment.
   * @param {string} uri - The endpoint to be appended to the base URL.
   * @returns {string} - The complete API URL including the base URL and the provided endpoint.
   */

  const urlPath = (path) => `${BASEURL}${path}`;

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
        const element = document.getElementsByName(panelName._data.$_name)?.[0];
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
      const element = document.getElementsByName(panelName._data.$_name)?.[0];
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
      console.error(ex);
      return null;
    }
  };

  /**
   * Generates a Version 4 UUID (Universally Unique Identifier) using a cryptographically secure method.
   * @returns {string} The generated UUID string.
   */
  const generateUUID = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));

  // import semitcRedirectURI from '../../blocks/form/constant.js';
  /**
   * Function validates the Mobile Input Field
   *
   */
  const addMobileValidation = async () => {
    const validFirstDigits = ['6', '7', '8', '9'];
    const inputField = document.querySelector('.field-aem-mobilenum input');
    inputField?.addEventListener('input', () => validatePhoneNumber(inputField, validFirstDigits));
  };

  /**
     * Function validates the Card Last 4 digits Input Field
     *
     */
  const addCardFieldValidation = () => {
    const inputField = document.querySelector('.field-aem-cardno input');
    inputField?.addEventListener('input', () => validateCardDigits(inputField));
  };

  /**
    * Function validates the OTP Input Field
    *
    */
  const addOtpFieldValidation = () => {
    const inputField = document.querySelector('.field-aem-otpnumber input');
    const inputField2 = document.querySelector('.field-aem-otpnumber2 input');
    [inputField, inputField2].forEach((ip) => ip?.addEventListener('input', () => validateOTPInput(ip)));
  };

  /**
    * Function validates the OTP Input Field
    *
    */
  const linkToPopupToggle = (hyperLink, popupOverlay, popupContent, closeBtn = false, redirectBtn = false) => {
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
      document.querySelector(closeBtn).addEventListener('click', (event) => {
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

  const isNodeEnv$1 = typeof process !== 'undefined' && process.versions && process.versions.node;

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
  const numberToText = (num) => {
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
    linkToPopupToggle('.field-disclaimer-text a', '.field-landingconfirmationpopup', '.field-doyouwishtocontinue', '.field-cross-btn button', '.field-err-popup-buttonconfirm button');
    linkToPopupToggle('.field-aem-txnssummarytext a', '.field-aem-txnssummarypopupwrapper', '.field-aem-txnssummarypopup', '.field-aem-txnssummaryok');
  };

  const getBillingCycleDate = (day) => {

    // Get the current day of the month in the Indian timezone
    const options = { timeZone: 'Asia/Kolkata', day: 'numeric' };
    const dayOfMonth = Number(new Intl.DateTimeFormat('en-US', options).format(new Date()));

    const date = new Date();
    // Set the provided day
    date.setDate(day);
    if(day <= dayOfMonth) {
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

  if (!isNodeEnv$1) {
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
      branchCode, dsaCode, lc1Code, lc2Code, smCode, lgTseCode,
    } = await extractEmpAsstPannels(globals);
    // Mapping UTM params to field names
    const fieldMapping = {
      dsacode: dsaCode,
      lc1: lc1Code,
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
          enum: channelOptions, enumNames: chanelEnumNames, value: findParamChanelValue.value, enabled: false,
        });
        await preFillFromUtm(globals);
      } else {
        globals.functions.setProperty(channelDropDown, { enum: channelOptions, enumNames: chanelEnumNames, value: DEF_OPTION[0].value });
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
    const branchNameUtil = formUtil(globals, branchName);
    const branchCityUtil = formUtil(globals, branchCity);
    globals.functions.markFieldAsInvalid(branchCode.$qualifiedName, '', { useQualifiedName: true });
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
      // globals.functions.markFieldAsInvalid(branchCode.$qualifiedName, INVALID_MSG, { useQualifiedName: true });
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
    const dsaNameUtil = formUtil(globals, dsaName);
    // globals.functions.markFieldAsInvalid(dsaCode.$qualifiedName, '', { useQualifiedName: true });
    try {
      const dsaCodeUrl = `${semiEndpoints$1.dsaCode}-${dsaCode.$value?.toLowerCase()}.json`;
      const response = await getJsonResponse(dsaCodeUrl, null, 'GET');
      const data = response?.[0];
      if (data?.errorCode === '500') {
        throw new Error(data?.errorMessage);
      } else {
        // globals.functions.setProperty(dsaCode, { valid: true });
        // globals.functions.markFieldAsInvalid(dsaCode.$qualifiedName, '', { useQualifiedName: true });
        const dsaNameVal = data?.DSANAME;
        const changeDataAttrObj = { attrChange: true, value: false, disable: true };
        dsaNameUtil.setValue(dsaNameVal, changeDataAttrObj);
      }
    } catch (error) {
      // globals.functions.markFieldAsInvalid(dsaCode.$qualifiedName, INVALID_MSG, { useQualifiedName: true });
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

  /* eslint no-bitwise: ["error", { "allow": ["^", ">>", "&"] }] */


  const { ENDPOINTS: ENDPOINTS$1, CHANNEL: CHANNEL$2, CURRENT_FORM_CONTEXT: currentFormContext$3 } = CONSTANT;

  /**
    * @name invokeJourneyDropOffByParam
    * @param {string} mobileNumber
    * @param {string} leadProfileId
    * @param {string} journeyId
    * @return {PROMISE}
    */
  const invokeJourneyDropOffByParam = async (mobileNumber, leadProfileId, journeyID) => {
    const journeyJSONObj = {
      RequestPayload: {
        leadProfile: {
          mobileNumber,
        },
        journeyInfo: {
          journeyID,
        },
      },
    };
    const url = urlPath(ENDPOINTS$1.journeyDropOffParam);
    const method = 'POST';
    return fetchJsonResponse(url, journeyJSONObj, method);
  };

  /* temproraily added this journey utils for SEMI , journey utils common file has to be changed to generic */
  const CHANNEL$1 = 'ADOBE_WEBFORMS';

  const {
    CURRENT_FORM_CONTEXT: currentFormContext$2,
  } = SEMI_CONSTANT;
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
          channel: CHANNEL$1,
          journeyName: currentFormContext$2.journeyName,
          journeyID: currentFormContext$2.journeyID,
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
    const url = urlPath(ENDPOINTS$2.journeyDropOff);
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
    const sanitizedFormData = santizedFormDataWithContext(globals, currentFormContext$2);
    const journeyJSONObj = {
      RequestPayload: {
        userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : '',
        leadProfile: {
          mobileNumber,
          leadProfileId: leadProfileId?.toString(),
        },
        formData: {
          channel: CHANNEL$1,
          journeyName: currentFormContext$2.journeyName,
          journeyID: currentFormContext$2.journeyID,
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
    const url = urlPath(ENDPOINTS$2.journeyDropOffUpdate);
    const method = 'POST';
    return fetchJsonResponse(url, journeyJSONObj, method);
  };

  /* eslint-disable no-console */

  const {
    ENDPOINTS,
    CURRENT_FORM_CONTEXT: currentFormContext$1,
    FORM_RUNTIME: formRuntime,
    CHANNEL,
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
    // eslint-disable-next-line no-unused-vars
    RESPONSE_PAYLOAD,
  } = SEMI_CONSTANT;

  const isNodeEnv = typeof process !== 'undefined' && process.versions && process.versions.node;

  /**
     * generates the journeyId
     * @param {string} visitMode - The visit mode (e.g., "online", "offline").
     * @param {string} journeyAbbreviation - The abbreviation for the journey.
     * @param {string} channel - The channel through which the journey is initiated.
     */
  // eslint-disable-next-line no-unused-vars
  function generateJourneyId(visitMode, journeyAbbreviation, channel) {
    const dynamicUUID = generateUUID();
    const journeyId = `${dynamicUUID}_01_${journeyAbbreviation}_${visitMode}_${channel}`;
    return journeyId;
  }

  // Initialize all SEMI Journey Context Variables & formRuntime variables.
  currentFormContext.journeyName = journeyName;
  currentFormContext.journeyID = generateJourneyId('a', 'b', 'c');
  currentFormContext.totalSelect = 0;
  currentFormContext.billed = 0;
  currentFormContext.unbilled = 0;
  currentFormContext.billedMaxSelect = 0;
  currentFormContext.txnSelectExceedLimit = 1000000; // ten lakhs txn's select exceeding limit
  let tnxPopupAlertOnce = 0; // flag alert for the pop to show only once on click of continue
  let resendOtpCount = 0;
  let resendOtpCount2 = 0;

  function getCurrentFormContext(globals) {
    if (isNodeEnv) {
      return JSON.parse(globals.form.runtime.currentFormContext.$value || '{}');
    }
    return currentFormContext;
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
    if (!isNodeEnv) {
      /* restrict to show otp-resend option once it reaches max-attemt and to show otptimer */
      const { otpPanel } = globals.form.aem_semiWizard.aem_identifierPanel.aem_otpPanel;
      if (resendOtpCount < DATA_LIMITS.maxOtpResendLimit) {
        globals.functions.setProperty(otpPanel.secondsPanel, { visible: true });
        globals.functions.setProperty(otpPanel.aem_otpResend, { visible: false });
      } else {
        globals.functions.setProperty(otpPanel.secondsPanel, { visible: false });
      }
      globals.functions.setProperty(globals.form.runtime.journeyId, { value: currentFormContext.journeyID });
      currentFormContext.journeyName = JOURNEY_NAME;
      displayLoader$1();
    }
    let path = semiEndpoints.otpGen;
    let jsonObj = {
      requestString: {
        mobileNo: mobileNumber,
        cardNo: cardDigits,
        journeyID: currentFormContext.journeyID,
        journeyName: currentFormContext.journeyName,
      },
    };
    if (channel === CHANNELS.adobeWhatsApp) {
      path = semiEndpoints.otpVal;
      jsonObj = {
        requestString: {
          mobileNo: mobileNumber,
          cardNo: cardDigits,
          proCode: PRO_CODE,
          journeyID: currentFormContext.journeyID,
          journeyName: currentFormContext.journeyName,
          channel: CHANNELS.adobeWhatsApp,
        },
      };
    }
    // eslint-disable-next-line no-unneeded-ternary
    return fetchJsonResponse(path, jsonObj, 'POST', isNodeEnv ? false : true);
  }

  /**
   * generates the otp
   * @param {string} mobileNumber
   * @param {string} cardDigits
   * @param {object} globals
   * @return {PROMISE}
   */
  function otpValV1(mobileNumber, cardDigits, otpNumber) {
    const jsonObj = {
      requestString: {
        mobileNo: mobileNumber,
        cardNo: cardDigits,
        OTP: otpNumber,
        proCode: PRO_CODE,
        journeyID: currentFormContext.journeyID,
        journeyName: currentFormContext.journeyName,
      },
    };
    const path = semiEndpoints.otpVal;
    if (isNodeEnv) {
      jsonObj.requestString.channel = CHANNELS.adobeWhatsApp;
      delete jsonObj.requestString.OTP;
    }
    if (!isNodeEnv) displayLoader$1();
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
    if(!isNodeEnv) return;
    const count = wrongNumberCount.$value;
    if(count < 2) {
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
    const currentFormContext = getCurrentFormContext(globals);
    const jsonObj = {
      requestString: {
        mobileNo: mobileNumber,
        cardNo: cardDigits,
        encryptedToken: currentFormContext.EligibilityResponse.responseString.records[0].encryptedToken,
        journeyID: currentFormContext.journeyID,
        journeyName: currentFormContext.journeyName,
      },
    };
    const path = semiEndpoints.preexecution;
    if (!isNodeEnv) displayLoader$1();
    return fetchJsonResponse(path, jsonObj, 'POST', !isNodeEnv);
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
    globals.functions.setProperty(panel[i]?.authCode, { value: txn?.AUTH_CODE || txn?.authCode });
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
    const lastNDigits = (cardNumberLength % nCardNumber === 0) ? response?.blockCode.cardNumber.slice(-nCardNumber) : response?.blockCode.cardNumber.slice(-(cardNumberLength % nCardNumber));
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
    globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_cardfacia, { value: urlPath(response.cardTypePath) });
    const imageEl = document.querySelector('.field-aem-cardfacia > picture');
    const imagePath = `${urlPath(response.cardTypePath)}?width=2000&optimize=medium`;
    imageEl?.childNodes[5].setAttribute('src', imagePath);
    imageEl?.childNodes[3].setAttribute('srcset', imagePath);
    imageEl?.childNodes[1].setAttribute('srcset', imagePath);
  };

  const DELAY = 100;
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
      }
    });
    console.log('txnsData: ', txnsData);
    return txnsData
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
    if (!isNodeEnv) {
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
   * calls function to add styling to completed steppers
   *
   * @function changeWizardView
   * @returns {void}
   */
  const changeWizardView = () => {
    if (isNodeEnv) return;
    const completedStep = document.querySelector('.field-aem-semiwizard .wizard-menu-items .wizard-menu-active-item');
    completedStep.classList.add('wizard-completed-item');
  };

  /**
  * @param {resPayload} Object - checkEligibility response.
  * @param {object} globals - global object
  * @return {PROMISE}
  */
  // eslint-disable-next-line no-unused-vars
  function checkELigibilityHandler(resPayload1, globals) {
    // const resPayload = RESPONSE_PAYLOAD.response;
    const resPayload = resPayload1;
    const response = {};
    try {
      /* billed txn maximum amount select limt */
      currentFormContext.billedMaxSelect = ((parseFloat(resPayload.blockCode.tad) / 100) - (parseFloat(resPayload.blockCode.mad) / 100));
      /* continue btn disabling code added temorary, can be removed after form authoring */
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
      let ccBilledData = resPayload?.ccBilledTxnResponse?.responseString || [];
      let ccUnBilledData = resPayload?.ccUnBilledTxnResponse?.responseString || [];
      if (isNodeEnv) {
        ccBilledData = resPayload?.ccBilledTxnResponse || [];
        if(ccBilledData.length === 0) {
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
      currentFormContext.EligibilityResponse = resPayload;
      globals.functions.setProperty(globals.form.runtime.currentFormContext, { value: JSON.stringify({ ...currentFormContext }) });
      const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
      const unBilledTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
      const allTxn = ccBilledData.concat(ccUnBilledData);
      setTxnPanelData(allTxn, ccBilledData.length, ccUnBilledData.length, billedTxnPanel, unBilledTxnPanel, globals);
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_eligibleTxnLabel, { value: `Eligible Transactions (${allTxn?.length})` });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_TxnAvailable, { value: `Billed Transaction (${ccBilledData?.length})` });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_txnHeaderPanel.aem_TxnAvailable, { value: `Unbilled Transaction (${ccUnBilledData?.length})` });
      // set runtime values
      globals.functions.setProperty(globals.form.runtime.originAcct, { value: currentFormContext.EligibilityResponse.responseString.aanNumber });
      changeWizardView();
      // Display card and move wizard view
      if (!isNodeEnv) {
        cardDisplay(globals, resPayload);
        moveWizardView(domElements.semiWizard, domElements.chooseTransaction);
      }
      response.nextscreen = 'success';
      // show txn summery text value
      if ((resPayload?.ccBilledTxnResponse?.responseString.length) || (resPayload?.ccUnBilledTxnResponse?.responseString.length)) {
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnsSummaryText, { visible: true });
      }
      // hide the unbilled / unbillled accordian if the response payload of txn is not present
      if (resPayload?.ccBilledTxnResponse?.responseString.length === 0) {
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment, { visible: false });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList, { visible: false });
      }
      if (resPayload?.ccUnBilledTxnResponse?.responseString?.length === 0) {
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
        processingFee: responseStringJsonObj[0].memoLine1
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
    /* display amount */
    if(!isNodeEnv) {
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
    if (!isNodeEnv && (tnxPopupAlertOnce === 1)) { // option of selecting ten txn alert should be occured only once.
      const MSG = 'Great news! You can enjoy the flexibility of converting up to 10 transactions into EMI.';
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: MSG });
    } else {
      if(!isNodeEnv) {
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
    mapSortedDat?.forEach((_data, i) => {
      const data = {
        ..._data,
        type: txnType,
      };
      setData(globals, pannel, data, i);
    });
    setTimeout(() => {
      isUserSelection = !isUserSelection;
    }, 1000);
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

    const currentFormContext = getCurrentFormContext(globals);
    const billedTxnList = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const unbilledTxnList = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;

    // In case of Web only billed transaction is displayed on billedTxn panel but in whatsapp both billed and unbilled are displayed
    const selectedTransactionsBilledPanel = globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection.filter((el) => {
      if(isNodeEnv) {
        return el.aem_Txn_checkBox && el.aem_txn_type === "billed";
      }
      return aem_Txn_checkBox;
    });
    const totalSelectBilledTxnAmt = selectedTransactionsBilledPanel.map((el) => (Number((String(el?.aem_TxnAmt))?.replace(/[^\d]/g, '')) / 100)).reduce((prev, acc) => prev + acc, 0);
    if (totalSelectBilledTxnAmt) {

      /* popup alert hanldles */
      if (totalSelectBilledTxnAmt > currentFormContext.billedMaxSelect) {
        const SELECTED_MAX_BILL = ` Please select Billed Transactions Amount Max up to Rs.${nfObject.format(currentFormContext.billedMaxSelect)}`;
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: SELECTED_MAX_BILL });
        globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
        /* disabling selected fields in case disabled */
        disableAllTxnFields(unbilledTxnList, globals);
        disableAllTxnFields(billedTxnList, globals);
        // display error message in whatsapp flow
        customDispatchEvent('showErrorSnackbar', { errorMessage: SELECTED_MAX_BILL }, globals);
        return;
      }
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: true });
    }

    /* enable alert message if the user exceed selecting the txn above 10 laksh. */
    const totalSelectTxnAmt = getTotalAmount(globals);
    const emiProceedCheck = (totalSelectTxnAmt <= currentFormContext.txnSelectExceedLimit);
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
    const MAX_SELECT = 10;
    const BILLED_FRAG = 'billedTxnFragment';
    const UNBILLED_FRAG = 'unbilledTxnFragment';
    const TXN_FRAG = txnType === 'BILLED' ? BILLED_FRAG : UNBILLED_FRAG;

    const txnList = globals.form.aem_semiWizard.aem_chooseTransactions?.[`${TXN_FRAG}`].aem_chooseTransactions.aem_TxnsList;
    const txnSelected = globals.form.aem_semiWizard.aem_chooseTransactions?.[`${TXN_FRAG}`].aem_chooseTransactions.aem_txnHeaderPanel.aem_txnSelected;
    const selectedList = txnList?.filter((el) => (el.aem_Txn_checkBox.$value === 'on'));
    const SELECTED = `${selectedList?.length} Selected`;
    globals.functions.setProperty(txnSelected, { value: SELECTED }); // set number of select in billed or unbilled txn list
    if ((checkboxVal === 'on') && ((txnType === 'BILLED') || (txnType === 'UNBILLED'))) {
      currentFormContext.totalSelect += 1;
    } else if ((currentFormContext.totalSelect > 0)) {
      currentFormContext.totalSelect -= 1;
    }
    const TOTAL_SELECT = `Total selected ${currentFormContext.totalSelect}/${MAX_SELECT}`;

    if ((currentFormContext.totalSelect <= MAX_SELECT)) {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_transactionsInfoPanel.aem_TotalSelectedTxt, { value: TOTAL_SELECT });// total no of select billed or unbilled txn list
    }

    if (currentFormContext.totalSelect < MAX_SELECT) {
      /* enabling selected fields in case disabled */
      enableAllTxnFields(unbilledTxnList, globals);
      enableAllTxnFields(billedTxnList, globals);
    }
    if ((currentFormContext.totalSelect === MAX_SELECT)) {
      /* popup alert hanldles */
      const CONFIRM_TXT = 'You can select up to 10 transactions at a time, but you can repeat the process to convert more transactions into SmartEMI.';
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup, { visible: true });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation, { value: CONFIRM_TXT });
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txtSelectionPopupWrapper.aem_txtSelectionPopup.aem_txtSelectionConfirmation1, { visible: true });
      /* disabling unselected checkBoxes */
      disableCheckBoxes(unbilledTxnList, false, globals);
      disableCheckBoxes(billedTxnList, false, globals);
    }
    /* enable disable select-tenure continue button */
    if ((currentFormContext.totalSelect === 0) || (!emiProceedCheck)) {
      globals.functions.setProperty(globals.form.aem_semiWizard.aem_chooseTransactions.aem_txnSelectionContinue, { enabled: false });
    } else if ((currentFormContext.totalSelect > 0) || (emiProceedCheck)) {
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
    return (!isNodeEnv) && moveWizardView(source, target);
  };

  /**
   * select top txnlist
  * @param {object} globals - global object
   */
  function selectTopTxn(globals) {
    selectTopTenFlag = !selectTopTenFlag;
    const SELECT_TOP_TXN_LIMIT = 10;
    const resPayload = currentFormContext.EligibilityResponse;
    const billedResData = resPayload?.ccBilledTxnResponse?.responseString;
    const unBilledResData = resPayload?.ccUnBilledTxnResponse?.responseString;
    const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const unBilledTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const billed = billedResData?.length ? globals.functions.exportData().smartemi.aem_billedTxn.aem_billedTxnSelection : [];
    const unBilled = unBilledResData?.length ? globals.functions.exportData().smartemi.aem_unbilledTxn.aem_unbilledTxnSection : [];
    const allTxn = billed.concat(unBilled);
    const sortedArr = sortDataByAmountSymbol(allTxn);
    const txnAvailableToSelect = (allTxn?.length >= SELECT_TOP_TXN_LIMIT) ? SELECT_TOP_TXN_LIMIT : allTxn?.length;
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
        findAllAmtMatch?.forEach((matchedAmt) => globals.functions.setProperty(matchedAmt.aem_Txn_checkBox, { value: 'on', enabled: true }));
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
          globals.functions.setProperty(globals.form.aem_semiWizard.aem_selectTenure.reviewDetailsView.aem_monthlyEmi, { value: tenureData[i].aem_tenureSelectionEmi + ` @ ${roiMonthly}` });
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
    const loanAmountInInr = `${nfObject.format(loanAmount/100)}`;
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
    console.log('selectedTenurePlan', selectedTenurePlan);
    const emiSubData = JSON.parse(selectedTenurePlan?.aem_tenureRawData);
    const PROC_FEES = String(currencyStrToNum(selectedTenurePlan?.aem_tenureSelectionProcessing));
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
        procFeeWav: PROC_FEES,
        reqNbr: REQ_NBR,
        emiConversion: emiConversionArray,
        journeyID: currentFormContext.journeyID,
        journeyName: currentFormContext.journeyName,
        ...(!isNodeEnv && { userAgent: window.navigator.userAgent }),
      },
    };
    const path = semiEndpoints.ccSmartEmi;
    if (!isNodeEnv) displayLoader$1();
    // For whatsapp flow visibility controlled via custom property so need to ensure on resend/submit button click property is updated.
    handleResendOtp2VisibilityInFlow(globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2.aem_resendOtpCount2.$value, globals); 
    return fetchJsonResponse(path, jsonObj, 'POST', !isNodeEnv);
  };

  /**
   * otp timer logic to handle based on the screen of otp
   * @param {string} - otp pannel - firstotp or secondotp
   * @param {object} globals - global form object
   */
  const otpTimerV1 = (pannelName, globals) => {
    if(isNodeEnv) return;
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
      if(isNodeEnv) {
        panelOtp.resendOtpCountField = otp2.aem_resendOtpCount2;
        panelOtp.limitCheck =  otp2.aem_resendOtpCount2.$value < DATA_LIMITS.maxOtpResendLimit;
        panelOtp.resendOtpCount = otp2.aem_resendOtpCount2.$value + 1;
      }
    }
    const mobileNumber = globals.form.aem_semiWizard.aem_identifierPanel.aem_loginPanel.mobilePanel.aem_mobileNum.$value;
    const cardDigits = globals.form.aem_semiWizard.aem_identifierPanel.aem_loginPanel.aem_cardNo.$value;
    if(panelOtp.resendOtpCountField) {
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
        if(pannelName === SECOND_PANNEL_OTP) {
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

  const handleResendOtp2VisibilityInFlow = (resendOtpCount, globals) => {
    if(!isNodeEnv) return;
    const otpPanel = globals.form.aem_semiWizard.aem_selectTenure.aem_otpPanelConfirmation.aem_otpPanel2;
    if(resendOtpCount >= DATA_LIMITS.maxOtpResendLimit) {
      const properties = otpPanel.aem_otpResend2.$properties;
      globals.functions.setProperty(otpPanel.aem_otpResend2, { properties: {...properties, "flow:setVisible": false} });
    }
  };

  /**
   * on click of t&c navigation, open Url in new tab
   */
  const tAndCNavigation = () => {
    const TNC_LINK = 'https://www.hdfcbank.com/personal/borrow/loan-against-assets/smartemi';
    if (window !== undefined) {
      window.open(TNC_LINK, '_blank');
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
    if(isNodeEnv && payload?.errorCode) {
      if(FLOWS_ERROR_MESSAGES[payload.errorCode]) {
        evtPayload = { ...evtPayload, errorMsg: FLOWS_ERROR_MESSAGES[payload.errorCode] };
      }
    }
    globals.functions.dispatchEvent(globals.form, `custom:${eventName}`, evtPayload);
  }

  exports.assistedToggleHandler = assistedToggleHandler;
  exports.branchHandler = branchHandler;
  exports.changeCheckboxToToggle = changeCheckboxToToggle;
  exports.changeWizardView = changeWizardView;
  exports.channelDDHandler = channelDDHandler;
  exports.checkELigibilityHandler = checkELigibilityHandler;
  exports.customDispatchEvent = customDispatchEvent;
  exports.dsaHandler = dsaHandler;
  exports.getCCSmartEmi = getCCSmartEmi;
  exports.getFlowSuccessPayload = getFlowSuccessPayload;
  exports.getOTPV1 = getOTPV1;
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
  exports.sortData = sortData;
  exports.tAndCNavigation = tAndCNavigation;
  exports.txnSelectHandler = txnSelectHandler;

  return exports;

})({});
