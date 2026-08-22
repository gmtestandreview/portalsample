@storybook @components
Feature: SearchFilter component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for search filter

  Scenario: Dashboard search filter renders a search input
    When I load the Storybook story "components-searchfilter--dashboard-filters"
    Then the story iframe should have a text input for searching
