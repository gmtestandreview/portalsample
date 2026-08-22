@storybook @components
Feature: Alert component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for alerts

  Scenario: Info alert renders with informational text
    When I load the Storybook story "components-alert--info"
    Then the story iframe should contain "This is informational guidance for users."

  Scenario: Success alert renders with success message
    When I load the Storybook story "components-alert--success"
    Then the story iframe should contain "Saved successfully."

  Scenario: Warning alert renders with warning message
    When I load the Storybook story "components-alert--warning"
    Then the story iframe should contain "Please review this warning before you continue."

  Scenario: Error alert renders with error message and a close button
    When I load the Storybook story "components-alert--error-dismissible"
    Then the story iframe should contain "Something went wrong. Try again shortly."
    And the story iframe should have a button with accessible name "Close"

  Scenario: Dismissible error alert can be closed
    When I load the Storybook story "components-alert--error-dismissible"
    And I click the button with accessible name "Close" in the story iframe
    Then the story should not throw a JavaScript error
