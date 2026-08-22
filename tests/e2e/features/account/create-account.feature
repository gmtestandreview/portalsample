Feature: Create a new account

  Background:
    Given a first-time user is signed in as "newuser@example.com"

  Scenario: User accepts the terms of use
    Given the terms of use dialog is displayed
    When the user clicks "Agree and continue"
    Then the organisation form remains displayed

  Scenario: User creates organisation and contact details
    Given the user has accepted the terms of use
    And the organisation form is displayed
    When the user submits the organisation form
    Then the contact form is displayed
    When the user submits the contact form
    Then the completed account dashboard is displayed

  Scenario: An expired session is not restored on refresh
    Given the user has accepted the terms of use
    And the organisation form is displayed
    When the authentication session expires
    And the user refreshes the page
    Then the sign-in page is displayed
