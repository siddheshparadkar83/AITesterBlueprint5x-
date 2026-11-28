# QA-to-Jira Agent

## Goal

Give QA testers a shared n8n chat agent that turns a bug report into a consistent Jira issue. The agent asks for missing facts, shows a complete draft, and creates the issue only after the tester explicitly confirms it.

## Current decisions

| Setting | Decision |
| --- | --- |
| n8n hosting | n8n Cloud |
| Chat experience | n8n Chat |
| Jira site | <https://thetestingacademy.atlassian.net> |
| Jira project key | `AITester5x` |
| Issue type | `BUG` (confirm this exact issue type is available in project `AITester5x`) |
| AI provider | Groq, using an n8n credential |
| Severity | Jira field `Severity`; choices: `Blocker`, `High`, `Medium`, `Low` |
| Priority | Ask the tester to choose from `Critical`, `High`, `Medium`, `Low`, `Very Low` |
| Evidence | `.xls`, `.docx`, `.pdf`, `.png`; maximum 10 MB per file; temporary storage up to one hour while awaiting confirmation |
| Sharing | Team members only; do not publish an unauthenticated public chat |

## How to build it

1. **Confirm Jira configuration.** In project `AITester5x`, verify the exact issue type `BUG`, required fields, and that the `Severity` values (`Blocker`, `High`, `Medium`, `Low`) and priority choices are valid. Confirm the Jira account used by n8n can create issues and add attachments, but no broader permissions than needed.
2. **Create credentials in n8n Cloud.** Add a Groq credential and a Jira Cloud credential for `https://thetestingacademy.atlassian.net`. Keep API keys/tokens in n8n's credential store; never put them in this folder, prompts, or chat messages.
3. **Create a workflow with a Chat Trigger.** Use the n8n Chat experience. Enable the Chat Hub availability option if your n8n plan/workspace provides it, and give the agent a clear name and description. Keep access restricted to authenticated team members who are allowed to execute the workflow.
4. **Connect the agent.** Connect the Chat Trigger to an AI Agent, the Groq Chat Model to the agent's model input, and the same conversation memory to both the Chat Trigger and agent. Use the instructions in [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md). Memory helps the agent ask follow-up questions; it is not the authoritative store for a pending Jira draft.
5. **Add a deterministic review/confirmation path.** Save a validated draft in persistent workflow storage keyed by the chat session. Show the formatted draft and ask the tester to reply exactly `CONFIRM CREATE`. On each incoming message, check that exact command and an existing, unexpired pending draft *before* calling Jira. Create only when both checks pass. Route edits back through draft generation; support an explicit cancel. Do not let the language model decide whether the Jira create node runs.
6. **Create and attach.** Map the validated draft to the Jira Create Issue operation. After a successful create, attach evidence with Jira's Issue Attachment operation, then clear/mark the pending draft as completed so retries cannot create duplicates. If issue creation or upload fails, report the failure clearly and preserve enough state for a safe retry. Never claim success unless Jira returned the issue key.
7. **Test privately.** Follow [ACCEPTANCE_TESTS.md](./ACCEPTANCE_TESTS.md) with a test project or a safe test issue. Verify chat access, required-field behavior, confirmation, duplicate prevention, and attachments before sharing the workflow.
8. **Share with QA.** Give each tester the access needed for n8n Chat/workflow execution. Do not share a public webhook/chat URL or a common Jira token. Confirm that each tester's Jira permissions and your team's data-retention rules are appropriate.

## Recommended first version

Start with one Jira project and one bug issue type. The agent should:

- Collect summary, description, steps to reproduce, expected and actual results, environment/build, severity, priority, and evidence.
- Ask for required missing information rather than inventing it.
- Ask the tester to choose severity and priority; use only values Jira accepts.
- Present a Jira-ready draft and wait for explicit confirmation.
- Create the issue once, return its key/link, and attach only `.xls`, `.docx`, `.pdf`, or `.png` evidence up to 10 MB per file. Delete temporary evidence after one hour or sooner after processing.

Jira projects often have different required/custom fields. Do not assume the field mapping from this starter applies unchanged; verify the live project configuration before enabling creation.

## Unresolved setup details

- Are the priority values `Critical`, `High`, `Medium`, `Low`, and `Very Low` all valid in Jira, and is priority required?
- Verify that issue type `BUG` exists in project `AITester5x`.

## Official references

- [n8n Chat Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/)
- [n8n Groq Chat Model](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatgroq/)
- [n8n Jira node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira/)
- [n8n Jira credentials](https://docs.n8n.io/integrations/builtin/credentials/jira/)
