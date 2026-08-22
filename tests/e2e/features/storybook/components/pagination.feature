@storybook @components
Feature: Pagination component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for pagination

  Scenario: Mid-range pagination renders page navigation buttons
    When I load the Storybook story "components-pagination--mid-range"
    Then the story iframe should contain "Page 6 of 12"
    And the story iframe should have a navigation landmark

  Scenario: Single-page pagination hides navigation when only one page exists
    When I load the Storybook story "components-pagination--single-page-hidden"
    Then the story iframe should not show pagination controls
