# Jira Bug Triage AI Agent

## Goal

Give authorized team members an n8n chat agent that fetches an existing Jira issue, helps assess its severity and priority, and prepares a risk assessment to add as a Jira comment. The agent presents the current ticket and proposed changes for review. It does not update Jira until the user sends the exact confirmation command.

This folder is a build blueprint, not an importable n8n workflow. Jira site/project details, fields, allowed values, and permissions must be verified before enabling writes.

## Decisions and assumptions to verify

| Setting | Blueprint behavior |
| --- | --- |
| Issue input | User provides a Jira issue key; agent asks if missing |
| Jira scope | Restrict to explicitly authorized site/project(s); determine during setup |
| Fields | Update Severity and Priority using verified live field IDs and values |
| Risk/comment | Draft an evidence-based impact, likelihood, and mitigation assessment and post it as a Jira comment |
| Confirmation | Require the exact phrase `CONFIRM TRIAGE` for the reviewed, unexpired proposal |
| Hosting/model | Use the n8n chat and approved model provider available to the team; the reference chapter's n8n Cloud/Groq choices are not assumed |
| Access | Authenticated users only; enforce authorization in workflow logic |
| Credentials | Keep Jira and model secrets in n8n's credential manager |

Do not assume the severity/priority options or project from `01_Create_JIRA_Ticket` are valid for this triage agent. Verify all metadata and the organization's decision rubric against the target Jira project.

## How to build it

1. **Verify Jira setup.** Identify permitted Jira site/project(s), confirm issue lookup, inspect Severity/Priority field IDs, data types, allowed values, and required fields, and document the separate severity and priority rubric. Confirm the Jira identity can read permitted issues, update only intended fields, and add comments.
2. **Verify n8n capabilities and access.** Confirm the available chat trigger provides authenticated user and session identifiers. Restrict access to authorized users; never publish an unrestricted chat or expose a shared Jira credential.
3. **Configure credentials.** Add Jira and model credentials directly to n8n's credential manager. Do not paste credentials into prompts, workflow notes, chat, logs, or this repository.
4. **Build the issue lookup.** Accept a user-provided issue key, validate its format and project scope, fetch the Jira issue, and show its key, summary, status, current severity/priority, and relevant report details. Handle malformed keys, not-found, authorization, and Jira-service failures explicitly.
5. **Prepare a grounded proposal.** Use [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md) and [JIRA_TICKET_TEMPLATE.md](./JIRA_TICKET_TEMPLATE.md). Ask focused questions where evidence needed for severity, priority, or risk assessment is missing. Do not infer values or treat severity and priority as interchangeable.
6. **Save a reviewable proposal.** Store the complete proposed updates and risk comment in persistent workflow state, keyed by authorized user, chat session, issue, and proposal ID. Give the proposal an expiry. Conversation memory is not the source of truth.
7. **Add a deterministic confirmation gate.** Inspect the raw incoming message for the exact `CONFIRM TRIAGE` phrase and verify the same authorized user/session, issue, pending proposal, expiry, and current Jira values before any write. Any edit or changed ticket requires a new proposal and confirmation.
8. **Update fields and comment.** Change only approved fields and post the exact reviewed risk comment using the verified Jira mapping. Track field and comment results separately. Reconcile ambiguous outcomes with Jira before any retry to avoid duplicate updates or comments.
9. **Test before enabling writes.** Run [ACCEPTANCE_TESTS.md](./ACCEPTANCE_TESTS.md) against a safe test issue/project. Verify access, project scope, values, review, confirmation, concurrency, retries, and partial failures.
10. **Hand over.** Provide authorized users the chat entry point and usage instructions. Document workflow ownership, credentials, Jira mapping/rubric maintenance, and state/log retention.

## Recommended first version

Start with one explicitly approved Jira project and the minimum write scope. The first version should:

- Fetch and summarize an existing issue by key.
- Propose severity and priority separately, using a verified organizational rubric and Jira's valid values.
- Draft a risk comment tied to ticket facts, covering impact, likelihood, mitigation, and unknowns.
- Show the before/after fields and full comment, and wait for exact `CONFIRM TRIAGE`.
- Update only the approved fields and add the reviewed comment, reporting each result truthfully.
- Prevent cross-user/session reuse, stale proposals, concurrent overwrites, and duplicate retries.

If evidence is insufficient to support a recommendation, ask questions or propose keeping the current value; do not silently assign a default.

## Failure behavior

- A missing or malformed key, inaccessible issue, or unverified project scope stops triage before a proposal is ready.
- Unknown or invalid Jira fields/options block the relevant write and produce an explicit configuration or validation error.
- If severity/priority changed after review, refresh the issue and ask the user to review a new proposal.
- If a field update fails, do not claim it changed or post a comment that implies it did.
- If field updates succeed but the comment fails, report the partial result and do not repeat successful field changes blindly.
- If a response is ambiguous or times out, reconcile current fields/comment state with Jira before retrying.

## Official references

- [n8n Chat Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/)
- [n8n Jira node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira/)
- [n8n Jira credentials](https://docs.n8n.io/integrations/builtin/credentials/jira/)

Confirm these references and available operations match the deployed n8n/Jira versions.
