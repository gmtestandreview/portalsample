Feature: Create a request for quote (RFQ)

  Background:
    Given the user is signed in as "test@example.com"
    And the user is on the dashboard

  Scenario: User completes a new RFQ through all steps
    When the user clicks "Create new request"
    Then the user should be on the RFQ wizard step 1 "Organisation and contact"
    And the stepped navigation should show 3 steps

    When the user clicks "Save and next"
    Then the user should be on the RFQ wizard step 2 "Instrument and request"

    When the user fills in the instrument manufacturer "Fluke"
    And the user fills in the instrument model "87V"
    And the user fills in the serial number "SN123456"
    And the user clicks "Save and next"
    Then the user should be on the RFQ wizard step 3 "Summary"

    When the user clicks "Submit"
    And the user confirms the dialog
    Then the RFQ submitted page should be displayed

  Scenario: User saves draft and exits mid-wizard
    When the user clicks "Create new request"
    And the user clicks "Save and next"
    And the user fills in the instrument manufacturer "Keysight"
    And the user clicks "Save and exit"
    Then the user should be redirected to the dashboard

  Scenario: User navigates back to a previous step
    When the user clicks "Create new request"
    And the user clicks "Save and next"
    And the user fills in the instrument manufacturer "Fluke"
    And the user clicks "Save and next"
    Then the user should be on the RFQ wizard step 3
    When the user clicks "Back"
    Then the user should be on the RFQ wizard step 2 "Instrument and request"
    And the instrument manufacturer field should contain "Fluke"
