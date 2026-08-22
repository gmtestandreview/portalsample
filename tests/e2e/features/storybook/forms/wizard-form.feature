@storybook @forms
Feature: WizardForm component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for the wizard form

  Scenario: Step 1 contact details story renders the first form step
    When I load the Storybook story "forms-wizardform--step-1-contact-details"
    Then the story iframe should be visible

  Scenario: Step 2 with previous completed story renders the second step correctly
    When I load the Storybook story "forms-wizardform--step-2-with-previous-completed"
    Then the story iframe should be visible

  Scenario: Three-step summary page story renders the summary view
    When I load the Storybook story "forms-wizardform--three-step-summary-page"
    Then the story iframe should be visible
