Feature: Copy an existing RFQ (recalibration request)

  Background:
    Given the user is signed in as "test@example.com"
    And completed report "RFQ-2023-009012" is available

  Scenario: User copies a completed RFQ from the dashboard
    Given the user is on the dashboard
    When the user requests recalibration for "RFQ-2023-009012"
    Then the copied RFQ organisation step is displayed
    And the copied organisation details are pre-filled

  Scenario: Copied instrument details are retained
    Given the copied RFQ organisation step for "RFQ-2023-009012" is displayed
    When the user clicks "Save and next"
    Then the copied RFQ instrument step is displayed
    And the instrument manufacturer is "Original Manufacturer"
