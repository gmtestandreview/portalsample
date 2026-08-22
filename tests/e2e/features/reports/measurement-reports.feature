Feature: View measurement reports

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: User opens a report from an instrument report history
    Given instrument "Precision Balance" has an issued report
    When the user opens the instrument report history
    Then the instrument report history is displayed
    When the user follows the report link "View report"
    Then report "MR-2024-001" is displayed

  Scenario: User sees a report file retrieval failure
    Given report "RFQ-REPORT-FAIL" is available
    And report PDF retrieval will fail with status 503
    When the user opens report "RFQ-REPORT-FAIL"
    And the user clicks "View report PDF"
    Then the report file error notification is displayed
