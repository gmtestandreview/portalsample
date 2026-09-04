@storybook @dependency-security
Feature: Storybook MCP dependency compatibility

  Scenario: MCP initializes and exposes the configured toolsets
    Given the Storybook MCP server is running
    Then the Storybook MCP endpoint should initialize and list configured tools
