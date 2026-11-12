# Review package: routes/ta

Generated 2026-11-12 from HEAD (49b135ec) after the wizard props consolidation.
40 stale records across 23 source files, plus 0 export(s) with no claim. Stored
digest = what the last reviewer signed; current digest = file now. Reviewing
means reading the source against its claimed evidence, then re-stamping.

Files marked **REFACTOR** were edited by the consolidation
(`git diff dd818c87..HEAD -- <file>`); their stale digest reflects a real source
change and needs a read of that diff. Unmarked files were already stale before
the refactor.

## ClientApp/src/routes/ta/applicationAndInstrument.tsx

- Current digest:
  `sha256:67591340ec94124cbb4599e86610710c95e42dd68b971146fd018a23dd142f40`
- Export `default` (direct) stored digest:
  `sha256:1242c67779ff02d5aef7f2ee0681f153fa44f9cd9b6f24e8acdbf6fa6a5b2153`
  reviewer: codex-storybook-coverage-review
  - Claimed story:
    `ClientApp/src/routes/ta/applicationAndInstrument.stories.tsx` :: `EditStep`
    (marker: "Instrument details")
- Unit tests importing it:
  `tests/unit/routes/ta/applicationAndInstrument.test.tsx`,
  `tests/unit/routes/ta/applicationForTypeApproval.test.tsx`,
  `tests/unit/routes/ta/summary/summaryParity.test.tsx`

## ClientApp/src/routes/ta/applicationAndInstrumentProps.ts — **REFACTOR**

- Current digest:
  `sha256:54721acca2cafe2cc80d93b56d2f7e126c570234044b06905c1c54c354011b24`
- Export `default` (nonvisual) stored digest:
  `sha256:9cd574dbaa69996ddad7be07b4815e47244fad233a55f1647e5ff1e208dbc7f2`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/ta/props.test.ts`

## ClientApp/src/routes/ta/create/index.tsx

- Current digest:
  `sha256:9b1b25076ed70417b9b14f70809f0f40aecba4d69a9d6791443885f2a16d8fc6`
- Export `default` (direct) stored digest:
  `sha256:8bc56c7ab3eba645ca0902089c8f4e7f862f61b300c088ddcc6a20b542ac4b94`
  reviewer: codex-storybook-coverage-review
  - Claimed story:
    `ClientApp/src/routes/ta/create/TypeApprovalCreate.stories.tsx` ::
    `PendingThenOrganisationDetails` (marker: "PatternApproval")
  - Claimed story:
    `ClientApp/src/routes/ta/create/TypeApprovalCreate.stories.tsx` ::
    `CreateFailureKeepsLoading` (marker: "Loading...")
- Unit tests importing it: `tests/unit/routes/ta/create.test.tsx`

## ClientApp/src/routes/ta/created/index.tsx

- Current digest:
  `sha256:e5018aeef7be13fb0441e1bc072372a84944bb0f96b3a674475c656aa68310cc`
- Export `default` (direct) stored digest:
  `sha256:83688d5c89dd370e204525ccf97ee19dcd65dc6a93958dbef89546c47401e6f0`
  reviewer: codex-storybook-coverage-review
  - Claimed story:
    `ClientApp/src/routes/ta/created/TypeApprovalCreated.stories.tsx` ::
    `SubmittedReference` (marker: "Your application has been submitted")
  - Claimed story:
    `ClientApp/src/routes/ta/created/TypeApprovalCreated.stories.tsx` ::
    `DashboardButton` (marker: "Pattern approval dashboard")
  - Claimed story:
    `ClientApp/src/routes/ta/created/TypeApprovalCreated.stories.tsx` ::
    `DashboardLink` (marker: "Pattern approval dashboard")
- Unit tests importing it: `tests/unit/routes/ta/created.test.tsx`

## ClientApp/src/routes/ta/displayRules.ts

- Current digest:
  `sha256:a2cb8b80356d51672f34083a8b7dff3c80f8349864e915bd902528419b34e745`
- Export `DisplayRules` (nonvisual) stored digest:
  `sha256:96b441f7e104b4e5af280098ebe096a8f9929a21ba30ef3354cd29b401a3ebda`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `default` (nonvisual) stored digest:
  `sha256:96b441f7e104b4e5af280098ebe096a8f9929a21ba30ef3354cd29b401a3ebda`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/ta/displayRules.test.ts`

## ClientApp/src/routes/ta/index.tsx

- Current digest:
  `sha256:c43b0210e51a82f08d52c51c16c31d780ed0ef613de30366321169bf27d721d6`
- Export `default` (direct) stored digest:
  `sha256:7ada05889a6c610a8dcf1e099bef61698a649329bdc3be08e574b1481a935945`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/TypeApprovalShell.stories.tsx` ::
    `LoadsStatusesThenFirstStep` (marker: "Pattern/type approval - Application")
  - Claimed story: `ClientApp/src/routes/ta/TypeApprovalShell.stories.tsx` ::
    `StatusLoadFailureIsNotFound` (marker: "Not found destination")
  - Claimed story: `ClientApp/src/routes/ta/TypeApprovalShell.stories.tsx` ::
    `UnknownApplicationIsNotFound` (marker: "Not found destination")
- Unit tests importing it:
  `tests/unit/routes/ta/applicationForTypeApproval.test.tsx`

## ClientApp/src/routes/ta/instrumentInfoPanel.tsx

- Current digest:
  `sha256:dec92f9a213b18db0fc772b34c853430340b7af34bd0167ac798675685b303ea`
- Export `InstrumentCategory` (nonvisual) stored digest:
  `sha256:dfa902e5dccba57f0eb8ddbc78aa328fc2687e57ae645dae7f8255d730f377d0`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `InstrumentType` (nonvisual) stored digest:
  `sha256:dfa902e5dccba57f0eb8ddbc78aa328fc2687e57ae645dae7f8255d730f377d0`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `default` (direct) stored digest:
  `sha256:dfa902e5dccba57f0eb8ddbc78aa328fc2687e57ae645dae7f8255d730f377d0`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/instrumentInfoPanel.stories.tsx` ::
    `WithReferences` (marker: "References for this instrument type")
- Unit tests importing it:
  `tests/unit/routes/ta/applicationAndInstrument.test.tsx`,
  `tests/unit/routes/ta/rhfSupportingDocuments.test.tsx`,
  `tests/unit/routes/ta/supportingDocuments.test.tsx`

## ClientApp/src/routes/ta/manage/appDetails.tsx

- Current digest:
  `sha256:b8bf3b8e7b57b9b0d6499115c0f324d0f397098efd0b077a2bcf362090758420`
- Export `default` (direct) stored digest:
  `sha256:821badb247fb19b541416833fa8186ed64e03a966b10d4fb7bfbf87a55281e35`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/manage/appDetails.stories.tsx` ::
    `DetailsTab` (marker: "Application status")
- Unit tests importing it: `tests/unit/routes/ta/appDetails.summary.test.tsx`,
  `tests/unit/routes/ta/appDetails.test.tsx`

## ClientApp/src/routes/ta/manage/appDetailsProps.ts — **REFACTOR**

- Current digest:
  `sha256:6c8ab3fc7c07d6f78320fc6ab42ae21d13498e952d9f5f63a6a6bbc1264ed269`
- Export `default` (nonvisual) stored digest:
  `sha256:6a2f2d172737116c7e688db33e997ca247c3f17398495b0720fc05ce2ab82404`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/ta/appDetails.test.tsx`,
  `tests/unit/routes/ta/manage/appDetailsProps.test.ts`,
  `tests/unit/routes/ta/summary/summaryParity.test.tsx`

## ClientApp/src/routes/ta/manage/appDocuments.tsx

- Current digest:
  `sha256:8c7054ceccb3d5d5c09e99b36faa20f10a2def4fade035aa6b0eca6280f8904a`
- Export `default` (direct) stored digest:
  `sha256:0235b2b54cc4e0548ba366962f32cdb7d0333788bf9d6209d76332ef27762d53`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/manage/appDocuments.stories.tsx` ::
    `DocumentsTab` (marker: "Documents")
- Unit tests importing it: `tests/unit/routes/ta/appDetails.summary.test.tsx`,
  `tests/unit/routes/ta/appDetails.test.tsx`,
  `tests/unit/routes/ta/appDocuments.rhf.test.tsx`,
  `tests/unit/routes/ta/appDocuments.test.tsx`

## ClientApp/src/routes/ta/manage/appMessages.tsx

- Current digest:
  `sha256:9c7fc627a9ed040e25c84aef0009abaf6c06439b10871001cb9bdb840c1650a0`
- Export `default` (direct) stored digest:
  `sha256:8e313c6fca6d83448b2640b8f8e2adaf5d89aaf9af147deb8e6da78e8e11ad04`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/manage/appMessages.stories.tsx` ::
    `MessagesTab` (marker: "No messages to display")
- Unit tests importing it: `tests/unit/routes/ta/appDetails.summary.test.tsx`,
  `tests/unit/routes/ta/appDetails.test.tsx`,
  `tests/unit/routes/ta/appMessages.test.tsx`

## ClientApp/src/routes/ta/organisationAndContactProps.ts — **REFACTOR**

- Current digest:
  `sha256:bf7c3d5fb59c88d8169ec7dec1c888d7a868c72b3ab7c5b3b54f581fe8af0509`
- Export `default` (nonvisual) stored digest:
  `sha256:c5e85a3440cc4b7337fa35dbebd5e942be5dea89d94f21c050c87f4d3894f96a`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/ta/props.test.ts`

## ClientApp/src/routes/ta/pollUploadProgress.ts

- Current digest:
  `sha256:313195c6038d32bf88134f111b2747f5e512d9fd34ed6436571e0581b20f019e`
- Export `PollUploadProgressOptions` (nonvisual) stored digest:
  `sha256:60fc5dc9c53de79308a97bc5e9475ef175ae89338ec218d52b8c95e6de1e136c`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `PROGRESS_RETRY_DELAY_MS` (nonvisual) stored digest:
  `sha256:60fc5dc9c53de79308a97bc5e9475ef175ae89338ec218d52b8c95e6de1e136c`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `pollUploadProgress` (nonvisual) stored digest:
  `sha256:60fc5dc9c53de79308a97bc5e9475ef175ae89338ec218d52b8c95e6de1e136c`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/ta/pollUploadProgress.test.ts`

## ClientApp/src/routes/ta/preApplication.tsx

- Current digest:
  `sha256:6a2771064d57ed9efbb93f7700853e16063266885f754498402b8b614cd050cd`
- Export `default` (direct) stored digest:
  `sha256:33acf30eae3014fbe0758c26a2523b2804b8bd3c0d3e91b1421d2ae564c1e845`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/preApplication.stories.tsx` ::
    `Default` (marker: "Pattern/type approval")
- Unit tests importing it: `tests/unit/routes/ta/preApplication.test.tsx`

## ClientApp/src/routes/ta/rhfSupportingDocuments.tsx

- Current digest:
  `sha256:e5ed381b77ce01192308fa8b6bbb82dbf3e93db4b3eb1902d1f0241b9940d57b`
- Export `default` (consumer) stored digest:
  `sha256:df909eea188b87194bc56dbc87ce057a1b9f46c98f4a93a216a13b17668ad839`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/manage/appDetails.stories.tsx` ::
    `DetailsTab` (marker: "Application status")
- Unit tests importing it: `tests/unit/routes/ta/appDetails.test.tsx`,
  `tests/unit/routes/ta/appDocuments.test.tsx`,
  `tests/unit/routes/ta/rhfSupportingDocuments.test.tsx`

## ClientApp/src/routes/ta/summary/ApplicationSummary.tsx

- Current digest:
  `sha256:6e5ecf1f1276d63fd859f41e8f940213db911c2bfe79e53c654e3f04d685cd7a`
- Export `default` (consumer) stored digest:
  `sha256:b24a5f301a3926dbaf2d298a739d77592ecfa60057d35e96afc257c45bf5b5ea`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/manage/appDetails.stories.tsx` ::
    `DetailsTab` (marker: "Application status")
- Unit tests importing it: `tests/unit/routes/ta/appDetails.test.tsx`,
  `tests/unit/routes/ta/summary/summaryParity.test.tsx`,
  `tests/unit/routes/ta/summary/summarySections.test.tsx`

## ClientApp/src/routes/ta/summary/ContactSummary.tsx

- Current digest:
  `sha256:766275ef700f834fcfd5ed7b07559fbd9b7bf427a7e60cd8d5d1122c67b693db`
- Export `default` (consumer) stored digest:
  `sha256:c3ab9efb50729598adf6628876f1ce014bcd7a569bdfb39b0d5910ba0c39b325`
  reviewer: codex-storybook-coverage-review
  - Claimed story:
    `ClientApp/src/routes/requestForQuote/requestForQuoteSummary.stories.tsx` ::
    `Editable` (marker: "Organisation and Contact")
- Unit tests importing it:
  `tests/unit/routes/ta/summary/summarySections.test.tsx`

## ClientApp/src/routes/ta/summaryAndSubmit.tsx

- Current digest:
  `sha256:c74fde91d15b5a4cc3b53fb3039224f94eb8a72101b5d4ab3d566aadc1da13bd`
- Export `default` (direct) stored digest:
  `sha256:5d88f401b12585bf99a36f6a07098c867172391f89c6fd5a069a1fb0012815db`
  reviewer: codex-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/summaryAndSubmit.stories.tsx` ::
    `Editable` (marker: "Organisation details")
- Unit tests importing it:
  `tests/unit/routes/ta/applicationForTypeApproval.test.tsx`,
  `tests/unit/routes/ta/components.test.tsx`

## ClientApp/src/routes/ta/summaryAndSubmitProps.ts — **REFACTOR**

- Current digest:
  `sha256:d5ccf43cbdbefb421b63e2cd091a6a06e080b9c32c344bc73560513fc704a7c0`
- Export `default` (nonvisual) stored digest:
  `sha256:9e07fffe2cf0321270d2d544043dd6264b630d94a80ef863ff659e372cd65aac`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/ta/props.test.ts`

## ClientApp/src/routes/ta/supportingDocuments.tsx

- Current digest:
  `sha256:fb3c142a0cc16b9e07c9ed68591f5d7cfe614f6ce78c7d10f33a73d1ad1e81f7`
- Export `default` (direct) stored digest:
  `sha256:83962b01728dd68da3ee29a3f0686ac13d5dcdad1c6691d8eef2df382f8cac71`
  reviewer: claude-storybook-coverage-review
  - Claimed story: `ClientApp/src/routes/ta/supportingDocuments.stories.tsx` ::
    `EditStep` (marker: "Upload one or more supporting documents")
- Unit tests importing it:
  `tests/unit/routes/ta/applicationForTypeApproval.test.tsx`,
  `tests/unit/routes/ta/components.test.tsx`,
  `tests/unit/routes/ta/supportingDocuments.test.tsx`

## ClientApp/src/routes/ta/supportingDocumentsHelpers.ts

- Current digest:
  `sha256:73cf0f6d30c7915f37dd8b584ee970442fdbd01fd4542f1f951f6d63b76cf613`
- Export `getFailedFileErrors` (nonvisual) stored digest:
  `sha256:47fc222f1f6fab6cb4d2f1222bbcdd46b95ceb283f8853b199fee2682351f2ed`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `handleAlertScroll` (nonvisual) stored digest:
  `sha256:47fc222f1f6fab6cb4d2f1222bbcdd46b95ceb283f8853b199fee2682351f2ed`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it:
  `tests/unit/routes/ta/supportingDocumentsHelpers.test.ts`

## ClientApp/src/routes/ta/supportingDocumentsProps.ts — **REFACTOR**

- Current digest:
  `sha256:e8d88e9b8c3eb67739737484e02f6b1ff70df0b3f2d4685a122142f1511c1ffa`
- Export `default` (nonvisual) stored digest:
  `sha256:2e33b36dd92f612fc9bb038020a0a54460db1cdd8bca7178263d892907d2ebc4`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/ta/props.test.ts`

## ClientApp/src/routes/ta/types.ts

- Current digest:
  `sha256:0541f5bbadcc26c48bee9d06f767290f250d705736d24738adf3281bc4381776`
- Export `ApplicationAndInstrumentStepDto` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `AttachmentFunction` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `FileStatus` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `RequestForPatternApprovalSummaryDto` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `SinglePageFormProps` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `SinglePageFormValues` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `TAApplicationAndInstrumentProps` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `TAOrganisationAndContactProps` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `TASummaryProps` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `TASupportingDocumentsProps` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `ValidationMessages` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Export `PatternApprovalDashboard` (nonvisual) stored digest:
  `sha256:a2c48c2bb3247eee7b21f9239b912001d98780e3acceaac92ec418168940d149`
  reviewer: codex-storybook-coverage-review
  - Claimed story: none (non-renderable)
- Unit tests importing it: `tests/unit/routes/ta/appDocuments.rhf.test.tsx`,
  `tests/unit/routes/ta/props.test.ts`,
  `tests/unit/routes/ta/rhfSupportingDocuments.test.tsx`,
  `tests/unit/routes/ta/supportingDocuments.test.tsx`,
  `tests/unit/routes/ta/supportingDocumentsHelpers.test.ts`,
  `tests/unit/routes/ta/types.test.ts`,
  `tests/unit/routes/ta/validation.test.ts`
