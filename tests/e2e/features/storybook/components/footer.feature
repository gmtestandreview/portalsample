@storybook @components
Feature: Footer component — Storybook acceptance criteria

  Scenario: Default footer renders with footer content and policy links
    When I load the Storybook story "components-footer--default"
    Then the story iframe should have a content info landmark
    And the story iframe should have a button with accessible name "Terms of use"
    And the story iframe should have a button with accessible name "Privacy"
    And the story iframe should have a button with accessible name "Accessibility"
    And the story iframe should have a link with accessible name "Help guide"

  Scenario: Terms of use link opens the terms modal
    When I load the Storybook story "components-footer--default"
    And I click the button with accessible name "Terms of use" in the story iframe
    Then the Storybook portal should contain "Portal Terms of Use"
    And the Storybook portal should contain "1. General"

  Scenario: Privacy link opens the privacy modal
    When I load the Storybook story "components-footer--default"
    And I click the button with accessible name "Privacy" in the story iframe
    Then the Storybook portal should contain "Privacy collection statement"
    And the Storybook portal should contain "The Privacy Act and your personal information"

  Scenario: Accessibility link opens the accessibility modal
    When I load the Storybook story "components-footer--default"
    And I click the button with accessible name "Accessibility" in the story iframe
    Then the Storybook portal should contain "Accessibility"
    And the Storybook portal should contain "We are committed to providing websites that are accessible to everyone."
