@storybook @components
Feature: Broad Storybook component coverage

  Scenario: Actions text button story renders the dropdown trigger and menu items
    When I load the Storybook story "components-actions--text-button"
    Then the story iframe should have a button with accessible name "Actions"
    When I click the button with accessible name "Actions" in the story iframe
    Then the story iframe should contain "View details"

  Scenario: Actions icon button story renders the icon trigger and menu items
    When I load the Storybook story "components-actions--icon-button"
    Then the story iframe should have a button with accessible name "Actions for request RFQ-2024-001234"
    When I click the button with accessible name "Actions for request RFQ-2024-001234" in the story iframe
    Then the story iframe should contain "Request recalibration"

  Scenario: Full page block spinner story renders loading copy
    When I load the Storybook story "components-blockuispinner--full-page"
    Then the story iframe should contain "Loading data..."

  Scenario: Inline block spinner story renders refresh copy
    When I load the Storybook story "components-blockuispinner--inline"
    Then the story iframe should contain "Refreshing results..."

  Scenario: Error boundary story without errors renders the success message
    When I load the Storybook story "components-errorboundary--no-error"
    Then the story iframe should contain "All good!"

  Scenario: Error boundary story catches a render error
    When I load the Storybook story "components-errorboundary--caught-error"
    Then the story iframe should contain "Oops - An unexpected error has occurred"

  Scenario: Error boundary recovery story renders its reset controls
    When I load the Storybook story "components-errorboundary--recovered-after-reset"
    Then the story iframe should have a button with accessible name "Reset ErrorBoundary"
    And the story iframe should have a button with accessible name "Simulate render error"

  Scenario: Nested error boundaries story renders the outer content
    When I load the Storybook story "components-errorboundary--nested-boundaries"
    Then the story iframe should contain "Outer content"

  Scenario: Icon story renders the external link icon label
    When I load the Storybook story "components-icons--external-link"
    Then the story iframe should contain "Opens in a new tab"

  Scenario: In-text link story renders the external guidance link
    When I load the Storybook story "components-intextlink--external"
    Then the story iframe should be visible

  Scenario: In-text link story renders inline guidance text
    When I load the Storybook story "components-intextlink--inline-text"
    Then the story iframe should contain "Open support content"

  Scenario: Layout story renders the portal shell example content
    When I load the Storybook story "components-layout--portal-shell"
    Then the story iframe should contain "Example content"

  Scenario: Pagination header story renders the middle page summary
    When I load the Storybook story "components-paginationheader--mid-page"
    Then the story iframe should contain "Displaying 21 - 30 of 56 Results"

  Scenario: Pagination header story renders the last page summary
    When I load the Storybook story "components-paginationheader--last-page"
    Then the story iframe should contain "Displaying 51 - 56 of 56 Results"

  Scenario: Utilities contact actions story renders the dashboard and support links
    When I load the Storybook story "components-utilities--contact-actions"
    Then the story iframe should contain "Go to dashboard"
    And the story iframe should contain "infotm@measurement.gov.au"

  Scenario: Utilities skip and back-to-top story renders the navigation landmark
    When I load the Storybook story "components-utilities--skip-and-top-navigation"
    Then the story iframe should contain "Skip to main content"
    And the story iframe should contain "Back to top"

  Scenario: Utilities PDF loaded story renders the download button and file size
    When I load the Storybook story "components-utilities--pdf-action-loaded"
    Then the story iframe should have a button with accessible name "View quotation PDF"
    And the story iframe should contain "Requires Acrobat PDF reader - PDF file size 1.4 MB"

  Scenario: Utilities PDF loading story renders the loading spinner
    When I load the Storybook story "components-utilities--pdf-action-loading"
    Then the story iframe should contain "Loading data..."

  Scenario: Welcome story renders the signed-in greeting
    When I load the Storybook story "components-welcome--default"
    Then the story iframe should contain "Welcome"

  Scenario: Button breadth grouped actions story renders both actions
    When I load the Storybook story "components-buttons-breadth--grouped-actions"
    Then the story iframe should contain "Cancel"
    And the story iframe should contain "External reference"

  Scenario: Button breadth edit section story renders the edit button
    When I load the Storybook story "components-buttons-breadth--edit-section"
    Then the story iframe should have a button with accessible name "Edit this section"