Feature: Recover from portal workflow failures

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: RFQ save failure retains entered values
    Given draft RFQ "RFQ-DRAFT-FAIL" is available at the instrument step
    And saving the RFQ instrument step will fail with status 503
    When the user changes the manufacturer to "Retained Manufacturer"
    And the user clicks "Save and next"
    Then an RFQ save error is displayed
    And the manufacturer remains "Retained Manufacturer"

  Scenario: Organisation conflict returns the user to the dashboard
    Given the user opens organisation 1 for editing
    And saving the organisation will fail with status 412
    When the user submits the account maintenance form
    Then the dashboard is displayed
    And the error notification "This branch/location name already exists." is displayed

  Scenario: Authentication expiry during a mutation requires sign-in
    Given draft RFQ "RFQ-DRAFT-AUTH" is available at the instrument step
    When the authentication session expires
    And the user clicks "Save and exit"
    Then the sign-in page is displayed

  Scenario: Unsaved RFQ navigation can be cancelled
    Given draft RFQ "RFQ-DRAFT-UNSAVED" is available at the instrument step
    When the user changes the manufacturer to "Unsaved Manufacturer"
    And the user clicks "Discard changes"
    Then an unsaved changes dialog is displayed
    When the user cancels leaving the form
    Then the RFQ instrument step remains displayed
    And the manufacturer remains "Unsaved Manufacturer"
