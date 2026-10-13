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

  Scenario: Quote acceptance save failure keeps the user on the step
    Given the user is viewing quotation "RFQ-2024-000892"
    When the user follows "Proceed with quote"
    And saving the quote report recipient step will fail with status 503
    And the user clicks "Save and next"
    Then a save error is displayed
    And the quote acceptance step "Report recipient" is displayed

  Scenario: Type-approval save failure keeps the user on the step
    Given the user is on the pattern/type approval dashboard
    When the applicant starts a new pattern/type approval application
    And the applicant begins the application
    And the applicant confirms the organisation and contact details
    And the applicant chooses the new-certificate application option
    And saving the type-approval application details step will fail with status 503
    And the user clicks "Save and exit"
    Then a save error is displayed
    And the type-approval step "Application details" is displayed
