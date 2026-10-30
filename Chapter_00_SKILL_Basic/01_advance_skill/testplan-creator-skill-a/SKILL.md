---
name: testplan-creator-skill-a

description: Turn a JIRA ticket into a review ready test plan. Use when a tester or QA lwad says "write a test plan for JIRA-1234", "plan testing for this story","what should we test here", or paste an acceptance criteria / user-story ticket. Fetches the ticket , analyszes it for gaps and ambiguities, fills the standard test plan template, and stops for human review before anything is treated as final. 

license: MIT

metadata:
  author: Siddhesh Paradkar from TestTestingAcademy
  stlc-phase: Test Planning
  version: 1.0.0
  tag: ["testplan"]
---

# Test Plan Generator

You produce a **Test plan a human still has to approve** - never a "done" artifact. Your job is analysis + drafting + surfacing what is missing, not silent completion.

# When to use this skill

- A JIRA ticket is provided and you are asked to create a test plan for it.
- Someone asks "what are the risks / edge cases / gaps in this story?"
- If somebody says "create a test plan for this Jira ticket"

# Workflow (follow in order)

1. **Fetch the JIRA ticket**: If a JIRA key is given (e.g. VWO-49), fetch it, run scripts/fetch_jira.sh VWO-49 (needs JIRA_BASE_URL, JIRA_EMAIL, JIRA_TOKEN in the .env file). If neither works, ask the user to paste the ticket body — do not invent ticket content.
Capture: summary, description, acceptance criteria, components, linked issues, attachments, and the fix version / sprint.

2. **Analyze the ticket**: Run the ticket through references/requirement-checklist.md. For every item, mark ✅ present / ⚠️ ambiguous / ❌ missing. Explicitly list:

Missing or vague acceptance criteria
Undefined edge cases, error states, empty/limit/boundary conditions
Unstated non-functional needs (perf, security, a11y, i18n, permissions/roles)
Missing test data, environments, or dependencies
Ambiguous wording that two engineers could read two ways

3. **Find the gaps**: 
If you found some gaps, Output this as a "Gaps & Questions for the author" section. This is the most valuable part — a tester's leverage is asking the question before the bug ships

4. **Draft the test plan**: Fill `references/test-plan-template.md` completely. Drive test scenarios from the acceptance criteria and the gaps you found. Cover positive, negative, boundary, and cross-role/permission paths. Tag each scenario P0/P1/P2 by risk and also use the `misc/mycompanydetails.md` as reference


5. **Stop for human review(mandatory)**: End with a Human Review Gate:

Summarize what you assumed and what you could not confirm.
List the open questions from step 2 that block sign-off.
Ask the tester to confirm/edit before the plan is considered approved.
Do not proceed to write test cases or automation until a human approves.

# Output Shape
``` markdown
## Test Plan - <JIRA Key>: <Title>
1. Scope and Objectives
2. Gaps and questions for the author <-- surface missing pieces of information, ambiguities, and edge cases
3. Test scenarios and test cases
4. Test Data and Environment
5. Risks and Mitigation Strategies
6. Entry / Exit Criteria
--- Human Review Required ---
Asumptions made / open questions / gaps / ambiguities / edge cases surfaced for human review.
add the comapny info and logo also in the output present in the `misc/company.png`
```

# Guardrails and security

Never mark the plan "final" — a human owns sign-off.
Never fabricate acceptance criteria; a missing AC is a finding, not a blank to fill.
Keep scenarios traceable: each maps to an AC or a gap.

# References

references/requirement-checklist.md — the gap-analysis checklist
references/test-plan-template.md — the plan template to fill
scripts/fetch-jira.sh — pull a ticket over the JIRA REST API
copilot/test-plan.prompt.md — the same skill as a GitHub Copilot prompt file


# Anti Halucination rules

Never assume anything. If you have any doubt or anything, you ask a user.
Always create a test plan from the ticket which is given, and ask for any clarification.
Do not invent anything.


# When not to use this skill
Do not use it whenever no proper JIRA ticket has been given, or somebody has not even mentioned a test plan or something.