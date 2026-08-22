@storybook @routes
Feature: Route storybook coverage

  Scenario: Dashboard populated story renders the dashboard shell
    When I load the Storybook story "routes-dashboard--populated"
    Then the story iframe should contain "Currently managing"

  Scenario: Dashboard empty state story renders without items
    When I load the Storybook story "routes-dashboard--empty-state"
    Then the story iframe should contain "Currently managing"

  Scenario: Dashboard notification story renders the saved message
    When I load the Storybook story "routes-dashboard--requests-tab-with-notification"
    Then the story iframe should contain "Quote request saved as draft."

  Scenario: Get started public landing story renders the welcome banner
    When I load the Storybook story "routes-home-getstarted--public-landing"
    Then the story iframe should contain "Welcome to the NMI Services portal"

  Scenario: Get started information banner story renders the notification
    When I load the Storybook story "routes-home-getstarted--with-information-banner"
    Then the Storybook portal should contain "Your Digital ID has been disconnected. Log in again to continue."

  Scenario: Services we offer story renders the page heading
    When I load the Storybook story "routes-servicesweoffer--default"
    Then the story iframe should contain "Services we offer"

  Scenario: Help guide authenticated journey story renders the guide heading
    When I load the Storybook story "routes-helpguide--authenticated-journey"
    Then the story iframe should contain "Help guide"

  Scenario: Help guide public journey story renders the back to home action
    When I load the Storybook story "routes-helpguide--public-journey"
    Then the story iframe should contain "Back to home"

  Scenario: Help guide access article story renders the heading
    When I load the Storybook story "routes-helpguide-details--how-to-setup-access"
    Then the story iframe should contain "How to set up access"

  Scenario: Help guide FAQs story renders the FAQ heading
    When I load the Storybook story "routes-helpguide-details--frequently-asked-questions"
    Then the story iframe should contain "Frequently Asked Questions (FAQs)"

  Scenario: Auth sign-in loading story renders the loading message
    When I load the Storybook story "routes-auth--sign-in-loading"
    Then the story iframe should contain "Logging in..."

  Scenario: Auth sign-out loading story renders the logout spinner
    When I load the Storybook story "routes-auth--sign-out-loading"
    Then the story iframe should contain "Logging out..."

  Scenario: Auth sign-out completion story renders the close-browser warning
    When I load the Storybook story "routes-auth--sign-out-completion"
    Then the story iframe should contain "Warning: To complete your log out, close your browser window"

  Scenario: Account creation story renders the organisation details heading
    When I load the Storybook story "routes-account-createaccountstep--organisation-details"
    Then the story iframe should contain "Organisation details"

  Scenario: Account creation validation story renders the error message
    When I load the Storybook story "routes-account-createaccountstep--organisation-details-validation"
    Then the story iframe should contain "Enter a valid business website address."

  Scenario: Account created story renders the success heading
    When I load the Storybook story "routes-account-accountcreated--default"
    Then the story iframe should contain "Your portal account is ready"

  Scenario: Contact details default story renders the contact section heading
    When I load the Storybook story "routes-contact-contactdetailsstep--default"
    Then the story iframe should contain "Important information"

  Scenario: Contact details validation story renders the inline validation error
    When I load the Storybook story "routes-contact-contactdetailsstep--validation-state"
    Then the story iframe should contain "Enter a first name."

  Scenario: Request for quote organisation step renders the section heading
    When I load the Storybook story "routes-requestforquote--organisation-and-contact-step"
    Then the story iframe should contain "Organisation details"
    And the story iframe should contain "Contact information"

  Scenario: Request for quote instrument step renders the section heading
    When I load the Storybook story "routes-requestforquote--instrument-and-request-step"
    Then the story iframe should contain "Instrument/artefact details"
    And the story iframe should contain "Request details"

  Scenario: Request for quote organisation validation story renders the validation message
    When I load the Storybook story "routes-requestforquote--organisation-and-contact-validation"
    Then the story iframe should contain "Select whether this is the correct branch or location."

  Scenario: Request for quote instrument validation story renders the validation message
    When I load the Storybook story "routes-requestforquote--instrument-and-request-validation"
    Then the story iframe should contain "Enter a serial number."

  Scenario: Request for quote created story renders the submitted heading
    When I load the Storybook story "routes-requestforquote-requestcreated--submitted"
    Then the story iframe should contain "Your request has been submitted"

  Scenario: Accept quote report recipient story renders the recipient step heading
    When I load the Storybook story "routes-acceptquote--report-recipient-step"
    Then the story iframe should contain "Report recipient"

  Scenario: Accept quote payment details story renders the payment step heading
    When I load the Storybook story "routes-acceptquote--payment-details-step"
    Then the story iframe should contain "Invoice contact person"

  Scenario: Accept quote postpaid story renders the invoice payment copy
    When I load the Storybook story "routes-acceptquote--payment-details-postpaid"
    Then the story iframe should contain "Invoice"

  Scenario: Submitted success prepaid story renders the submission confirmation
    When I load the Storybook story "routes-acceptquote-submittedsuccess--prepaid"
    Then the story iframe should contain "Your accepted quote has been successfully submitted"

  Scenario: Submitted success postpaid story renders the submission confirmation
    When I load the Storybook story "routes-acceptquote-submittedsuccess--postpaid"
    Then the story iframe should contain "Your accepted quote has been successfully submitted"

  Scenario: Quotation summary story renders the quotation heading
    When I load the Storybook story "routes-quotation--quote-summary"
    Then the story iframe should contain "Quotation summary"

  Scenario: Expired quotation story renders the no-delivery notice
    When I load the Storybook story "routes-quotation--expired-no-delivery"
    Then the story iframe should contain "This quotation does not require the delivery or return of the instrument/artefact to the NMI."

  Scenario: Measurement report story renders the measurement report heading
    When I load the Storybook story "routes-measurementreport--report-view"
    Then the story iframe should contain "Measurement report"

  Scenario: Measurement report file error story renders the report heading
    When I load the Storybook story "routes-measurementreport--file-error"
    Then the story iframe should contain "Measurement report"

  Scenario: Not found error story renders the not found heading
    When I load the Storybook story "routes-errorstates--not-found"
    Then the story iframe should contain "Oops - Page not found"

  Scenario: Forbidden error story renders the forbidden heading
    When I load the Storybook story "routes-errorstates--forbidden"
    Then the story iframe should contain "Oops - Forbidden"

  Scenario: Conflict error story renders the conflict heading
    When I load the Storybook story "routes-errorstates--conflict"
    Then the story iframe should contain "Oops - Conflict"

  Scenario: No longer available error story renders the not available heading
    When I load the Storybook story "routes-errorstates--no-longer-available"
    Then the story iframe should contain "Oops - Not Available"

  Scenario: Unprocessable error story renders the unprocessable heading
    When I load the Storybook story "routes-errorstates--unprocessable"
    Then the story iframe should contain "Oops - Unprocessable."

  Scenario: Precondition failed error story renders the precondition heading
    When I load the Storybook story "routes-errorstates--precondition-failed"
    Then the story iframe should contain "Oops - A precondition failed error has occurred"

  Scenario: Service unavailable error story renders the service unavailable heading
    When I load the Storybook story "routes-errorstates--service-unavailable"
    Then the story iframe should contain "Oops - Service unavailable."

  Scenario: Server error story renders the server error heading
    When I load the Storybook story "routes-errorstates--server-error"
    Then the story iframe should contain "Oops - An unexpected error has occurred"
