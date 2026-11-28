# Acceptance tests

Run these with a safe test issue/project before sharing the agent.

| Scenario | Expected result |
| --- | --- |
| Tester gives only a short bug statement | Agent asks for missing reproduction, expected/actual, and environment details; no Jira issue is created. |
| Tester omits severity or priority | Agent asks the tester to choose; it does not guess or silently assign a default. |
| Tester supplies an unsupported priority/severity value | Validation blocks creation and asks the tester to select an allowed Jira value; verify all reported choices before launch. |
| Agent displays a complete draft | Draft contains the requested fields, preserves reported facts, marks unknown optional values, and asks for review. |
| Tester edits a displayed draft | Updated draft is shown again and requires fresh confirmation. |
| Tester says “yes” or “looks good” | No Jira issue is created; only the exact configured confirmation command can pass the deterministic gate. |
| Tester sends `CONFIRM CREATE` without a pending draft | No Jira issue is created. |
| Tester confirms a valid pending draft | Exactly one issue is created in project `AITester5x`; the chat returns its actual Jira key/link. |
| Workflow retries after a successful create | No duplicate issue is created; the existing completion state/key is returned. |
| Jira validation or auth fails | Chat reports failure clearly and does not claim success. |
| Evidence is attached | Jira issue contains the expected file(s); attachment failures are reported separately from issue-creation success. |
| Tester uploads a disallowed evidence extension | Upload is rejected with a clear message; only `.xls`, `.docx`, `.pdf`, and `.png` are accepted. |
| Tester uploads a file over 10 MB | Upload is rejected with a clear size-limit message. |
| Evidence waits for confirmation | Temporary evidence is deleted after processing or no later than one hour after upload. |
| A different tester/session starts a conversation | No prior user's draft or evidence is visible or reused. |
| Unauthenticated user opens the chat | Access is denied; the workflow is not available as an unrestricted public chat. |
