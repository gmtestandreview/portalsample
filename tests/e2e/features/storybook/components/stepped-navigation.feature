@storybook @components
Feature: SteppedNavigation component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for stepped navigation

  Scenario: Stepped navigation renders all step titles
    When I load the Storybook story "components-steppednavigation--current-step"
    Then the story iframe should contain "Organisation and contact"
    And the story iframe should contain "Instrument and request"
    And the story iframe should contain "Review and submit"
