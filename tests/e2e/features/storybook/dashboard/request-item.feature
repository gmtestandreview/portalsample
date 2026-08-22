@storybook @dashboard
Feature: Dashboard RequestItem component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for dashboard request items

  Scenario: Draft request item renders with reference ID and status
    When I load the Storybook story "dashboard-requestitem--draft-request"
    Then the story iframe should contain "RFQ-2024-001234"
    And the story iframe should contain "Fluke"

  Scenario: Quote available request item renders with quote status
    When I load the Storybook story "dashboard-requestitem--quote-available"
    Then the story iframe should be visible

  Scenario: Report issued request item renders correctly
    When I load the Storybook story "dashboard-requestitem--report-issued"
    Then the story iframe should be visible

  Scenario: All request states story renders all status variants
    When I load the Storybook story "dashboard-requestitem--all-request-states"
    Then the story iframe should be visible
