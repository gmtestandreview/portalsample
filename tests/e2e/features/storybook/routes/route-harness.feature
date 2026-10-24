@storybook @routes
Feature: Route harness
  Scenario: A story destination consumes the returned route parameter
    When I load the Storybook story "components-buttons-breadth--edit-section"
    Then the story iframe should contain "Editing request 123 organisation and contact"
