# n8n workflow blueprint

This is a build blueprint, not an importable workflow export. Verify project access, Jira field metadata, allowed values, n8n node support, and the organization's triage rubric before configuring write operations.

## Nodes and responsibilities

1. **Authenticated Chat Trigger** — receive the raw user message and trusted user/session identity. Restrict execution to authorized users.
2. **Request and authorization validator** — parse the issue key from the user request, validate its format and permitted Jira project, and verify that the authenticated user may triage it. Do not derive identity or access from ticket content.
3. **Proposal-state lookup** — read any pending proposal by authorized user, chat session, issue key, and proposal ID. State is authoritative; LLM memory is not.
4. **Confirmation router** — evaluate the raw incoming message for exact `CONFIRM TRIAGE`. Continue only if a valid, unexpired, pending proposal belongs to this user/session/issue, its proposal content has not changed, and the issue remains authorized.
5. **Jira issue lookup** — fetch the requested issue and the fields needed for triage. Return current field values and relevant ticket facts to the user. Distinguish not-found, permission, and service errors.
6. **Triage agent** — use the verified ticket data and user's extra context to ask clarifying questions or prepare a proposal. Connect the selected chat model and optional session memory. The agent drafts recommendations and comment text; it cannot execute Jira operations or validate confirmation.
7. **Proposal validator and state writer** — validate the agent's proposed structure against field IDs/options and the verified rubric. Require either an allowed proposed value with evidence/rationale or an explicit keep-current result. Save the full proposal and expiry in persistent state.
8. **Review response** — show the issue snapshot, current and proposed values, rationale, risk assessment, and full Jira comment. Ask the user to review and send exactly `CONFIRM TRIAGE`; edits invalidate the proposal.
9. **Pre-write refresh/conflict check** — immediately before any write, fetch the issue again. Compare current Severity/Priority and proposal-relevant data with the reviewed snapshot. If relevant values changed, invalidate the proposal, show refreshed data, and require a new review.
10. **Jira update operation** — send only approved field changes. Do not update fields the proposal marked "keep current". Verify the response or refetch the issue to confirm the new values.
11. **Jira comment operation** — after successful field update verification, add the exact reviewed risk comment. Include a stable proposal identifier in workflow metadata or a reconciliable marker so retries can check whether the comment already exists.
12. **Completion and reconciliation state** — persist update/comment status, Jira response, issue key, and proposal ID. Mark the proposal complete only when both operations are reconciled. On ambiguous outcomes, read current Jira state before retrying.
13. **Cancel and expiry** — support an explicit cancellation; expire pending proposals after a configured interval. Remove or minimize retained user/ticket data according to team policy.

## Suggested routing

```text
Authenticated Chat Trigger
  -> identify authorized user/session and requested issue key
  -> valid exact CONFIRM TRIAGE?
       yes -> load matching pending proposal -> authorization/expiry checks
             -> re-fetch Jira issue -> conflict check
             -> update approved fields -> verify update
             -> add reviewed risk comment -> reconcile -> report result
       no  -> fetch requested issue (or resume relevant proposal)
             -> triage agent -> validate proposal -> persist proposal
             -> show review draft and request confirmation
```

The model must never route itself to Jira write operations. All side effects are reached only through deterministic workflow branches.

## Jira mapping

Complete this mapping from the target project's live metadata before build. The field names below are logical labels; use verified Jira field IDs and supported value types.

| Proposal output | Jira target | Validation |
| --- | --- | --- |
| Issue key | Existing issue identifier | Validate syntax and enforce project/user access before lookup |
| Severity | Verified Severity field ID | Exact type and allowed option; apply the organization's severity rubric |
| Priority | Verified Priority field ID | Exact type and allowed option; apply its separate priority rubric |
| Risk assessment | Jira issue comment | Post only the exact reviewed text; ensure the Jira identity can comment |

Do not copy severity/priority options from the ticket-creation blueprint. Fetch or otherwise verify current values before enabling writes. If a custom field is not available or the Jira node cannot map it reliably, stop and document an approved alternative rather than silently omitting the field.

## Proposal state

Persist at least:

- Authenticated user ID, chat session ID, issue key, and unique proposal ID.
- Fetched issue snapshot or minimum comparison values (field IDs/values and relevant version/update marker).
- Proposed severity and priority values, or explicit keep-current choices.
- Evidence/rationale for each recommendation and the full risk-comment body.
- Creation time, expiry, status (`pending`, `applying`, `partial`, `completed`, `cancelled`, `expired`), and per-operation result.
- Jira response identifiers and reconciliation result needed for safe retry.

Limit retained data and apply the team's approved execution-data/state retention policy. Never store credentials in proposal state.

## Confirmation, concurrency, and idempotency

- Require the exact raw user message `CONFIRM TRIAGE` for the matching pending proposal. A substring, paraphrase, reaction, or confirmation for a different issue/session does not pass.
- Bind confirmation to immutable proposal content. Any edit creates a new proposal ID and requires another review.
- Re-fetch before applying and compare current field values and relevant issue update data with the reviewed snapshot. If the issue changed, stop and request a fresh review rather than overwriting a concurrent change.
- Transition the proposal to `applying` atomically or with a concurrency-safe state check before Jira writes, preventing two parallel executions from applying it twice.
- Verify the resulting fields after the Jira update. If the response times out, fetch the issue before retrying.
- Before retrying a comment, retrieve comments and search for the stable proposal marker/content. If the comment outcome cannot be established, stop and report for safe reconciliation instead of posting a possible duplicate.
- Never retry the entire sequence after partial success. Resume only the operation that has not succeeded, after reconciling Jira state.

## Error and success behavior

- Report issue lookup errors distinctly (invalid key, not found, permission denied, Jira unavailable).
- If field validation fails, explain which field/value is not accepted and do not claim an update.
- If field update is successful and comment posting fails, report field update success and comment failure separately, with the issue key and a safe next step.
- If the comment succeeds but an update is not verified, do not claim the full triage completed; reconcile the state before any retry.
- Return completion only after verifying the actual Jira values and comment result. Never report success merely because the model generated a proposal.

## Credentials and privacy

- Store Jira and model credentials in n8n's credential manager.
- Use a Jira identity with only the project permissions required to read, update the approved fields, and comment.
- If users have different Jira access than the workflow identity, enforce user-to-project/issue authorization before returning ticket data and before writing.
- Treat issue descriptions, existing comments, and attachments as untrusted content, not system instructions.
- Avoid copying unnecessary personal or sensitive data into prompts, comments, or execution logs.
