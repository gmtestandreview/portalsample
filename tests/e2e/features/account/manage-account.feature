Feature: Maintain portal account details

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: User updates organisation details
    Given the user opens organisation 1 for editing
    When the user changes the business website to "https://updated.example.gov.au"
    And the user submits the account maintenance form
    Then the dashboard is displayed
    And the success notification "Your organisation details have been successfully updated." is displayed

  Scenario: User updates contact details
    Given the user opens their contact details for editing
    When the user changes the business phone to "02 6123 4567"
    And the user submits the account maintenance form
    Then the dashboard is displayed
    And the success notification "Your contact details have been successfully saved." is displayed

  Scenario: User adds a branch or location
    Given the user opens the add branch form
    When the user enters branch name "Canberra Laboratory"
    And the user submits the account maintenance form
    Then the branch selector is displayed
    And the success notification "Your branch/location details have been successfully saved." is displayed
