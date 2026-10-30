@storybook @routes
Feature: Route harness
  Scenario: A story destination consumes the returned route parameter
    When I load the Storybook story "components-buttons-breadth--edit-section"
    Then the story iframe should contain "Editing request 123 organisation and contact"

  Scenario: Generated Docs keeps overlapping request handlers isolated
    Given Storybook is running
    And the Storybook sequence is monitored for late unmount updates
    When I exercise overlapping request story frames on the generated AcceptQuote documentation page
    Then the generated Docs isolation probe should pass
