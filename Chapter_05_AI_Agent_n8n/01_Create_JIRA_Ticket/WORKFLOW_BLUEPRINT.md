# n8n workflow blueprint

This is a build blueprint, not an importable workflow export. Finish the Jira field and access checks in [README.md](./README.md) before configuring issue creation.

## Nodes and responsibilities

1. **Chat Trigger** — n8n Chat / Chat Hub entry point. Keep access authenticated and grant execution access only to the QA team.
2. **Draft-state lookup** — read the pending draft for this conversation's session identifier from persistent storage. Do not rely on LLM memory to prove that a draft exists.
3. **Confirmation router** — evaluate the raw incoming message with an exact match for `CONFIRM CREATE`, and require a valid pending draft for the same session. A phrase match without a pending draft must not create anything.
4. **Confirmation branch** — validate required Jira fields; call Jira Create Issue; attach evidence; save the returned issue key; mark the draft completed. Use an idempotency/status check so workflow retries cannot create the same issue twice.
5. **Draft branch** — send the user's report and pending draft to the AI Agent. Connect the Groq Chat Model and shared conversation memory. The agent asks follow-up questions until it can prepare a report; a validator checks the output and Jira-specific required values before saving a pending draft.
6. **Chat response** — show questions, errors, or the formatted draft. The draft response must ask the tester to review and type `CONFIRM CREATE`; edits should update the draft and require a new review.
7. **Cancel / expiry** — allow the tester to cancel a pending draft and expire old drafts. Never reuse one user's/session's draft in another conversation.

## Jira mapping

Configure these only after checking the project screen and Jira field metadata:

| Agent output | Jira field |
| --- | --- |
| Summary | Summary |
| Description, steps, expected/actual, environment, evidence links | Description (formatted headings) or approved project fields |
| Severity | Jira field `Severity`; choices reported so far are `Blocker`, `High`, `Medium`, `Low` |
| Priority | Jira priority field; choices reported so far are `Critical`, `High`, `Medium`, `Low`, `Very Low` |
| Evidence files | Allow `.xls`, `.docx`, `.pdf`, `.png` up to 10 MB each; use Jira Issue Attachment after issue creation |

Jira attachment upload is a separate operation and requires the new issue key. Test how uploaded binary data is carried between chat turns. Temporary evidence storage is permitted for at most one hour while waiting for confirmation; delete it sooner after processing where possible. If the workflow cannot safely retain evidence until confirmation within this limit, ask the tester to upload the files with the confirmation message.

## Credentials and failure behavior

- Store Groq and Jira credentials in n8n's credential manager, not in node text, workflow notes, prompts, or this repository.
- Give the Jira identity only the project permissions needed to create issues and add attachments.
- If Jira rejects a field value, return the validation error and ask the tester to correct it; do not silently omit a required field.
- If issue creation succeeds but attachment upload fails, report the created issue key and the attachment failure separately. Do not retry issue creation blindly.
- Keep execution logs and evidence within the team's approved retention/privacy policy.
