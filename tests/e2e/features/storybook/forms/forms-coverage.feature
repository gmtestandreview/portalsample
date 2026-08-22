@storybook @forms
Feature: Form storybook coverage

  Scenario: Common field set story renders the form section labels
    When I load the Storybook story "components-inputs--common-field-set"
    Then the story iframe should contain "Organisation name"
    And the story iframe should contain "Testing/calibration requirements"

  Scenario: Text input default story renders the input label
    When I load the Storybook story "forms-inputs--text-input-default"
    Then the story iframe should contain "Organisation name"

  Scenario: Text input with help story renders the help text
    When I load the Storybook story "forms-inputs--text-input-with-help"
    Then the story iframe should contain "Your 11-digit Australian Business Number as registered with the ATO."

  Scenario: Text input with expandable help story renders the helper disclosure title
    When I load the Storybook story "forms-inputs--text-input-with-expandable-help"
    Then the story iframe should contain "Where to find the serial number"

  Scenario: Disabled text input story renders the disabled field
    When I load the Storybook story "forms-inputs--text-input-disabled"
    Then the story iframe should contain "Email address"

  Scenario: Read-only text input story renders the read-only field
    When I load the Storybook story "forms-inputs--text-input-read-only"
    Then the story iframe should contain "Reference ID"

  Scenario: Select input default story renders the select label
    When I load the Storybook story "forms-inputs--select-input-default"
    Then the story iframe should contain "State or territory"

  Scenario: Select input horizontal story renders the horizontal select label
    When I load the Storybook story "forms-inputs--select-input-horizontal"
    Then the story iframe should contain "State or territory"

  Scenario: Vertical radio group story renders the question text
    When I load the Storybook story "forms-inputs--radio-button-group-vertical"
    Then the story iframe should contain "Are you submitting an instrument for calibration?"

  Scenario: Horizontal radio group story renders the question text
    When I load the Storybook story "forms-inputs--radio-button-group-horizontal"
    Then the story iframe should contain "Are you submitting an instrument for calibration?"

  Scenario: Date picker default story renders the label
    When I load the Storybook story "forms-inputs--date-picker-default"
    Then the story iframe should contain "Date required"

  Scenario: Text area default story renders the label
    When I load the Storybook story "forms-inputs--text-area-default"
    Then the story iframe should contain "Description"

  Scenario: Checkbox default story renders and toggles the checkbox
    When I load the Storybook story "forms-inputs--checkbox-default"
    Then the story iframe should be visible

  Scenario: All inputs showcase story renders the showcase heading
    When I load the Storybook story "forms-inputs--all-inputs-showcase"
    Then the story iframe should contain "Form input primitives"