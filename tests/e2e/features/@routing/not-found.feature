Feature: Handle unknown portal routes

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: Unknown portal path displays the not-found page
    When the user navigates to "/a-route-that-does-not-exist"
    Then the not-found page is displayed
