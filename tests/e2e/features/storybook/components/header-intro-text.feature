@storybook @components
Feature: HeaderIntroText component — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for header intro text

  Scenario: Default header intro text renders the provided content
    When I load the Storybook story "components-headerintrotext--default"
    Then the story iframe should contain "Use this portal to submit and manage your service requests."

  Scenario: Header intro text with custom class renders the provided content
    When I load the Storybook story "components-headerintrotext--with-class"
    Then the story iframe should contain "This guide explains account setup and access management."
