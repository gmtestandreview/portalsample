@storybook @dependency-security
Feature: Storybook MCP dependency compatibility

  Scenario: MCP initializes and exposes the configured toolsets
    Given the Storybook MCP server is running
    Then the Storybook MCP endpoint should initialize and list configured tools

  @mcp-execution
  Scenario: MCP test-run returns exact component and accessibility evidence
    Given the Storybook MCP server is running
    When I execute the native MCP test-run for stories "components-searchfilter-searchbox--type-and-submit,components-progress-progressfilelist--cancel-invokes-callback"
    Then the native MCP receipt should contain exact component and a11y results
