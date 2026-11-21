# Test Strategy Builder

## Run locally

Requirements: Node.js 18 or newer.

```powershell
npm run install:all
npm install
npm run dev
```

Open `http://localhost:5174`, enter a Jira ticket such as `KAN-5`, and generate a draft Test Strategy. The backend runs on port `3002`.

The backend reads `GROQ_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, and `JIRA_TOKEN` from `.env` files in this folder or any parent folder. Keep these values server-side; do not commit them. For a hosted deployment, configure them as server environment variables.

Test Strategy output is a draft for human review. Jira tasks are created only after the user reviews the output and explicitly confirms creation.
