Feature: Accept a quotation

  Background:
    Given the user is signed in as "test@example.com"
    And quote "RFQ-2024-000892" is available

  Scenario: User opens an available quote from the dashboard
    Given the user is on the dashboard
    When the user opens request "RFQ-2024-000892"
    And the user selects its "Quotation" tab
    And the user follows "View quotation"
    Then the quotation page for "RFQ-2024-000892" is displayed
    And "Proceed with quote" is available
    And "Decline quote" is available

  Scenario: User starts the quote acceptance wizard
    Given the user is viewing quotation "RFQ-2024-000892"
    When the user follows "Proceed with quote"
    Then the quote acceptance wizard for "RFQ-2024-000892" is displayed

  Scenario: User declines a quote
    Given the user is viewing quotation "RFQ-2024-000892"
    When the user clicks "Decline quote"
    Then a confirmation dialog titled "Decline quote" is displayed
    When the user confirms "Decline quote"
    Then the dashboard is displayed

  Scenario: Expired quote cannot be accepted
    Given quote "RFQ-2024-000700" is expired
    When the user views quotation "RFQ-2024-000700"
    Then "Proceed with quote" is not available
    And the quote status "Quotation expired" is displayed

  Scenario: User accepts an available quote through every step
    Given the user is viewing quotation "RFQ-2024-000892"
    When the user follows "Proceed with quote"
    Then the quote acceptance step "Report recipient" is displayed
    When the user completes the report recipient step
    And the user clicks "Save and next"
    Then the quote acceptance step "Instrument/artefact delivery and return" is displayed
    When the user completes the delivery and return step
    And the user clicks "Save and next"
    Then the quote acceptance step "Payment details" is displayed
    When the user completes the payment details step
    And the user clicks "Save and next"
    Then the quote acceptance step "Summary and accept" is displayed
    When the user accepts the quote terms
    And the user clicks "Submit and accept"
    Then a confirmation dialog titled "Are you sure you want to accept this quote?" is displayed
    When the user confirms "Yes, submit"
    Then the accepted quote success page is displayed
