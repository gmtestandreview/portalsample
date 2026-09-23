import { test as base, createBdd } from 'playwright-bdd';
import { createScenarioState, type ScenarioState } from './scenario-state.ts';

export const test = base.extend<{ scenarioState: ScenarioState }>({
  // playwright-bdd requires fixture callbacks to use an object destructuring parameter.
  // eslint-disable-next-line no-empty-pattern
  // biome-ignore lint/correctness/noEmptyPattern: playwright-bdd requires fixture callbacks to use an object destructuring parameter.
  scenarioState: async ({}, applyScenarioState) => {
    await applyScenarioState(createScenarioState());
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);
