@storybook @documentation
Feature: Storybook documentation architecture

  Scenario: Generated component documentation is available
    Given Storybook is running
    When I open a representative component documentation page
    Then the component documentation page is visible
    And the component API documentation is visible
    And the component stories are visible

  Scenario: Story source is available from generated documentation
    Given Storybook is running
    When I open a representative component documentation page
    Then a Storybook source example is available
    And Storybook decorators are not included in the displayed source

  Scenario: Code Panel is available for an individual story
    Given Storybook is running
    When I open a representative component story
    Then the Storybook Code Panel is available
    And the Code Panel contains source for the current story

  Scenario: Standalone MDX documentation renders
    Given Storybook is running
    When I open the Documentation Style Guide
    Then the Style Guide is visible
    And its typography documentation is visible
    And its colour documentation is visible
    And its Markdown table is rendered

  Scenario: Documentation navigation includes the project guides
    Given Storybook is running
    Then Documentation Getting Started is available
    And Documentation Component Documentation Guide is available
    And Documentation Style Guide is available
