# Debug Report: Accept Quote Payment Coverage

- **Symptom:** `npm run test:unit:coverage` failed the global branch threshold: branches were below 100%, with misses in accept-quote `paymentDetails.tsx` and `paymentDetailsFormFields.tsx`.
- **Root cause:** the payment summary helper still carried a non-summary branch after the RHF payment-step migration, even though non-summary rendering now goes through `PaymentDetailsFormikBridge`. `paymentDetailsFormFields.tsx` also had uncovered optional contact-field states, plus unreachable invoice-radio error UI: `invoiceSentTo` has no validation rule, so that error feedback could only be exercised by an artificial direct adapter test.
- **Upstream impact:** `PaymentDetails` is entered by the accept-quote wizard and by the payment accordion inside `SummaryAndAccept`; the affected data source is `AcceptQuoteClient.getPaymentDetails`.
- **Downstream impact:** TokenSave impact identified `AcceptQuote`, `SummaryAndAccept`, `PaymentDetailsFormikBridge`, `paymentDetailsProps`, and accept-quote payment stories/tests. Runtime behavior is unchanged for invoice-radio validation because no current schema path can surface that error.
- **Fix:** simplified summary field-name prefixing in `ClientApp/src/routes/acceptQuote/paymentDetails.tsx`, removed unreachable invoice-radio feedback from `ClientApp/src/routes/acceptQuote/paymentDetailsFormFields.tsx`, and extended payment-detail tests for quotation-id help, nullable purchase-order values, `Other` title rendering, and optional contact validation feedback.
- **Regression tests:** `tests/unit/routes/acceptQuote/paymentDetails.test.tsx` and `tests/unit/routes/acceptQuote/paymentDetails.behavior.test.tsx`.
- **Evidence:** focused payment tests passed: 2 files, 24 tests. Full unit coverage passed: 184 files, 2103 tests, 100% statements, 100% branches, 100% functions, 100% lines. `npm run type-check` passed. `npm run lint -- ...` passed.
- **Related:** TokenSave'd ~13,685 tokens across context and impact queries.
- **Status:** DONE
