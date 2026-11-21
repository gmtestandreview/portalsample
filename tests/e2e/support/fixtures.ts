import { createBdd, test as base } from 'playwright-bdd';
import { createScenarioState, type ScenarioState } from './scenario-state';

export const test = base.extend<{ scenarioState: ScenarioState }>({
  // playwright-bdd requires fixture callbacks to use an object destructuring parameter.
  scenarioState: async ({ baseURL }, applyScenarioState) => {
    String(baseURL);
    await applyScenarioState(createScenarioState());
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);
