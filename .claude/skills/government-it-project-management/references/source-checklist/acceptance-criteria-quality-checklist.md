# Acceptance Criteria Quality Checklist for TMARS Web Portal & Dynamics 365 CRM Integration

This **Acceptance Criteria Checklist** is a comprehensive, evidence-based tool
for developers and QA testers of the TMARS Web Portal (a secure,
government-grade React/ASP.NET Core application) integrated with Dynamics 365
CRM. It complements the existing User Story checklist by focusing on the
**definition of done** for each user story through high-quality acceptance
criteria. Grounded in Behavior-Driven Development (BDD) best practices, it
ensures that acceptance criteria are clear, testable, and aligned with stringent
requirements for security, accessibility, and reliability. By following this
checklist, teams can avoid common pitfalls (ambiguity, missing edge cases, poor
testability) and produce acceptance criteria that serve as unambiguous,
executable specifications.

## Foundations of the Checklist

1. **Behavior-Driven Development (BDD) & Gherkin:** Leverages the BDD philosophy
   of using realistic examples to specify behavior. Acceptance criteria are
   written as Gherkin scenarios (Given/When/Then) – a format shown to improve
   shared understanding and product quality. Gherkin’s structured syntax
   (proposed by Fowler) makes criteria executable as tests, bridging
   communication between business and IT. A 2020 survey found that 71% of teams
   use the Given-When-Then format to capture examples, underscoring its
   industry-wide adoption.

2. **Specification by Example (SbE):** Embraces Gojko Adzic’s SbE principles,
   where concrete examples illustrate each rule or requirement. Using examples
   as acceptance criteria is **strongly correlated with higher product quality**
   in practice. This approach encourages covering normal and edge-case scenarios
   to flush out ambiguity and ensure completeness.

3. **Automated Traceability (Lucassen et al., 2017):** Encourages linking user
   stories to code via automated acceptance tests. In BDD, each scenario doubles
   as an acceptance test, refining user story requirements into step-by-step
   interactions. This provides “ubiquitous traceability” – a direct line from
   requirements to tested software behavior – aiding impact analysis and
   regression testing.

4. **Security Best Practices (ASD Essential Eight & Storms, 2015):** Aligns
   acceptance criteria with security requirements mandated for government
   systems. Scholarly and industry guidance advocate including security
   conditions in every story’s criteria. For example, **Andrew Storms (2015)**
   outlines that stories involving user input must have acceptance criteria for
   input sanitization and validation, and any story touching sensitive data must
   specify protections (encryption, restricted access). Additionally, for
   authentication/authorization features, criteria should cover both allowed and
   denied access cases (positive _and_ negative paths) and audit logging –
   reflecting ASD Essential Eight strategies like multi-factor authentication
   and privileged access controls.

5. **Accessibility Standards (WCAG 2.2 & Inclusive Design):** Incorporates
   accessibility criteria to ensure compliance with **WCAG 2.2** guidelines.
   Each user story affecting the UI should include accessibility-focused
   acceptance criteria (e.g. keyboard navigation, screen reader labels, color
   contrast). Industry experts note that accessibility AC span from technical
   WCAG success criteria to UX patterns. Teams must be aware of these
   requirements and explicitly write them into AC for effective testing. For
   instance, an acceptance scenario might state: _“**Given** a user on the page,
   **When** they use a screen reader, **Then** the page title is unique and
   describes the page content (per WCAG 2.4.2)”_.

6. **Agile Requirement Quality (IEEE 29148-2018 & BABOK v3):** Adapts classical
   requirements quality criteria to acceptance criteria. Like good requirements,
   acceptance criteria should be _unambiguous, complete, consistent, feasible,_
   and _verifiable_. IEEE 29148 emphasizes including boundary conditions and
   assumptions – reflected here by ensuring edge cases are accounted for. BABOK
   v3 highlights testability and traceability: acceptance criteria serve as the
   basis for test cases and must align with the underlying user story and
   business need.

---

## BDD Scenario Structure and Syntax

- **Use Gherkin “Given/When/Then” Format:** Write each acceptance criterion as a
  BDD scenario with a clear context, trigger, and outcome. For example, _“Given
  \[initial context] When \[action] Then \[observable result]”_. This
  standardized syntax ensures criteria are understandable to both business and
  technical team members. Each scenario should focus on **one specific behavior
  or rule** being verified (one **“When”** step per scenario is a good rule of
  thumb). _Example:_ _“**Scenario:** Valid CRM Record Creation **Given** a
  logged-in portal user with required permissions, and a complete form with
  valid data, **When** the user submits the form, **Then** a new contact record
  is created in Dynamics 365 CRM with the same data, and a success message is
  displayed on the portal.”_

- **Descriptive Scenario Titles:** Give each scenario a brief title that
  summarizes the behavior under test (as shown in the example above). This aids
  clarity and traceability when scanning test reports. The title should reflect
  the user story’s intent (e.g. _“Invalid Password – Access Denied”_,
  _“Successful Form Submission – Data Synced to CRM”_).

- **Narrative Style and Grammar:** Write steps in simple,
  **customer/business-friendly language**, avoiding technical jargon or
  UI-specific terms unless necessary. The steps should read like natural
  language requirements: past or present tense is common (e.g. “Given the user
  is on the login page…”). Maintain correct grammar and consistent terminology
  (use the same names for roles, data entities, etc., as in the user story to
  prevent confusion).

- **Atomic and Focused:** Keep each acceptance scenario **small and focused on a
  single outcome**. Do not combine multiple distinct verifications in one
  scenario (e.g. splitting “then X and Y and Z happens” into separate scenarios
  or using scenario outlines). This atomic approach makes scenarios easier to
  understand and less brittle in automation. If a complex workflow has many
  conditions, break it into multiple scenarios rather than one long scenario.
  This also facilitates selective test execution and faster failure isolation.

- **Avoid Duplication of Scenarios:** Ensure that each acceptance test scenario
  is unique in purpose; avoid writing two scenarios that test the exact same
  condition or business rule. **Duplicate scenarios** add noise and maintenance
  burden without increasing coverage. If similar scenarios exist for different
  user stories, consider abstracting them (perhaps one generic scenario in a
  shared feature file, or using a scenario outline with different examples)
  rather than repeating steps. This keeps the BDD specification lean and
  maintainable as the test suite grows.

- **Background/Context Reuse:** Use Gherkin’s `Background` section or reusable
  step definitions for common setup steps across scenarios. This prevents
  repetitive “Given” steps in every scenario and highlights what’s unique in
  each scenario. Consistent context setup across scenarios also reduces the
  chance of divergence or contradictions between scenarios.

## Clarity and Lack of Ambiguity

- **Unambiguous Language:** Write acceptance criteria in clear, specific terms
  to avoid misinterpretation. **Avoid vague words** like “efficiently,”
  “easily,” “appropriate,” or quantifiers like “many” or “often” without
  quantification. Every condition should have a single interpretation. For
  example, instead of “Then the page loads quickly,” specify “Then the page
  loads within 2 seconds” (if performance is a criterion). Instead of “user data
  is handled securely,” specify the security measure or outcome (e.g. “data is
  encrypted in transit using TLS”). Clarity in wording ensures that developers,
  testers, and stakeholders all share the same understanding.

- **Single Responsibility per Criterion:** Each acceptance criterion (or
  scenario) should address **one aspect of the user story**. This avoids
  entangling multiple conditions that might lead to confusion. If a user story
  has multiple acceptance conditions (e.g. different business rules or UI
  validations), list them as separate bullet criteria or separate Gherkin
  scenarios. This one-to-one mapping of scenario to behavior ensures clarity
  about what’s being tested.

- **Business Domain Terminology:** Use the **language of the domain and users**
  in describing scenarios. Refer to roles, data, and processes using the same
  terms the business or end-users use (e.g. “client”, “case record”, “submission
  date”). This aligns acceptance criteria with business context and reduces
  ambiguity. It also makes criteria more reviewable by non-technical
  stakeholders. Avoid internal technical terms (tables, field names, etc.) in
  the scenarios unless the story explicitly involves them (in which case explain
  them). Scenarios should essentially read like concise **business rules
  examples**.

- **No Implicit Assumptions:** Do not assume any hidden knowledge or context –
  spell out preconditions in the **Given** steps explicitly. For example, if a
  user must be logged in or have a certain role, state “Given I am logged in as
  an Administrator” rather than assuming the reader knows this. If an external
  system (like the CRM) is expected to be available or pre-populated with data,
  include that setup in the Given. This ensures the acceptance test is
  reproducible and that all team members understand the full context. Any
  **assumptions or dependencies** (e.g. user has an email configured, a feature
  flag is on, etc.) should be made explicit either in the scenario or in notes
  attached to the story.

- **Concrete Examples for Abstract Rules:** When a acceptance criterion relates
  to a rule or calculation, provide a **concrete example** to eliminate
  ambiguity. For instance, instead of AC saying “The system calculates overtime
  correctly,” use an example: “Given an employee worked 45 hours in a week, When
  the payroll runs, Then the overtime pay is calculated as 5 hours at overtime
  rate.” Concrete values and scenarios make abstract requirements tangible and
  testable. (This often comes out during the Three Amigos or example-mapping
  discussions prior to development.) If the team identified specific examples
  during refinement, include them in the acceptance criteria to capture that
  shared understanding.

- **Humanised Language (New):** The user story is written in a natural,
  conversational tone to improve clarity and human resonance. Avoids overly
  mechanical or generic phrasing that may suggest it was AI-generated. Stories
  should sound like they were written by and for real people, supporting
  authenticity and empathy. For example: Poor: "System should allow content
  ingestion from heterogeneous input channels." Better: "As a content manager, I
  want to upload stories from different sources, so I can keep the news feed
  fresh."

## Completeness and Coverage of Scenarios

- **Cover Normal and Alternate Flows:** Ensure acceptance criteria cover the
  **primary success scenario** _and_ important alternate/exception paths. At
  minimum, there should be scenarios for the expected “happy path” and for
  significant “edge cases” or error conditions. For example, if a story is about
  user login, criteria must include successful login as well as failure cases
  (wrong password, account locked, etc.). If the story involves form input,
  include criteria for valid input _and_ examples of invalid input handling
  (e.g. “Then an error message is shown if the email format is incorrect”). This
  thoroughness prevents **missing edge cases**, which are a common pitfall. Each
  business rule or condition implied by the user story should be backed by at
  least one acceptance scenario (this aligns with _Example Mapping_ practice
  where each rule gets its examples).

- **Boundary Values and Edge Conditions:** Think about boundary or extreme
  values and include acceptance criteria for them when relevant. If a field
  accepts 1-100, have an example for 100 (upper bound) and perhaps 101 (just
  beyond) to define expected behavior at the limits. For date ranges, include
  the first/last permissible dates as examples. If the portal integrates with
  CRM data, consider edge conditions like “no data returned” or “CRM service is
  slow/unavailable.” Including boundaries in criteria ensures the story’s
  completeness (akin to IEEE’s recommendation to address boundary conditions in
  requirements). It’s cheaper to define and agree on the outcome of edge cases
  up front than to discover gaps during testing or production.

- **Negative Scenarios (What _should not_ happen):** Incorporate **negative
  tests** in acceptance criteria: scenarios describing undesirable situations
  and confirming the system’s safe behavior. E.g., “Given a normal user, When
  they attempt to access an Admin-only page, Then access is denied with a 403
  error.” Such criteria explicitly document security and business rules
  (who/what is _not_ allowed) and ensure these paths are tested. Another
  example: “When an invalid file type is uploaded, Then the upload is rejected
  and the user is informed of allowed types.” Negative scenarios often reveal
  hidden assumptions and are critical in a secure system (preventing
  unauthorized actions, bad data, etc.). Ensure that for each “positive”
  criterion, you consider if a corresponding “negative” case needs to be
  specified.

- **One Scenario per Rule or Condition:** If the user story description or
  conversation revealed multiple acceptance “rules” (business conditions),
  enumerate scenarios for each. For instance, _“As a user I can filter search
  results”_ might entail rules like filtering by date, by category, by keyword,
  etc. Each of these should get at least one scenario. Using _Example Mapping_
  terminology, each **blue card rule** would be validated by one or more **green
  card examples**. This ensures no acceptance rule is left untested. A rule that
  combines multiple criteria may warrant multiple scenarios to cover each aspect
  (e.g. a complex validation might need one scenario per validation rule, plus
  one that combines them).

- **Avoid Overlapping Scenarios:** While striving for complete coverage, ensure
  scenarios are not redundant. Each scenario should add distinct coverage. If
  two scenarios only vary in superficial details but test the same logic,
  consolidate them (possibly using a Scenario Outline with a table of
  variables). Redundant tests not only waste effort but also can give a false
  sense of security or lead to maintenance headaches. During review, ask: “What
  unique condition does this scenario cover that others don’t?” If none, it
  might be safe to remove or merge it.

- **Trace to Story Acceptance Criteria List:** It’s good practice to list
  acceptance criteria in bullet form (plain English) in the story and then have
  matching Gherkin scenarios implementing them. Make sure **every bullet
  acceptance criterion from the user story is realized by one or more Gherkin
  scenarios**, and conversely, every scenario maps to a stated criterion or
  rule. This bidirectional coverage check ensures the written scenarios truly
  fulfill all promised acceptance conditions (no criterion is left untested, and
  no test scenario is out-of-scope of the story).

## Testability and Verifiability

- **Testable and Observable Outcomes:** Write each acceptance criterion so that
  it describes an outcome that can be **objectively verified** by a test (human
  or automated). Avoid subjective language like “easy to use” or “looks good” –
  if a usability aspect is important, define it in measurable terms (e.g. “Then
  the user can complete the workflow in no more than 3 clicks” or reference a UX
  guideline). Prefer outcomes that result in a change in system state, output,
  or visible behavior. For instance, “Then the user profile is saved” can be
  verified by checking the database or UI, whereas “user feels satisfied”
  cannot. **Every “Then” should be something a tester can check** (via the UI,
  API, logs, or DB) to determine pass/fail.

- **Clear Pass/Fail Criteria:** The criteria should implicitly answer: “How do
  we know if this scenario passed or failed?” If additional clarification is
  needed (e.g. what does “data is saved successfully” entail exactly?), refine
  the wording to eliminate doubt. If success involves multiple things (like UI
  message _and_ DB update), spell out both, or split into separate criteria.
  Incorporate expected messages, state changes, or outputs into the “Then” step
  explicitly (e.g. _“Then the system displays a confirmation number and an email
  is sent to the user’s address on file”_). This makes the success condition
  concrete and testable.

- **No Internal Implementation Details:** Ensure the acceptance criteria focuses
  on _externally observable behavior_ of the system (black-box perspective).
  **Do not describe internal system steps** or design decisions in the criteria
  – e.g. don’t write “Then the system calls the CRM API and writes to the Audit
  table” as an acceptance criterion (that’s an implementation detail). Instead,
  specify the externally visible result: “Then the data is successfully
  transmitted to the CRM (e.g., the new record appears in CRM) and an audit
  entry is recorded.” How it’s done (via API call, etc.) is up to the dev and
  can be tested indirectly. This keeps criteria at the correct abstraction level
  and ensures they remain valid even if implementation changes (the API call
  might change to a different integration method, but the _outcome_ remains:
  data arrived in CRM). Tests should ideally not break due to behind-the-scenes
  refactoring.

- **Measurable Non-Functional Requirements:** When including non-functional
  criteria (performance, security, etc.), express them in measurable terms so
  they are testable. For example, “Then the page response time is under 2
  seconds for 95% of requests” or “Then the system can support 100 concurrent
  users without error.” If using BDD for such requirements, you might encode
  this as a scenario using a monitoring or load test tool. The key is that there
  is a clear threshold for success. This ties back to the _verifiability_
  attribute of good requirements – if you can’t practically verify a condition,
  it may need to be rephrased or scoped differently.

- **Consistent Level of Detail:** All acceptance criteria for a story should be
  written at a similar level of detail – typically high-level behavior. Don’t
  mix very high-level criteria with overly low-level ones in one story, as it
  leads to confusion on what to test at which level. If one criterion is
  detailed (e.g. specific UI field-level behavior) and another is broad (overall
  system outcome), consider breaking the story or aligning the detail. The
  acceptance criteria collectively should provide a complete picture of “done”
  at one granularity. This also makes automation easier, as you don’t end up
  writing one scenario that’s effectively an end-to-end test and another that’s
  a unit test.

- **Peer Review for Testability:** As a safeguard, have testers review the
  acceptance criteria during refinement or planning. They should challenge any
  criterion that is not clear how to test. A criterion might be reworded for
  test clarity (e.g. instead of “data is saved correctly”, specify some
  verification like “data can be retrieved and matches input values”). If an
  acceptance criterion can be interpreted in multiple ways in testing, it should
  be clarified now – preventing ambiguous tests later. This practice aligns with
  the idea that **acceptance criteria are a team responsibility** and promote
  shared understanding.

## Security and Privacy Criteria

- **Input Validation and Sanitization:** For any user story that **accepts
  input** (forms, file uploads, API inputs), include acceptance criteria to
  handle malicious or invalid input. _“Then the input is validated and any
  invalid data is rejected with an error message”_. For example: _“Given the
  user enters script code in the comment field, When they submit, Then the input
  is rejected and an error ‘Invalid characters’ is shown, with no data saved.”_
  This ensures developers implement proper validation and guards against
  injection attacks. As one security expert notes, **failure to sanitize input
  is a root cause of many attacks**, so every story with input should have
  criteria that the data is validated against expected formats/ranges. Never
  assume “it’s obvious” – explicitly state it in acceptance criteria so that it
  gets tested. This aligns with OWASP and Essential Eight principles of robust
  input validation.

- **Protection of Sensitive Data:** If the user story involves **personal or
  classified data** (names, addresses, identifiers, etc.), include criteria
  addressing data protection. For instance, _“Then the system stores the
  password encrypted”_ or _“Then the user's tax file number is masked in the UI
  except for the last 3 digits.”_ Any story touching sensitive categories like
  PII/PHI should note how data is handled securely. Acceptance criteria might
  reference compliance standards (e.g. _“audit logs must not contain plain-text
  passwords”_ aligning with the Information Security Manual). Government-grade
  systems often require demonstrating these controls in tests – writing them in
  the acceptance criteria ensures they are not overlooked. If data is
  transmitted to CRM, criteria should state it uses a secure API (TLS) and that
  no unauthorized system can intercept it (this might be verified via security
  testing).

- **Authentication & Authorization (AAA) Scenarios:** For features related to
  login, user roles, or access control, always include **both successful and
  unsuccessful** access scenarios. E.g., _“Given a valid username/password, When
  the user attempts login, Then they are granted access (dashboard displayed).”_
  and _“Given an invalid password, When login is attempted, Then access is
  denied with an error message.”_ Similarly, if the story adds a new role or
  permission, include criteria for what an **authorized user** can do _and_ that
  an unauthorized user **cannot** do that action. This dual scenario approach
  (permit vs. deny) catches security gaps early. It is also advisable to include
  an AC for **session management or MFA** if applicable (e.g. _“Then a second
  factor is required to complete login”_ for multi-factor auth). These criteria
  enforce ASD Essential Eight controls like multi-factor authentication and
  least privilege access.

- **Audit Logging and Traceability:** In a high-security environment,
  significant actions should produce audit logs. If the user story’s feature is
  security-relevant (logins, data changes, admin actions), consider an
  acceptance criterion such as: _“Then an audit log entry is created with user
  ID, timestamp, and action details.”_ For example, a delete action story might
  have _“Then the deletion is recorded in the audit log.”_ Including this in AC
  ensures the logging requirement isn’t forgotten during development or testing.
  It also provides traceability for compliance (e.g. meeting an ISO/ISM
  control). Make the expected audit content clear enough that testers can verify
  it (perhaps via database or log inspection in a test environment).

- **Reuse Security Standards and Test Frameworks:** Where possible, reference
  known security criteria. For instance, you might link to OWASP Top 10 or
  Essential Eight in a criterion (_“Then this feature meets OWASP injection
  prevention guidelines”_ or _“Then idle sessions are logged out after 15
  minutes (per security policy)”_). There are also BDD security frameworks (e.g.
  **BDD-Security by Continuum** as noted by practitioners) that provide generic
  security scenarios. Leverage these by referencing or including such scenarios
  if applicable (for example, a generic AC for authorization could be included
  to automatically test role-based access). This not only strengthens security
  testing but also shows traceability to security requirements in the acceptance
  documentation.

- **Privacy and Consent:** If relevant (for features involving personal data use
  or storage), include acceptance criteria for privacy compliance. E.g., _“Then
  the user’s data is used only for \[stated purpose] and a consent record is
  stored”_ or _“Given the user has not consented to tracking, When they use the
  service, Then no analytics cookies are placed.”_ Government systems often have
  strict privacy mandates, so encoding them in acceptance criteria ensures the
  implementation meets those mandates and testers verify them.

## Accessibility and UX Criteria

- **WCAG 2.2 Compliance Points:** Each UI-oriented story should list acceptance
  criteria mapping to **specific WCAG 2.2 success criteria** or best practices.
  For example: _“Then all images in this feature have appropriate alternative
  text (WCAG 1.1.1)”_, _“Then focus order follows a logical sequence when
  tabbing through the form (WCAG 2.4.3)”_, or _“Then error messages are
  descriptive and programmatically associated with form fields (WCAG 3.3.1)”_.
  By referencing WCAG guidelines, you make the expected standard explicit.
  Testers can then check those during accessibility testing. It’s not necessary
  to quote the guideline in full, but providing the reference (as in the page
  title example earlier) is helpful. Accessibility AC should cover: keyboard
  navigation (tabbing, focus visible), screen reader announcements for new
  content or custom controls, color contrast for text, and
  resizing/magnification support, as applicable to the story’s UI changes.

- **Assistive Technology Scenarios:** Consider writing one or more BDD scenarios
  from the perspective of an assistive technology user. For instance:
  _“**Scenario:** Keyboard-Only Navigation – **Given** I am using only a
  keyboard, When I navigate to the modal dialog, Then focus is trapped within
  the dialog until I close it (no focus loss).”_ Or _“**Scenario:** Screen
  Reader Form Labels – **Given** a screen reader user on the registration form,
  When they move focus to each input, Then the screen reader announces an
  accessible label and any instructions or errors for that field.”_ These
  scenarios describe the expected behavior in terms of UX for users with
  disabilities, which can then be manually tested (or automated with
  accessibility testing tools). They ensure that accessibility isn’t just
  checked after the fact but is part of the “definition of done.” As Bogdan
  Cerovac notes, good accessibility criteria often mirror the expected UX
  patterns for a component, ensuring a custom widget works like its native
  equivalent.

- **Multiple Scope Levels:** Include acceptance criteria that address
  **page-level, component-level, and process-level** accessibility. For example,
  page-level (each page has a unique title, language set, proper headings
  structure), component-level (each interactive control is reachable and
  labeled), and process-level (e.g., workflow instructions, timeouts with
  warnings). Breaking it down ensures nothing is missed. You might have a
  general AC for the page (like the title example), and specific AC for any new
  component introduced (like a custom dropdown’s keyboard interaction).

- **UX Consistency and Feedback:** If the story involves UI/UX changes,
  acceptance criteria should capture any **user experience requirements** beyond
  pure functionality. For instance: _“Then the system displays a loading spinner
  while data is being fetched”_ (so that the user has feedback on a long
  operation), or _“Then the confirmation dialog follows the standard design
  system pattern.”_ These criteria ensure the feature not only technically works
  but also provides the intended user experience. They are especially important
  for a consistent portal experience. While UX aspects can be subjective,
  phrasing them as criteria (possibly with reference to design system guidelines
  or research findings) makes them testable to a degree (the QA can verify the
  spinner appears, etc.). Always tie these to a clear condition (e.g. “shows
  spinner after 0.5s of inactivity”) to keep them verifiable.

- **Collaboration with Designers:** Ensure that designers or accessibility
  specialists contribute to writing these acceptance criteria. They might
  provide the exact wording or criteria for color contrast or focus management.
  According to accessibility testing practices, having criteria defined up front
  guides developers and allows QA to prepare the right tools (like screen
  readers or automated a11y checkers) to validate them. It also educates the
  whole team on accessibility by making it part of every story’s acceptance
  criteria.

- **Continuous Improvement:** If an accessibility issue was previously found in
  similar features, add it as a criterion in new stories to prevent regressions.
  Over time, you’ll build a set of reusable accessibility acceptance criteria
  (for example, a checklist item that any new form must meet WCAG form labels
  and error handling rules). You can even templatize these (some teams maintain
  a list of common accessibility AC to include where relevant). This ensures no
  “obvious” requirement is forgotten simply because the team was focused on core
  functionality.

## Performance and Reliability Criteria (Non-Functional)

- **Performance Benchmarks:** For stories related to performance (or features
  that might impact performance), include specific acceptance criteria for
  performance requirements. For example: _“Then the report generation completes
  within 5 seconds for 1000 records”_ or _“Then the page loads with less than 1
  MB of resources”_. These give developers a target and allow testers to
  validate with tools or profiling. If a story isn’t explicitly about
  performance, usually you don’t need such criteria, **unless** it’s likely to
  be a bottleneck (use judgment or past incidents to decide). Government portals
  often have SLAs or responsiveness guidelines, so when relevant, tie the
  acceptance test to those. Such criteria can be tested via automated
  performance tests or during sprint demos (e.g. measuring load times). The key
  is that any **quantitative requirement** gets a corresponding quantitative
  test.

- **Scalability and Load:** If the feature will be used concurrently or with
  high volume, acceptance criteria should consider those conditions. E.g.,
  _“Then the system supports at least 50 concurrent users performing this action
  without errors or degradation.”_ While full load testing might be outside
  individual story testing, including this criterion signals the need for a
  performance test or that this story’s definition of done includes some
  scalability verification (maybe in a staging environment). It also drives
  design decisions (developers might implement caching or batching if they know
  this requirement). Make sure any such number is realistic and comes from
  requirements or capacity planning, not arbitrary. If exact numbers are
  unknown, you might specify a scenario with a moderate load to simulate (e.g.
  using a test script to simulate 10 users simultaneously in a test environment
  and verifying no errors).

- **Reliability and Failure Handling:** Include criteria for how the system
  handles failures or downtime, especially in an integrated environment (Portal
  <-> CRM). For instance, _“Then if the CRM is unreachable, the user’s data is
  queued for later synchronization and a notification is shown.”_ Or _“If the
  submission fails due to a network error, the user can retry the operation.”_
  These criteria capture reliability and resilience requirements. They can be
  tested by simulating outages or errors (QA might disable a network call or use
  a stub to force an error). Including them ensures the story isn’t “done” until
  failure modes are considered and handled gracefully. It also aligns with
  Essential Eight’s focus on resilience (e.g., regular backups criterion – while
  not directly testable in story, you might have a criterion that “data is not
  lost if service X is down”).

- **Operational Monitoring Hooks:** In a high-stakes system, you might have
  acceptance criteria for logging or monitoring, similar to audit logs. For
  example, _“Then the system raises an alert in monitoring if this background
  job fails”_ or _“Then a retry is logged with level WARNING if third-party API
  times out.”_ These are more for ops/DevOps, but including them in the story’s
  AC (when critical) means devs will implement and testers or DevOps can verify
  them. It’s part of defining “done” for reliability concerns beyond just the
  immediate functionality.

- **Compliance and Standards:** If the story outcome needs to comply with a
  standard or regulation (security, accessibility, etc.), include an AC stating
  that compliance. We’ve covered WCAG and security; similarly, if there’s a
  performance standard (like response time requirements from a government
  digital service standard), reference it. For example, _“Then the feature meets
  the Digital Service Standard response time requirement of <3 seconds for
  median load.”_ This makes often implicit requirements explicit in the story.
  While you might not “test” compliance like a pass/fail in automation, you can
  review or measure it during acceptance. Including it in AC ensures
  accountability.

- **Traceable Quality Requirements:** Acceptance criteria for non-functional
  aspects should be traceable to higher-level quality requirements or SLAs. If
  the project has a Quality Attributes document (for performance, security,
  etc.), tie your wording to it. This fulfills traceability (one of our
  foundations), showing each quality target is verified somewhere. For instance,
  if the architecture mandates support for 10k users, ensure some story (or set
  of tests) includes that. By writing it as AC, you link the user story to that
  architectural requirement in a testable way.

`Note: Non-functional criteria might not apply to every user story. Use this section where appropriate – typically for stories introducing new pages, major processing tasks, or critical user flows. Keep them concise to avoid turning every story into a performance test plan, but never ignore an essential quality requirement.`

## Traceability and Maintainability

- **Linkage to Requirements and Tests:** Each acceptance criterion should be
  traceable back to a higher-level requirement (epic, regulation, user need) and
  forward to test cases. In practice, this means using consistent identifiers or
  references. For example, if using Azure DevOps or Jira, you might number the
  acceptance criteria and later map test case IDs to them. The goal is that one
  can **trace from a user story’s acceptance criteria to implemented code and
  automated tests** with ease. BDD facilitates this by making the scenarios the
  actual tests – the scenario _is_ the acceptance test which executes against
  the code. Leverage that by keeping feature files under version control and
  maybe tagging scenarios with relevant IDs (like “@REQ-123”). Good traceability
  allows quick impact analysis: if a requirement changes or a test fails, you
  can pinpoint which story/criterion is affected.

- **Unique and Descriptive Scenario IDs:** If your toolchain supports it, give
  each scenario a unique tag or identifier (some teams use tags like
  @Story123Scenario1). This makes it easier to reference in discussions and in
  defect reports. For example, a bug report can say “fails acceptance criterion
  Story123#3 (Invalid password attempt)”. It’s much clearer than describing the
  scenario in prose each time. Ensure these IDs are maintained as scenarios
  evolve.

- **Maintainable in the Long Term:** Treat acceptance criteria and their
  automated tests as living documentation. As features change, update the
  criteria to match (don’t let them get outdated in the user story or feature
  file). The criteria should always reflect the current expected behavior of the
  system. If a story’s scope changes during a sprint, update the AC accordingly
  – they are not a static contract if circumstances change (though any change
  should be agreed upon by team and stakeholder). The **IEEE 29148** principle
  of _modifiable requirements_ applies: structure criteria so they can be edited
  or expanded without causing confusion. For example, keep one bullet per idea
  (easy to add/remove), and avoid overly intertwined wording.

- **Avoid Over-Specific Details:** To keep criteria maintainable, avoid encoding
  values or UI text that is likely to change arbitrarily. For instance, instead
  of _“Then the error message says ‘Your session has timed out after 15 minutes
  of inactivity’”_, you might say _“Then the user is informed that their session
  timed out due to inactivity.”_ The exact phrasing can be checked in UI copy,
  but if it’s not crucial to specify, don’t hard-code it in the acceptance
  criterion. This way, if content changes (common in gov projects for wording
  tweaks), you might not need to rewrite tests. However, do specify anything
  that affects functionality or user understanding materially.

- **Consistent Formatting and Template:** Maintain a uniform style for writing
  acceptance criteria across the team. This could mean always starting with
  “Given ..., When ..., Then ...” for scenarios, or a standard bullet list style
  for non-scenario criteria. A consistent format (perhaps provided by a template
  or checklist) improves readability and ensures no aspects are forgotten. For
  example, a template might remind authors to include a “negative case”
  criterion, or an “accessibility check” if UI. Consistency also helps with
  automated parsing tools if you use any (like AQUSA for user stories, there are
  similar linters for Gherkin).

- **Impact on Automated Test Suite:** Keep an eye on the size and run-time of
  the automated BDD test suite. As stories add more acceptance tests, ensure
  they are still providing value and not overly overlapping. If tests become too
  slow or flaky, it undermines their usefulness. It’s part of maintainability to
  occasionally refactor the acceptance tests. For instance, if two scenarios are
  similar, maybe they can be merged with a scenario outline; if a scenario is
  too UI-heavy and flaky, maybe it can be partly covered by an API test. The
  acceptance criteria should be written in a way that allows such flexibility
  (focus on outcome, not the how), so that the underlying automation can evolve
  without needing to rewrite the criterion. This separation of concerns makes
  the criteria robust to changes in the test approach (UI vs API, etc.).

- **Documentation and Audit Trails:** In a government context, traceability is
  key. Ensure that each acceptance criterion can be mapped in the project
  documentation for audits or IV\&V (Independent Verification & Validation).
  This might involve maintaining a Requirements Traceability Matrix (RTM) where
  each criterion is a line item traceable to a requirement and a test case.
  While this is more process than writing, the way you write and label criteria
  can facilitate it. Use consistent naming for features and scenarios so that an
  auditor can easily match “User Story 100 AC #2” to an implemented test result.
  Traceability is not just for internal convenience but often a contractual
  requirement in gov projects.

- **Continuous Refinement:** Finally, regularly revisit and refine the
  acceptance criteria checklist itself (this document). As the team learns, for
  example, that certain types of criteria were missed or could be improved
  (maybe something about data migration or specific integration quirks), update
  the checklist to include those. It’s a living artifact, much like the user
  story checklist, and should evolve with lessons learned. Scholarly frameworks
  emphasize continuous improvement in requirements quality – incorporating
  feedback from test results, defects, and stakeholder review will make future
  acceptance criteria even better.

---

**Note:** While this checklist is extensive, teams should apply it
pragmatically. High-quality acceptance criteria help ensure completeness and
testability, but they should remain **concise and focused**. Aim for the minimum
number of scenarios that thoroughly cover the story’s behavior and quality
requirements. This keeps the BDD practice sustainable – delivering a clear
**definition of done** without excessive overhead. By integrating security,
accessibility, and other quality concerns into acceptance criteria from the
start, the TMARS project can _“shift left”_ on quality, catching issues early
and meeting government standards with confidence. Each acceptance criterion is
not just a box to tick – it’s a concrete expression of how the software should
behave, **ready to be automated** (e.g. via Cucumber and Playwright integration)
and validated continuously as the system evolves. By following this checklist,
the team ensures every user story delivers not only a functional increment, but
one that is **done right** – aligned with user needs, robust against misuse,
accessible to all users, and verifiably secure.

**Sources:**

- Ferreira, A. _et al._ (2022). _Guidelines for Writing Agile Requirements with
  User Stories and Acceptance Criteria_ – defines acceptance criteria as
  conditions of satisfaction and advocates Given-When-Then format.
- Adzic, G. (2020). _Specification by Example – 10 Years Later_ – reports
  correlation between example-driven acceptance criteria and higher product
  quality; notes Given/When/Then as the dominant format.
- Dalpiaz, F. _et al._ (2017). _Behavior-Driven Traceability_ – proposes linking
  user stories to code with automated BDD tests, showing scenarios mirror user
  interactions and enable ubiquitous traceability.
- Storms, A. (2015). _Writing Security Acceptance Criteria in Agile_ –
  recommends including security-related AC in every story, e.g. input
  validation, data protection for sensitive info, auth success/failure cases and
  audit logging (“permit and deny” scenarios).
- Cerovac, B. (2020). _Accessibility and Acceptance Criteria_ – emphasizes
  writing accessibility AC (focus indicators, ARIA roles, etc.) and provides
  examples of using Gherkin for WCAG criteria.
- ACSC Essential Eight (2017) – Australian cyber-security baseline guiding
  inclusion of MFA, least privilege, patching, and other controls. (Ensure
  relevant Essential Eight mitigations are reflected in security acceptance
  tests as applicable).
- IEEE 29148-2018 – Systems and SW Requirements standard, for qualities like
  unambiguous, complete (with boundary cases), and verifiable requirements,
  which inform this checklist’s focus on clear, testable acceptance criteria.
- Cucumber BDD & Example Mapping (Wynne, 2017) – agile practice of deriving
  rules and examples for user stories, ensuring coverage of all scenarios
  through collaborative discussion.
- Binamungu, L. _et al._ (2018). _Detecting Duplicates in BDD Specifications_ –
  warns that duplicate or redundant scenarios reduce maintainability of test
  suites, reinforcing the need for unique, purposeful acceptance tests.
