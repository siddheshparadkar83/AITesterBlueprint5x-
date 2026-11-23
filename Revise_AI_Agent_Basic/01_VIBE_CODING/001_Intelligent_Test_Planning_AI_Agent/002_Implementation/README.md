# Jira Test Plan Generator

Lightweight React and Express app that retrieves a Jira issue and generates a draft test plan.

## Prerequisites

- Node.js 18+
- Jira Cloud credentials
- Optional Groq API key

## Setup

From the repository root:

```powershell
npm.cmd run install:all
```

On Windows PowerShell, use the `.cmd` forms because execution policies can block the `npm.ps1` shim. In Command Prompt or another shell, use `npm run ...`.

At startup, the backend loads the first `.env` found while walking upward from `src/backend/config.js`; in this checkout, that is the repository-root `.env`. It reads `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`, and `GROQ_API_KEY` once, so restart the backend after changing them. Groq uses `https://api.groq.com/openai/v1` and `openai/gpt-oss-20b` by default; optionally override these with `GROQ_BASE_URL` and `GROQ_MODEL`. The Groq connection test checks an actual chat completion with the configured model. Keep `.env` in the same checkout as the backend you run; a `.env` in another copy of this project is not used. No `config.md` was supplied, so the existing `.env` is the configuration source. The backend only sends credentials to their configured Jira or Groq service. No secret is exposed to the frontend.

Example `.env` names only:

```text
JIRA_BASE_URL=https://example.atlassian.net/
JIRA_EMAIL=qa@example.com
JIRA_TOKEN=<jira-api-token>
GROQ_API_KEY=<groq-api-key>
GROQ_MODEL=openai/gpt-oss-20b
```

## Run

```powershell
npm.cmd run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:3001`.

## Verification

- Frontend and backend startup
- Settings status without exposing secrets
- Jira issue lookup with configured credentials
- Groq generation when available
- A Jira response is not reported as successful until the live API returns it

Mock Jira and AI checks can be added separately; none are presented as live verification.
