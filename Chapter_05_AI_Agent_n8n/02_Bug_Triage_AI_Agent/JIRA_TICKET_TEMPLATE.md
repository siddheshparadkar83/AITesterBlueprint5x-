# Jira bug triage proposal template

This template is for an existing Jira issue. Fetch and verify the issue before preparing a proposal. Do not treat it as permission to update Jira.

## Fetched issue

- **Issue key:**
- **Summary:**
- **Status:**
- **Current Severity:**
- **Current Priority:**
- **Relevant ticket facts:**

## Proposed triage

### Severity

- **Proposed value:** A verified allowed value, or `Keep current`
- **Evidence and rubric rationale:**
- **Unknown information:**

### Priority

- **Proposed value:** A verified allowed value, or `Keep current`
- **Evidence and rubric rationale:**
- **Unknown information:**

Evaluate Severity and Priority independently. Never infer one from the other or choose a default when facts are missing.

## Risk assessment

- **Risk statement:** Describe the possible adverse outcome and cite the Jira/user-provided evidence that supports it.
- **Impact:** Use the verified team scale if configured; otherwise state a qualified plain-language assessment.
- **Likelihood:** Use the verified team scale if configured; otherwise state a qualified plain-language assessment.
- **Mitigation:** State an evidence-grounded mitigation or `Not provided`.
- **Unknowns / assumptions:** List uncertainties explicitly; do not present them as facts.

## Exact Jira comment to be posted

```text
Risk assessment

Risk:
<Evidence-linked potential outcome>

Impact:
<Configured value or qualified assessment>

Likelihood:
<Configured value or qualified assessment>

Mitigation:
<Grounded mitigation or Not provided>

Unknowns:
<Known uncertainty, or None identified from the supplied information>
```

## Review and confirmation

Show the current values beside every proposed value and include the full comment. Ask the user to review the complete proposal. No Jira write is allowed until workflow logic verifies the exact raw message `CONFIRM TRIAGE` for the same authorized user, session, issue, and unexpired proposal.

If the user requests any edit, produce and show a new complete proposal. The previous confirmation cannot be reused.
