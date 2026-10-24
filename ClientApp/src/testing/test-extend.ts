import { test as testBase } from 'vitest';
import { network } from 'virtual:msw';
import { mswHandlers as handlers } from '../../../.storybook/msw-handlers';

export const test = testBase.extend({
  msw: [
    async ({}, use) => {
      // Configure and start the browser service worker before each test runs
      network.configure({
        handlers,
      });
      await network.enable();

      // Expose the network object to the test context
      await use(network);

      // Automatically strip runtime overrides out so they don't leak to other tests
      network.resetHandlers();
    },
    { auto: true }, // Applies this fixture automatically to all tests using this file
  ],
});
