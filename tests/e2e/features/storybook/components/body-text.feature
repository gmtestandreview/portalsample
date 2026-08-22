@storybook @components
Feature: BodyText component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for body text

  Scenario: Default body text renders the provided content
    When I load the Storybook story "components-bodytext--default"
    Then the story iframe should contain "This service helps organisations manage calibration and measurement requests."

  Scenario: Emphasised body text renders with the provided content
    When I load the Storybook story "components-bodytext--emphasis"
    Then the story iframe should contain "Read this guidance before continuing to the next step."
