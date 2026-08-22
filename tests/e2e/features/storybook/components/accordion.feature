@storybook @components
Feature: Accordion component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for the accordion

  Scenario: Single-section accordion renders the section heading
    When I load the Storybook story "components-accordion--single-section"
    Then the story iframe should contain "Quote request details"

  Scenario: Accordion with sub-heading renders both heading lines
    When I load the Storybook story "components-accordion--with-sub-heading"
    Then the story iframe should contain "Contact details"
    And the story iframe should contain "Complete all required fields"
