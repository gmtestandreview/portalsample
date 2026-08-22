@storybook @components
Feature: Pill (status badge) components — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for pill status badges

  Scenario: Dashboard status pills render all request lifecycle states
    When I load the Storybook story "components-pill--dashboard-statuses"
    Then the story iframe should contain text matching a dashboard status label

  Scenario: Quote status pills render all quote lifecycle states
    When I load the Storybook story "components-pill--quote-statuses"
    Then the story iframe should contain text matching a quote status label
