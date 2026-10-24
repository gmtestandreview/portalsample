@storybook @dependency-security
Feature: Storybook MCP dependency compatibility

  Scenario: MCP initializes and exposes the configured toolsets
    Given the Storybook MCP server is running
    Then the Storybook MCP endpoint should initialize and list configured tools

  @mcp-execution
  Scenario: MCP test-run reports exact passing stories and no listed accessibility violations
    Given the Storybook MCP server is running
    When I execute the native MCP test-run for stories "components-searchfilter-searchbox--type-and-submit,components-progress-progressfilelist--cancel-invokes-callback"
    Then the native MCP report should list exact passing stories without accessibility violations
