# Debug Report: RHF Phone Field Ref Warning

- **Symptom:** Vitest stderr reported `Function components cannot be given refs` while rendering `RhfPhoneField` in payment details invoice contact sections.
- **Root cause:** `RhfPhoneField` spread the full React Hook Form `field` object into `PatternFormatFixed`, which passed `field.ref` as React's `ref` prop to `react-number-format`'s `PatternFormat` function component. `react-number-format@5.4.5` exposes `getInputRef` for the underlying input ref instead.
- **Upstream impact:** React Hook Form registration for `contact.phone` and `contact.mobile` needs the underlying input ref to support focus/validation behavior.
- **Downstream impact:** The affected render path is `PaymentDetails` -> `PaymentDetailsFormikBridge` -> `PaymentDetailsFormFields` -> `RhfInvoiceContact` -> `RhfPhoneField`. Existing Formik `NumberInput` usage is not affected because Formik's field props do not include a `ref`.
- **Fix:** Destructure `field.ref` in `RhfPhoneField`, pass remaining field props to `PatternFormatFixed`, and pass the registration ref via `getInputRef`. Added `getInputRef` to the local formatter prop type.
- **Regression test:** `tests/unit/routes/acceptQuote/paymentDetails.behavior.test.tsx` now asserts the invoice phone fields render without the React ref warning.
- **Evidence:** `npm run type-check`; `npm run lint -- ClientApp/src/components/Inputs/NumberInput/types.ts ClientApp/src/routes/acceptQuote/paymentDetailsFormFields.tsx tests/unit/routes/acceptQuote/paymentDetails.behavior.test.tsx tests/unit/routes/acceptQuote/paymentDetails.test.tsx`; `npm run test:unit -- tests/unit/routes/acceptQuote/paymentDetails.behavior.test.tsx tests/unit/routes/acceptQuote/paymentDetails.test.tsx tests/unit/routes/workflowStepComponents.test.tsx`.
- **Status:** DONE.
