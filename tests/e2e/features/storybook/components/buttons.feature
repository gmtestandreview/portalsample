@storybook @components
Feature: Button components — Storybook acceptance criteria

  Background:
    Given I am viewing Storybook stories for buttons

  # ── PrimaryButton ──────────────────────────────────────────────────────────

  Scenario: Primary button renders with default label
    When I load the Storybook story "components-buttons-primarybutton--default"
    Then the story iframe should have a button with accessible name "Submit"

  Scenario: Primary button renders in dark mode with label
    When I load the Storybook story "components-buttons-primarybutton--dark-mode"
    Then the story iframe should have a button with accessible name "Continue"

  Scenario: Disabled primary button renders as disabled
    When I load the Storybook story "components-buttons-primarybutton--disabled"
    Then the story iframe should have a disabled button with accessible name "Submit"

  Scenario: Primary button CSS check renders the button correctly
    When I load the Storybook story "components-buttons-primarybutton--css-check"
    Then the story iframe should have a button with accessible name "Submit"

  # ── SecondaryButton ────────────────────────────────────────────────────────

  Scenario: Secondary button renders with default label
    When I load the Storybook story "components-buttons-secondarybutton--default"
    Then the story iframe should have a button with accessible name "Cancel"

  Scenario: Disabled secondary button renders as disabled
    When I load the Storybook story "components-buttons-secondarybutton--disabled"
    Then the story iframe should have a disabled button with accessible name "Cancel"
