@storybook @modals
Feature: Modal components — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for modals

  Scenario: Open confirmation modal renders with visible dialog
    When I load the Storybook story "modals--confirmation-open"
    Then the story iframe should be visible

  Scenario: Closed confirmation modal story renders without an open dialog
    When I load the Storybook story "modals--confirmation-closed"
    Then the story iframe should be visible

  Scenario: RFQ delete confirmation modal renders correctly
    When I load the Storybook story "modals--rfq-delete-confirmation"
    Then the story iframe should be visible

  Scenario: Indirect evidence isolation
    Given the Storybook sequence is monitored for late unmount updates
    When I load the Storybook story "modals--branch-selector-select-and-edit"
    Then the Storybook manager should remain mounted
    Then the story iframe should have a dialog with accessible name "Manage your branch or location"
    And the selected Storybook radio should be "ACME Sydney Office"
    And the Storybook story should report 1 organisation lookup
    When I load the Storybook story "modals--rfq-delete-confirmation"
    Then the Storybook manager should remain mounted
    Then the story iframe should have a dialog with accessible name "Confirm deletion"
    And the Storybook dialog named "Manage your branch or location" should not be present
    When I load the Storybook story "modals--branch-selector-select-and-edit"
    Then the Storybook manager should remain mounted
    Then the story iframe should have a dialog with accessible name "Manage your branch or location"
    And the selected Storybook radio should be "ACME Sydney Office"
    And the Storybook story should report 1 organisation lookup
    And the Storybook dialog named "Confirm deletion" should not be present
    And the Storybook sequence should have no late unmount updates
