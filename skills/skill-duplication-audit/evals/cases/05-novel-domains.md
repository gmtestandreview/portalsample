# Skill audit cases (evidence complete as given; read no other files for evidence)

T1 (stages, not alternatives). Two skills.

- sql-migration-planner: "Use when planning a database schema migration." Outcome: ordered migration steps and a rollback plan. Takes requirements as input.
- sql-migration-runner: "Use when executing an approved migration plan against a database." Outcome: the migration applied. Requires a plan as input.

T2 (subset with only a gotcha and evals). Two skills.

- file-importer: "Use when importing CSV or TSV files into a table." Outcome: rows loaded.
- csv-importer: "Use when importing CSV files into a table." Outcome: rows loaded. Its body contains a gotcha (Excel-exported CSV may have a byte-order mark and semicolon delimiters; detect and strip) and an eval set; no other differences.

T3 (one-sided boundary). Two skills.

- api-doc-writer: "Use when writing API reference documentation from OpenAPI specs. Not for tutorials; use tutorial-writer for those." Outcome: reference docs.
- tutorial-writer: "Use when writing developer documentation and tutorials for an API." Outcome: tutorials and docs. Says nothing about api-doc-writer.

T4 (four-skill chain, all pure subsets). Four skills, none with specialization or contradictory guidance.

- summ-a: "Use when summarizing meeting transcripts into bullet points." Outcome: bullet summary.
- summ-b: "Use when summarizing meeting transcripts." Outcome: summary.
- summ-c: "Use when summarizing transcripts of meetings or calls." Outcome: summary.
- summ-d: "Use when summarizing transcripts of meetings, calls, or interviews." Outcome: summary.

T5 (explicit request plus hub-required pair). The user asks only to compare tf-fmt-all with each of the other two skills.

- tf-fmt: "Use when formatting Terraform files." Outcome: formatted files.
- tf-fmt-all: "Use when formatting Terraform or OpenTofu files." Outcome: formatted files.
- tf-fmt-tofu: "Use when formatting OpenTofu files." Outcome: formatted files.

T6 (description triggers). For each prompt, say whether this audit skill should activate and why: (a) "Is skill X redundant now that skill Y exists?" (b) "Merge skills X and Y into one SKILL.md." (c) "Which of these two skills is better written?" (d) "I'm adding a new skill; check it doesn't duplicate anything in skills/." Answer from the skill description alone.

For each case output compact classification(s), boundary or cluster handling, and any Needs Human Review. End with ONE required output block covering T1-T5.
