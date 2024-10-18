import {
  validateLogin,
  otpTimer,
  maskedMobNum,
  getOTP,
  otpValidation,
  resendOTP,
  customSetFocus,
  reloadPage,
} from './fdlien-functions.js';
// import { getOTP, otpValidation } from '../../common/functions.js'; // improvisation required to make it generic, till then using the journey specific function getotp,otpVal 👆
import { redirect } from '../../common/functions.js';
import {
  createJourneyId,
  getCurrentContext,
  invokeJourneyDropOff,
  invokeJourneyDropOffByParam,
  invokeJourneyDropOffUpdate,
  journeyResponseHandlerUtil,
} from '../../common/journey-utils.js';

import {
  addGaps,
  addMobileValidation,
} from './fd-dom-functions.js';

export {
  getOTP,
  otpTimer,
  otpValidation,
  validateLogin,
  createJourneyId,
  getCurrentContext,
  invokeJourneyDropOff,
  invokeJourneyDropOffByParam,
  invokeJourneyDropOffUpdate,
  journeyResponseHandlerUtil,
  maskedMobNum,
  addGaps,
  addMobileValidation,
  redirect,
  resendOTP,
  customSetFocus,
  reloadPage,
};
