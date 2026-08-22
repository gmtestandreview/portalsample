Feature: Authentication and sign-in redirect

  Background:
    Given the user is on the NMI Services portal home page

  Scenario: Unauthenticated user is redirected to sign-in
    When the user navigates to "/dashboard"
    Then the user should be redirected to the B2C sign-in page

  Scenario: Authenticated user lands on the dashboard
    Given the user is signed in as "test@example.com"
    When the page finishes loading
    Then the user should see the dashboard heading
    And the user should see their organisation name

  Scenario: User signs out successfully
    Given the user is signed in as "test@example.com"
    When the user clicks "Sign out"
    Then the user should be redirected to the home page
    And the sign-in button should be visible
