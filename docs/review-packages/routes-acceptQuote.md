# Review package: routes/acceptQuote

Generated 2026-11-12 from HEAD (49b135ec) after the wizard props consolidation.
17 stale records across 14 source files, plus 1 export(s) with no claim. Stored
digest = what the last reviewer signed; current digest = file now. Reviewing
means reading the source against its claimed evidence, then re-stamping.

Files marked **REFACTOR** were edited by the consolidation
(`git diff dd818c87..HEAD -- <file>`); their stale digest reflects a real source
change and needs a read of that diff. Unmarked files were already stale before
the refactor.

## New exports needing a reviewed claim

- `ClientApp/src/routes/acceptQuote/redirection.ts#acceptQuoteRedirectionOnError`
  — **REFACTOR** (new file). Proposed classification: nonvisual (non-renderable
  helper). Unit tests: `tests/unit/routes/acceptQuote/redirection.test.ts`

## ClientApp/src/routes/acceptQuote/create/index.tsx

- Current digest:
  `sha256:4cbe0e636b3b582794d52e6b6ecaff2f94d4d3222f44f6869ca682399cb85750`
- Export `default` (direct) stored digest:
  `sha256:6affe5265ca80d1f55205d05996d7c625cda4942f904cf9d16b4bda236400d60`
  reviewer: codex-storybook-coverage-review
  - Claimed story:
    `ClientApp/src/routes/acceptQuote/create/AcceptQuoteCreate.stories.tsx` ::
    `LooksUpQuoteThenReportRecipient` (marker: "QuoteAccept")
  - Claimed story:
    `ClientApp/src/routes/acceptQuote/create/AcceptQuoteCreate.stories.tsx` ::
    `QuoteLookupFailureCreatesNothing` (marker: "Loading...")
- Unit tests importing it: `tests/unit/routes/workflowWrappers.test.tsx`

## ClientApp/src/routes/acceptQuote/deliveryAndReturn.tsx

- Current digest:
  `sha256:f816f85ca7b8e9b36160cdbd6f1355d05f4c4b4df38c665030181651a160aaae`
- Export `default` (direct) stored digest:
  `sha256:166570b2b31c0bdbfe1b415ee6dd904cba90cb55c29d9ddb4258b66ea7ce8ed7`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx` ::
    `QuotationSummaryStep` (marker: "Q-2024-000456")
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/acceptQuote/deliveryAndReturn.test.tsx`,
  `tests/unit/routes/acceptQuote/summaryAndAccept.test.tsx`,
  `tests/unit/routes/workflowStepComponents.test.tsx`,
  `tests/unit/routes/workflowWrappers.test.tsx`

## ClientApp/src/routes/acceptQuote/deliveryAndReturnFormikBridge.tsx

- Current digest:
  `sha256:ee8532997e6302b1b00ffa7b91147ecb1a3cc3eb3ecdaa21228cd6f4ef1ab0ab`
- Export `default` (nonvisual) stored digest:
  `sha256:f8a8a4ae9b1fef3bbe4e05f173dc6991c54423cd0db957629b84733d77c599bf`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: none

## ClientApp/src/routes/acceptQuote/deliveryAndReturnProps.ts — **REFACTOR**

- Current digest:
  `sha256:bf8463f9c910b97bd1e36333d2fe4186569af153393bfc7eea74280b337c8bc3`
- Export `default` (nonvisual) stored digest:
  `sha256:677ac68faf492d25e0b8a18f0a5b2b085d4acb45c12535cf9076a08768697142`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `deliveryAndReturnHidingFields` (nonvisual) stored digest:
  `sha256:677ac68faf492d25e0b8a18f0a5b2b085d4acb45c12535cf9076a08768697142`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/acceptQuote/props.test.ts`

## ClientApp/src/routes/acceptQuote/index.tsx

- Current digest:
  `sha256:f485a1c461e768bf1fc66fdc23e9902956b2848a9715631d3b66c272d57b9eed`
- Export `default` (direct) stored digest:
  `sha256:376f3bc7626da8fe420f979d486e368edb0c326114e9be0a2094c89577b9f6c1`
  reviewer: codex-storybook-coverage-review
  - Claimed story:
    `ClientApp/src/routes/acceptQuote/AcceptQuoteShell.stories.tsx` ::
    `LoadsStatusesThenFirstStep` (marker: "Testing and calibration service -
    Quotation")
  - Claimed story:
    `ClientApp/src/routes/acceptQuote/AcceptQuoteShell.stories.tsx` ::
    `NoStepStatusesIsNotFound` (marker: "Not found destination")
  - Claimed story:
    `ClientApp/src/routes/acceptQuote/AcceptQuoteShell.stories.tsx` ::
    `QuoteLookupFailureIsNotFound` (marker: "Not found destination")
  - Claimed story:
    `ClientApp/src/routes/acceptQuote/AcceptQuoteShell.stories.tsx` ::
    `UnknownApplicationIsNotFound` (marker: "Not found destination")
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/workflowWrappers.test.tsx`

## ClientApp/src/routes/acceptQuote/paymentDetails.tsx

- Current digest:
  `sha256:19f75ce6887131c02e891dbfae4dcf97ed67f9e671b9cda63a9579a1a2717421`
- Export `default` (direct) stored digest:
  `sha256:75a2f7cdc01aca06396e2c6296e3381ecd6cfe1ef8ae69dccc3ec9ee54e4e824`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx` ::
    `QuotationSummaryStep` (marker: "Q-2024-000456")
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/acceptQuote/summaryAndAccept.test.tsx`,
  `tests/unit/routes/workflowStepComponents.test.tsx`,
  `tests/unit/routes/workflowWrappers.test.tsx`

## ClientApp/src/routes/acceptQuote/paymentDetailsFormFields.tsx

- Current digest:
  `sha256:fdd85894eb442a0e910aa9c44d3694671ef92a6499e5e54b954dea61b9b61a57`
- Export `PaymentDetailsFormValues` (nonvisual) stored digest:
  `sha256:a836ee9ecc839fe1bc66c43ccc8ed53b23cda8b9f8e182470acf534ba5a8435b`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `default` (nonvisual) stored digest:
  `sha256:a836ee9ecc839fe1bc66c43ccc8ed53b23cda8b9f8e182470acf534ba5a8435b`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: none

## ClientApp/src/routes/acceptQuote/paymentDetailsProps.ts — **REFACTOR**

- Current digest:
  `sha256:c2afffc767f6005ec53a6f8086e2e7247ef4d88c3f99b5568f77de7406114585`
- Export `default` (nonvisual) stored digest:
  `sha256:8d108f61bd426e20c47c2a7a027221ec5df47e8ed97dba4c52c7d75fb17bfab8`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/acceptQuote/props.test.ts`

## ClientApp/src/routes/acceptQuote/reportRecipient.tsx

- Current digest:
  `sha256:360e7b4345df4fbb749c8a565a2e4cace1665d1c57e58ca718d911385d2da3bc`
- Export `default` (direct) stored digest:
  `sha256:b184e7b7ee05ffc58b99bd892466513bdcef2c0e4cf90d5b953058fe58e329b1`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx` ::
    `QuotationSummaryStep` (marker: "Q-2024-000456")
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/acceptQuote/summaryAndAccept.test.tsx`,
  `tests/unit/routes/workflowStepComponents.test.tsx`,
  `tests/unit/routes/workflowWrappers.test.tsx`

## ClientApp/src/routes/acceptQuote/reportRecipientFormikBridge.tsx

- Current digest:
  `sha256:19484e2b975cb836c29103c19d6db8261e0f5c86d8c277eda269298dcbe52356`
- Export `default` (nonvisual) stored digest:
  `sha256:603d3da4c2bc084442d8072a900e97d21747f8b2a4add63126f3db082d1a3a5e`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: none

## ClientApp/src/routes/acceptQuote/reportRecipientProps.ts — **REFACTOR**

- Current digest:
  `sha256:d53cf19ecf298f21f255f1b0585db2dc0bddd90bc50d2a10065cd9f9d18569a3`
- Export `default` (nonvisual) stored digest:
  `sha256:d7eab35801a7ff4c0189fb6114785b7397a60ec08cf8b27abc54784718c630ec`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/acceptQuote/props.test.ts`

## ClientApp/src/routes/acceptQuote/summaryAndAccept.tsx

- Current digest:
  `sha256:8f9423c4ad70726adffce17787a4f28af0460d81a9dc70e35b76b3c6f7f34c9b`
- Export `default` (direct) stored digest:
  `sha256:25e77e71c48085887eef1f5c88f2197aa58b29ed06c3e1f10f5de1619db35717`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx` ::
    `QuotationSummaryStep` (marker: "Q-2024-000456")
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/acceptQuote/summaryAndAccept.test.tsx`,
  `tests/unit/routes/workflowStepComponents.test.tsx`,
  `tests/unit/routes/workflowWrappers.test.tsx`

## ClientApp/src/routes/acceptQuote/summaryAndAcceptFormikBridge.tsx

- Current digest:
  `sha256:53376f361d40cb5c02d064897096073f74e8cc5150b5ea467435c394f3f47f5b`
- Export `default` (nonvisual) stored digest:
  `sha256:f099ea5c8696f30c546b55a3332dd20b2d083f4ce76336f2e613190e2f4a0d92`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: none

## ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts — **REFACTOR**

- Current digest:
  `sha256:adea19b584c1c2d74b35db302670e2c5cb42775487b401cc7539904b7911858c`
- Export `default` (nonvisual) stored digest:
  `sha256:33fbb8f059eb2e763715e5136e0b70b46498fcbbe1b8817689417fca6eb05dcd`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `summaryAndAcceptOwnHidingFields` (nonvisual) stored digest:
  `sha256:33fbb8f059eb2e763715e5136e0b70b46498fcbbe1b8817689417fca6eb05dcd`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/acceptQuote/AcceptQuote.test.tsx`,
  `tests/unit/routes/acceptQuote/props.test.ts`
