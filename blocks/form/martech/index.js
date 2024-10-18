import { toClassName } from '../../../scripts/aem.js';
import { jsonFormula } from '../rules/formula/index.js';
import { getAudiences, getXDMMappedData, initWebSDK } from './event.js';
import * as module from '../functions.js';

// TODO - Store it in form definition or fix it
export function getAudienceAttribute() {
  const { location } = window;
  if (location.pathname.includes('cc-ajo')) return 'dropdown-ecb9e5982c';
  if (location.pathname.includes('cc-native')) return 'dropdown-fa1f1bb82a';
  return 'dropdown-69f3908846';
}

const audiences = {
  mobile: () => window.innerWidth < 600,
  desktop: () => window.innerWidth >= 600,
  // define your custom audiences here as needed
};

export const DEFAULT_OPTIONS = {
  audiencesDataAttribute: '__audience__',
  audiencesMetaTagPrefix: 'audience',
  audiencesQueryParameter: 'audience',
};

const config = {
  clickCollectionEnabled: false,
  debugEnabled: false,
  defaultConsent: 'in',
  datastreamId: 'ee3630bf-3ae2-4a23-991f-a2e63e615864',
  orgId: '5A4521B65E37CAFC0A495FA6@AdobeOrg',
};

const alloyLoadedPromise = initWebSDK('../../../scripts/alloy.js', config); // load only when personalization is enbaled

function getAudienceFromUrl() {
  const usp = new URLSearchParams(window.location.search);
  const forcedAudience = usp.has(DEFAULT_OPTIONS.audiencesQueryParameter)
    ? toClassName(usp.get(DEFAULT_OPTIONS.audiencesQueryParameter))
    : null;
  return forcedAudience;
}

const functions = [];
let nativeAudiences = [];
const xdmData = {
};

// eslint-disable-next-line no-unused-vars
function resolveSegments() {
  nativeAudiences = [];
  const promises = Object.keys(audiences).reduce((acc, key) => {
    if (audiences[key] && typeof audiences[key] === 'function') {
      if (audiences[key]()) {
        acc.push(key);
      }
    }
    return acc;
  }, nativeAudiences);
  return promises;
}

function getCustomFunctions() {
  const keys = Object.keys(module);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < keys.length; i++) {
    const name = keys[i];
    const funcDef = module[keys[i]];
    if (typeof funcDef === 'function') {
      functions[name] = { _signature: [], _func: funcDef };
    }
  }
}

function resolveFormSegments(formSegments) {
  const { innerWidth: width, innerHeight: height } = window;
  const parameters = new URLSearchParams(window.location.search);
  const queryData = Object.fromEntries(parameters.entries());
  const data = { width, height, ...queryData };
  nativeAudiences = [];
  const promises = formSegments?.reduce((acc, { name, expr }) => {
    const result = jsonFormula(data, {}, expr, functions);
    if (result) {
      acc.push(name);
    }
    return acc;
  }, nativeAudiences);
  return promises;
}

export async function getAudienceAndOffers(formSegments) {
  if (!audiences || !Object.keys(audiences).length) {
    return null;
  }
  // If we have a forced audience set in the query parameters (typically for simulation purposes)
  // we check if it is applicable
  const forcedAudience = getAudienceFromUrl();
  if (forcedAudience) {
    return forcedAudience;
  }

  // const promises = resolveSegments();
  const formSegmentsPromises = resolveFormSegments(formSegments);
  await alloyLoadedPromise;
  await Promise.all([formSegmentsPromises, alloyLoadedPromise]);
  const xdm = {}; // { _formsinternal01: { pseudoID: '9876543890' } };
  const { segmentIds, offers } = await getAudiences(xdm, {});
  return { audiences: [...nativeAudiences, ...segmentIds], offers };
}

export async function refreshAudiencesAndOffers(key, value) {
  const xdm = getXDMMappedData(key, value, xdmData);
  const { segmentIds, offers } = await getAudiences(xdm, {});
  return { audiences: [...nativeAudiences, ...segmentIds], offers };
}

getCustomFunctions();
