# Test Plan — VWO-LOGIN-01: Login Module Functional Test Plan

> Status: **DRAFT — pending human review.** Not approved until a QA owner signs off.

## 1. Scope & Objectives
- **In scope:**
  - Login page behavior for registered users
  - Valid login flow to authenticated dashboard
  - Invalid credential handling
  - Required-field validation for email and password
  - Successful login state opening the authenticated dashboard
- **Out of scope:**
  - Account registration or password reset flows
  - Social login, SSO, MFA, or external IdP integrations
  - Password policy enforcement beyond the approved requirements (not specified)
  - Session timeout behavior, logout flows, and account lockout logic unless clarified later
- **Objective:**
  - Verify that only registered users with valid credentials can access the application.
  - Confirm that invalid credentials are rejected.
  - Confirm that email and password are mandatory.
  - Confirm that successful login opens the authenticated dashboard.
  - Record any behavior that is not specified as “Requires clarification.”

## 2. Gaps & Questions for the author
| # | Area | Finding (⚠️/❌) | Question to author |
|---|------|----------------|--------------------|
| 1 | Email validation | ✅ | Example valid email format: abc@xyz.com. The product should accept this format as a valid test value. |
| 2 | Error messaging | ✅ | Use the message: “Your email, password, IP address or location did not match” for invalid credentials. |
| 3 | Password rules | N/A | No password rules are defined in the approved requirements; no additional constraints should be assumed. |
| 4 | Security behavior | N/A | No failed-attempt throttling, lockout policy, or other security behavior is specified in scope. |
| 5 | Session behavior | N/A | No session timeout, persistence, or logout behavior is specified in the approved requirements. |
| 6 | Accessibility / UX | N/A | Accessibility and UX requirements are not specified for this module in the approved brief. |

## 3. Test Scenarios
| ID | Priority | Type (pos/neg/boundary) | Scenario | Maps to (AC / gap) |
|----|----------|-------------------------|----------|--------------------|
| TS-01 | P0 | pos | Login with a valid registered email and correct password. Verify the user is directed to the authenticated dashboard. | Approved requirement: valid login opens dashboard |
| TS-02 | P0 | neg | Login with a valid registered email and an incorrect password. Verify access is denied. | Approved requirement: invalid credentials must not grant access |
| TS-03 | P0 | neg | Login with an unregistered email and a valid password. Verify access is denied. | Approved requirement: invalid credentials must not grant access |
| TS-04 | P0 | neg | Submit the login form with both email and password empty. Verify the system blocks submission and requires values. | Approved requirement: email and password are mandatory |
| TS-05 | P0 | neg | Submit the login form with email empty and password entered. Verify the system blocks submission and requires email. | Approved requirement: email is mandatory |
| TS-06 | P0 | neg | Submit the login form with password empty and email entered. Verify the system blocks submission and requires password. | Approved requirement: password is mandatory |
| TS-07 | P1 | boundary | Attempt login using the shortest valid credential combination for a known valid account, if the product supports a minimum accepted length. Verify behavior remains correct. | Recommended boundary check; exact rules are not specified |
| TS-08 | P1 | boundary | Attempt login using the maximum supported valid credential length for a known valid account, if such limits exist. Verify the form accepts and processes valid values without blocking. | Recommended boundary check; exact rules are not specified |
| TS-09 | P2 | neg | Login using a valid email with a password that contains only whitespace or is otherwise blank after trimming. Verify the system treats it as missing/invalid. | Requires clarification: whitespace handling is not specified |
| TS-10 | P2 | neg | Login using an email that is syntactically invalid but otherwise matches a known user pattern. Verify the form prevents submission or rejects access according to product behavior. | Requires clarification: exact email rules are not specified |
| TS-11 | P1 | pos | After successful login, verify the dashboard content is visible and the user is authenticated. | Approved requirement: successful login opens authenticated dashboard |
| TS-12 | P2 | neg | Try to access the dashboard without successful login and verify access is blocked or redirected to the login screen. | Requires clarification: unauthenticated access behavior is not explicitly defined |

## 4. Test Data & Environment
- **Data:**
  - One valid registered user account with a known working email and password
  - Example valid email: abc@xyz.com
  - One invalid password for the same email
  - One valid email that is not registered
  - Empty email and password values
  - Invalid credential error expectation: “Your email, password, IP address or location did not match”
  - Optional boundary data for valid credential lengths, if product-defined limits exist
  - Recommended: maintain separate test datasets for positive and negative login flows to prevent accidental cross-contamination
- **Environment / flags:**
  - Application under test: [https://app.vwo.com/](https://app.vwo.com/)
  - Test environment: stable browser session with no cached auth state
  - Recommended browser coverage: latest Chrome and Edge (or the project-supported browsers)
  - Network connectivity should be stable during execution
  - Recommended: use a non-prod or staging-like environment if available, unless production access is explicitly approved
- **Roles / permissions:**
  - Standard registered user role for positive login scenarios
  - No admin privileges required for this test plan
  - Recommendation: keep test accounts isolated from production user traffic where possible

## 5. Risks & Assumptions
- **Assumptions made:**
  - The login page is publicly accessible before authentication.
  - “Registered users” refers to users with a valid account already created in the system.
  - Successful login means the application transitions to the authenticated dashboard, not merely a hidden state or non-error page.
  - Email and password are the only required fields for this scenario.
- **Risks:**
  - Unspecified password rules may create false negatives or ambiguous test results.
  - Error-message wording may differ from expected wording without changing the actual product behavior.
  - Session timeout and auth persistence rules are not defined and may affect validation after login.
  - Failed login throttling or lockout behavior is not specified and could change test outcomes.
  - Browser caching or stale session state may influence results unless the environment is reset before testing.
- **Recommendation:**
  - Treat any product rule not directly provided in this test brief as “Requires clarification” until QA and product owners confirm it.

## 6. Entry / Exit criteria
- **Entry:**
  - Application URL is reachable and the login page loads successfully.
  - Valid and invalid test credentials are prepared.
  - Browser is available and the user is not already authenticated.
  - Test environment is stable and no pending blocker is preventing login testing.
- **Exit:**
  - All P0 scenarios pass successfully.
  - All invalid/empty field attempts are rejected as required.
  - A valid login opens the authenticated dashboard without error.
  - Any open questions or unsupported assumptions are captured in this plan and reviewed before sign-off.
  - Recommendation: escalate any issues that block login access or create security concerns before closing the test cycle.

---
## HUMAN REVIEW GATE
- **I assumed:** The approved requirements are the only authoritative source for this test plan, and any unconfirmed behavior is treated as “Requires clarification.”
- **I could not confirm:** No additional product rules beyond the approved brief were available for password policy, lockout behavior, session timeout, and UX/accessibility requirements.
- **Open questions blocking sign-off:**
  - None at the current scope. The approved requirements are sufficient to proceed with the functional test plan, and all unspecified behaviors are treated as out of scope unless clarified later.
- ▶ **Approve, or edit, before I write test cases / automation.**
