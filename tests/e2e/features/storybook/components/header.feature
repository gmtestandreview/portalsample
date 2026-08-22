@storybook @components
Feature: Header component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for the site header

  Scenario: Authenticated header renders the site navigation
    When I load the Storybook story "components-header--authenticated"
    Then the story iframe should have a navigation landmark

  Scenario: Public header renders without authenticated user navigation
    When I load the Storybook story "components-header--public"
    Then the story iframe should have a navigation landmark
