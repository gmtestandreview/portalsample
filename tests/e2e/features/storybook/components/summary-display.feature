@storybook @components
Feature: SummaryDisplay component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for summary display

  Scenario: Text value summary displays label and value
    When I load the Storybook story "components-summarydisplay--text-value"
    Then the story iframe should contain "Organisation name"
    And the story iframe should contain "Storybook Organisation"

  Scenario: Phone value summary displays label and phone number
    When I load the Storybook story "components-summarydisplay--phone-value"
    Then the story iframe should contain "Business phone"
    And the story iframe should contain "02 6213 6800"

  Scenario: Formatted number summary displays label and formatted ABN
    When I load the Storybook story "components-summarydisplay--formatted-number"
    Then the story iframe should contain "ABN"
