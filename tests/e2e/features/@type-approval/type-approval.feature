Feature: Apply for and manage pattern/type approval

  Background:
    Given the user is signed in as "test@example.com"
    And the user is on the pattern/type approval dashboard

  Scenario: Applicant completes and submits a new type-approval application
    When the applicant starts a new pattern/type approval application
    Then the pattern/type approval pre-application guidance is displayed
    When the applicant begins the application
    Then the type-approval step "Organisation details" is displayed
    When the applicant confirms the organisation and contact details
    Then the type-approval step "Application details" is displayed
    When the applicant provides new-certificate application details:
      | Application option  | NMI Pattern Approval Certificate       |
      | Instrument category | Weighing instruments                   |
      | Instrument type     | Non-automatic weighing instrument      |
      | Instrument make     | Acme Metrology                         |
      | Model               | Balance 2000                           |
      | Summary             | Approval for a precision trade balance |
    Then the type-approval step "Supporting documents" is displayed
    When the applicant uploads "pattern-approval-evidence.pdf" as a "Certificate"
    Then the type-approval step "Summary and submit" is displayed
    When the applicant accepts the declarations and submits the application
    Then the type-approval submission success page is displayed
    When the applicant returns to the pattern/type approval dashboard
    Then submitted type-approval application "PA-2026-000002" appears

  Scenario: Applicant manages an existing submitted type-approval application
    Given submitted type-approval application "PA-2026-000001" is available
    When the applicant opens the submitted type-approval application
    Then its application details are displayed
    When the applicant views its documents
    Then document "existing-certificate.pdf" is displayed
    When the applicant sends the message "Please confirm that the certificate was received."
    Then the message appears in the application thread
