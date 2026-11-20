# JIRA Test Plan Generator

## Prerequisites
- Node.js 18 or later
- Jira Cloud credentials
- Groq API key

The backend reads `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`, and `GROQ_API_KEY` from the parent `.env` locally. In the Settings page, users can instead load a `.env` file or enter the values directly. These values remain in page memory only, are sent to the backend over HTTPS for each operation, and are cleared on reload; they are not saved to browser storage.

## Run
```bash
npm run install:all
npm run dev
```

Open `http://localhost:5173`. The backend is available at `http://localhost:3000`.

For production-style local serving:
```bash
npm run build
npm start
```
Then open `http://localhost:3000`.

## Use
Enter a Jira key such as `QA-123` and submit. The backend retrieves the issue and sends its available source fields plus the supplied template to Groq. Missing details are marked as required. The Settings page tests the existing Jira and Groq configuration.

## Vercel
- Set the Vercel project root to this `implementation` directory.
- Deploy with the included `vercel.json`.
- Run `npx vercel --prod` from this directory after signing in to Vercel and linking the project.
- The requested `aitest5x-testplanaiagent.vercel.app` alias is live for this deployment. Vercel reports it is already assigned to another project, so free it from that project before adding it here for future deployments.
- No provider secrets need to be configured in Vercel when users provide their own values in Settings. For shared server-side credentials, add the four variables above in Vercel Project Settings instead.

## Verification
- Frontend and backend structure implemented.
- Jira key and configuration validation implemented.
- Mocked/untested: live Jira access and live Groq generation require valid credentials and network access.
