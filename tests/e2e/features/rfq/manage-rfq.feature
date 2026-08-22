Feature: Manage an existing request for quote

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: User views a submitted RFQ summary
    Given submitted RFQ "RFQ-2024-000321" is available
    When the user opens the submitted RFQ summary
    Then the submitted RFQ summary is displayed
    And the summary contains manufacturer "Original Manufacturer"

  Scenario: User edits and saves an existing RFQ draft
    Given draft RFQ "RFQ-DRAFT-0001" is available
    When the user opens the draft RFQ
    And the user changes the manufacturer to "Updated Manufacturer"
    And the user clicks "Save and exit"
    Then the dashboard is displayed
    And draft RFQ "RFQ-DRAFT-0001" retains manufacturer "Updated Manufacturer"

  Scenario: Required RFQ fields prevent progression
    Given draft RFQ "RFQ-DRAFT-0002" is available at the instrument step
    When the user clears the manufacturer
    And the user clicks "Save and next"
    Then the validation message "Enter a manufacturer." is displayed
    And the RFQ instrument step remains displayed
