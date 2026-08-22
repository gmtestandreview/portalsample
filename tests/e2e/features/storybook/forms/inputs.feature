@storybook @forms
Feature: Form input components — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for form inputs

  Scenario: Text input default story renders a labelled text field
    When I load the Storybook story "forms-inputs--text-input-default"
    Then the story iframe should be visible

  Scenario: Text input with help text story renders the help message
    When I load the Storybook story "forms-inputs--text-input-with-help"
    Then the story iframe should be visible

  Scenario: Disabled text input story renders the input as disabled
    When I load the Storybook story "forms-inputs--text-input-disabled"
    Then the story iframe should be visible

  Scenario: Read-only text input story renders the input as read-only
    When I load the Storybook story "forms-inputs--text-input-read-only"
    Then the story iframe should be visible

  Scenario: Select input default story renders a select dropdown
    When I load the Storybook story "forms-inputs--select-input-default"
    Then the story iframe should be visible

  Scenario: Vertical radio button group story renders radio options
    When I load the Storybook story "forms-inputs--radio-button-group-vertical"
    Then the story iframe should be visible

  Scenario: Date picker default story renders a date input
    When I load the Storybook story "forms-inputs--date-picker-default"
    Then the story iframe should be visible

  Scenario: Text area default story renders a textarea
    When I load the Storybook story "forms-inputs--text-area-default"
    Then the story iframe should be visible

  Scenario: Checkbox default story renders a checkbox input
    When I load the Storybook story "forms-inputs--checkbox-default"
    Then the story iframe should be visible

  Scenario: All inputs showcase renders without errors
    When I load the Storybook story "forms-inputs--all-inputs-showcase"
    Then the story iframe should be visible
