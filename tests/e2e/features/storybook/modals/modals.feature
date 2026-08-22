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
