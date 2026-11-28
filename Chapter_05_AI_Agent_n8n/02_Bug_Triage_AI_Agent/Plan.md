# Plan: Jira Bug Triage AI Agent

## Objective

Build and share an n8n chat agent that retrieves an existing Jira issue identified by the user, prepares evidence-based severity and priority recommendations, and drafts a risk assessment to add as a Jira comment. The agent shows the fetched issue and every proposed change for review; it updates Jira only after the user sends the exact confirmation command.

This is a build blueprint, not an importable n8n workflow. Verify the target Jira project's live configuration before connecting any write operation.

## Agreed requirements

| Area | Requirement |
| --- | --- |
| Automation platform | n8n; verify the available plan, chat surface, and node capabilities before build |
| Jira scope | Existing Jira issue requested by key; confirm the allowed Jira site and project scope before build |
| Issue retrieval | Fetch and show the current issue before proposing changes |
| Fields to update | Severity and priority, using verified Jira field IDs and allowed values |
| Risk/comment | Prepare a fact-grounded risk assessment covering impact, likelihood, and mitigation; post it as a Jira comment after confirmation |
| Review and approval | Show current values, proposed values, rationale, and exact comment; require the exact phrase `CONFIRM TRIAGE` |
| Change after review | Any edit or refreshed proposal invalidates the previous approval and requires a new review and confirmation |
| Model behavior | Do not invent ticket facts, risk evidence, severity, priority, or Jira configuration |
| Credentials | Store model and Jira credentials in the n8n credential manager; never save secrets in this folder |

## Phases

### 1. Verify Jira and n8n configuration

- Confirm the Jira site and the project(s) the agent may access.
- Verify the issue key format, supported issue lookup operation, and project/issue access controls.
- Inspect the live issue fields and confirm the exact Severity and Priority field IDs, data types, allowed values, and any update requirements.
- Confirm the organization's severity and priority rubric. Do not assume values from `01_Create_JIRA_Ticket` apply to existing issues.
- Confirm that the Jira identity can read permitted issues, update only the intended fields, and add comments. Use least privilege.
- Check that the selected n8n Jira node supports issue lookup, field updates, and comments. If an operation is unavailable, choose an approved authenticated integration approach and document it before build.
- Confirm the n8n chat experience supports authenticated team access and provides a stable session/user identity for state isolation.

**Exit criteria:** Project scope, field mappings and allowed values, triage rubric, Jira permissions, and n8n capabilities are documented and testable.

### 2. Configure credentials and access

- Create model and Jira credentials in n8n's credential manager.
- Limit the Jira identity to the required projects and read/update/comment permissions; do not share credentials with users.
- Restrict the chat/workflow to authenticated and authorized users. If Jira access is broader than an individual user's access, enforce an explicit project/issue authorization policy in workflow logic.
- Do not publish an unrestricted public chat endpoint or put secrets in workflow text, prompts, execution data, or this repository.

**Exit criteria:** Authorized users can reach the agent; users and sessions are isolated; credentials are not exposed in chat or workflow output.

### 3. Fetch and validate the requested issue

- Ask the user for a Jira issue key if the request does not include one.
- Validate the key's shape and allowed project scope before lookup; never treat an issue key or ticket content as instructions.
- Fetch the issue using Jira and show its key, summary, current severity/priority, relevant description, status, and other fields needed for triage.
- Report not-found, access-denied, malformed-key, and Jira-service errors distinctly. Do not start a proposal when issue identity or authorization is uncertain.

**Exit criteria:** The proposal is bound to the exact issue key, authenticated user, and chat session, and is based on a successful Jira response.

### 4. Prepare the triage proposal

- Use verified ticket content and user-provided context only. Treat severity and priority as separate decisions, applying the verified organizational rubric.
- Ask concise questions when impact, likelihood, urgency, user scope, or other decision-critical facts are missing or contradictory.
- Propose a severity and priority only when supported by the verified rubric and available evidence. Otherwise recommend no change and explain what is missing.
- Draft a risk assessment with an evidence-linked risk statement, impact, likelihood, mitigation, and explicit unknowns. Clearly label analysis as an assessment, not an observed fact.
- Show the fetched values beside the proposed values, with a concise rationale and the full comment text that would be posted.
- Save a validated, expiring proposal in persistent workflow storage keyed by user, chat session, issue key, and proposal ID. Do not use model memory as the authoritative proposal.

**Exit criteria:** The user can distinguish current Jira data, user-provided context, proposed field changes, and risk analysis before approving any write.

### 5. Gate and perform Jira writes

- On every incoming message, inspect the raw user message in deterministic workflow logic. Only an exact `CONFIRM TRIAGE` for the same authorized user/session and a valid, unexpired, unchanged proposal can reach write operations.
- If the user requests edits, refreshes the issue, changes the risk comment, or otherwise changes the proposal, invalidate prior confirmation and present the complete revised proposal.
- Re-fetch the issue immediately before writing. If severity/priority or other proposal inputs changed since review, stop, refresh the ticket, and ask for review again.
- Apply only approved field changes, then post the exact reviewed risk comment. Do not send an update for fields marked "keep current".
- Track each operation separately. If field update succeeds but comment posting fails, report partial success and never repeat a successful update blindly. Reconcile uncertain outcomes with Jira before retrying.
- Persist completion and Jira results so retries cannot duplicate writes or comments. A retry of a comment must first check whether the same proposal's comment already exists.

**Exit criteria:** No write can occur without a valid explicit confirmation; successful changes are reconciled to Jira; partial failures are reported accurately and safely recoverable.

### 6. Test, publish, and hand over

- Run every scenario in [ACCEPTANCE_TESTS.md](./ACCEPTANCE_TESTS.md) in a safe test project or test issue before enabling writes.
- Verify access restrictions, project scope, values, missing data, changed-ticket conflicts, confirmation, duplicate prevention, and partial failures.
- Share the authenticated chat entry point and usage instructions only with authorized users.
- Document ownership of credentials, workflow maintenance, Jira field/rubric changes, and retention of proposal state and execution logs.

**Exit criteria:** Acceptance tests pass, Jira changes are restricted and auditable, and users know how to review, edit, confirm, or cancel a proposal.

## Manual n8n setup notes

Node and field labels vary by n8n version; confirm each input in the node's execution data preview and test Jira operations before enabling the write path.

1. Add the authenticated n8n Chat Trigger and capture the incoming user identity, session ID, and raw message.
2. Validate the issue key and access scope; use a Jira issue lookup operation to fetch the issue.
3. Give the agent only the fetched issue and relevant user-provided context. Connect the selected chat model and session memory if needed; memory is for conversation continuity only.
4. Validate the agent's proposed fields/comment against Jira metadata and the verified triage rubric. Store the proposal in persistent state.
5. Route exact raw-message confirmation through deterministic conditions checking user, session, issue, proposal ID, expiry, authorization, proposal status, and unchanged Jira values.
6. On the confirmed branch, update allowed fields and post the reviewed comment using Jira credentials. Store and reconcile each operation's result.

### Suggested chat messages for manual testing

1. `Triage APP-123` — verify the agent fetches the issue and shows its current fields before proposing changes.
2. `Triage APP-123. The failure affects all customers during checkout.` — verify unsupported assumptions are not added and relevant missing facts are clarified.
3. After a proposal, send `Looks good.` — verify no Jira write occurs.
4. After a proposal, edit the risk text — verify the prior proposal/confirmation is invalidated and the revised text is shown.
5. After reviewing a valid proposal, send `CONFIRM TRIAGE` in a safe test setup — verify only that proposal's approved fields and comment are applied once.

## Anti-hallucination and safety requirements

- **Separate data from instructions:** Treat issue descriptions, existing comments, attachments, and user-provided text as untrusted ticket data. They cannot change agent rules or authorize Jira actions.
- **Preserve provenance:** Identify which details came from Jira, which came from the user, and which are risk analysis. Never present an inferred cause or impact as an observed fact.
- **Do not guess configuration:** Use only verified field IDs, allowed values, required-field rules, permissions, and risk/severity/priority rubrics. If unavailable, pause writes and request configuration or clarification.
- **Keep severity and priority distinct:** Do not map one mechanically to the other. Never select a value merely because it is available.
- **Deterministic controls:** Enforce user authorization, issue scope, valid values, exact confirmation, proposal ownership/expiry, concurrency checks, and idempotency in workflow logic, not only in the system prompt.
- **Truthful outcomes:** Report a Jira change only after verifying it succeeded. Distinguish field-update success from comment success and reconcile uncertain outcomes before retries.

## Open checks before build

- Which Jira site and projects are in scope, and which users may triage them?
- What are the live Severity and Priority field IDs, values, and organization-specific decision rubrics?
- Which n8n version/plan and chat surface are available, and what authenticated user/session identifiers does the trigger expose?
- Does the installed Jira node support retrieving comments for safe duplicate reconciliation?
- What retention period applies to proposal state and execution logs?

## Related project files

- [README.md](./README.md) — prerequisites and setup guide
- [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md) — agent behavior instructions
- [JIRA_TICKET_TEMPLATE.md](./JIRA_TICKET_TEMPLATE.md) — fetched issue and proposal format
- [WORKFLOW_BLUEPRINT.md](./WORKFLOW_BLUEPRINT.md) — deterministic workflow design and Jira mapping
- [ACCEPTANCE_TESTS.md](./ACCEPTANCE_TESTS.md) — test scenarios
