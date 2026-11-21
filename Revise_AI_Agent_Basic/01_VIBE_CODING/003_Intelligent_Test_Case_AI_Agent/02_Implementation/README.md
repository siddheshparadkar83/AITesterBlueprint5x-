# Jira Test Case Generator

## Run locally

Requirements: Node.js 18 or newer.

```powershell
npm run install:all
npm install
npm run dev
```

Open `http://localhost:5175` and enter a Jira ticket such as `KAN_5`. The backend runs on port `3003`.

The backend reads `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`, and `GROQ_API_KEY` from `.env` files in this folder or any parent folder. Keep secrets server-side and do not commit them.

The app reads Jira tickets and generates a draft test case suite. Jira write actions are not enabled.

## Deploy on Vercel

The root `vercel.json` configures separate `backend` (Express) and `frontend` (Vite) services. Set the Jira and Groq variables above as Vercel project environment variables; never commit secrets.

The browser calls `/api/*` on the shared deployment URL, routed to the backend. The backend calls Jira and Groq directly, so no Vercel service binding is needed.
