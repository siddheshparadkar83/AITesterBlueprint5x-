# Test Case Suite — <Feature / Module Name>

## 1. Suite Metadata

| Field | Details |
| :--- | :--- |
| **Project / Product** | `<Project Name>` |
| **Jira / Requirement ID** | `<e.g., KAN-5>` |
| **Module / Feature** | `<e.g., User Authentication / Checkout>` |
| **Author** | `<QA Engineer Name>` |
| **Created / Updated Date** | `<YYYY-MM-DD>` |
| **Target Environment** | `<e.g., QA / Staging / Browser / OS>` |

---

## 2. Detailed Test Cases

| Test Case # | Test Case ID | Requirement / AC ID | Test Case Name | Test Type | Priority | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Attachments / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `TC-001` | `AC-1` | Verify successful login with valid credentials | Positive / Functional | `P0` | User has an active, verified account and is on the `/login` page. | 1. Enter valid email in the **Email** field.<br>2. Enter valid password in the **Password** field.<br>3. Click the **Sign In** button. | `Email:` `user@example.com`<br>`Password:` `ValidPass@123` | User is authenticated, redirected to `/dashboard`, and sees welcome banner. | `<To be filled during execution>` | `Not Run` | `<Link to wireframe / screenshot / video log>` |
| 2 | `TC-002` | `AC-2` | Verify error message when logging in with invalid password | Negative / Validation | `P1` | User is on the `/login` page. | 1. Enter registered email.<br>2. Enter an incorrect password.<br>3. Click the **Sign In** button. | `Email:` `user@example.com`<br>`Password:` `WrongPass!99` | Login is blocked; inline error `"Invalid email or password"` is displayed; user remains on `/login`. | `<To be filled during execution>` | `Not Run` | `<Screenshot of error message>` |
| 3 | `TC-003` | `AC-3` | Verify boundary validation for maximum password length | Boundary | `P2` | User is on the `/register` page. | 1. Enter a valid email.<br>2. Enter a 65-character password (max limit is 64).<br>3. Click **Create Account**. | `Email:` `new@example.com`<br>`Password:` `<65-char string>` | Form prevents submission and displays `"Password must not exceed 64 characters"`. | `<To be filled during execution>` | `Not Run` | `<Screenshot / HAR log>` |

---

## 3. Execution & Defect Summary (Post-Run)
- **Total Test Cases:** `<Count>`
- **Passed:** `<Count>` | **Failed:** `<Count>` | **Blocked:** `<Count>` | **Not Run:** `<Count>`
- **Linked Defect IDs:** `<e.g., KAN-12, KAN-15>`
- **Reviewed / Approved By:** `<QA Lead Name>`
