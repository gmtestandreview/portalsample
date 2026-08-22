@storybook @components
Feature: Breadcrumb component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for breadcrumbs

  Scenario: Three-level breadcrumb renders all levels including the deepest item
    When I load the Storybook story "components-breadcrumb--three-levels"
    Then the story iframe should contain "Home"
    And the story iframe should contain "Dashboard"
    And the story iframe should contain "Request for quote"

  Scenario: Two-level breadcrumb renders both items
    When I load the Storybook story "components-breadcrumb--two-levels"
    Then the story iframe should contain "Home"
    And the story iframe should contain "Help guide"
