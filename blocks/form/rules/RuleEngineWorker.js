import { createFormInstanceAsync } from './model/afb-runtime.js';
import registerCustomFunctions from './functionRegistration.js';

let customFunctionRegistered = false;

export default class RuleEngine {
  rulesOrder = {};

  async createFormInstance(formDef) {
    this.form = await createFormInstanceAsync(formDef);
  }

  getState() {
    return this.form.getState(true);
  }

  getFieldChanges() {
    return this.fieldChanges;
  }
}

let ruleEngine;
onmessage = (e) => {
  async function handleMessageEvent(event) {
    switch (event.data.name) {
      case 'init':
        ruleEngine = new RuleEngine();
        await ruleEngine.createFormInstance(event.data.payload);
        // eslint-disable-next-line no-case-declarations
        const state = ruleEngine.getState();
        postMessage({
          name: 'init',
          payload: state,
        });
        ruleEngine.dispatch = (msg) => {
          postMessage(msg);
        };
        break;
      default:
        break;
    }
  }

  if (!customFunctionRegistered) {
    const { id } = e.data.payload;
    registerCustomFunctions(id).then(async () => {
      customFunctionRegistered = true;
      await handleMessageEvent(e);
    });
  }
};