import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

function findEnvFile(start) {
  let dir = path.resolve(start);
  while (true) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const envFile = findEnvFile(path.dirname(fileURLToPath(import.meta.url)));
if (envFile) dotenv.config({ path: envFile });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const port = Number(process.env.PORT || 3001);
const issuePattern = /^[A-Z][A-Z0-9]+-\d+$/i;

function missing(label) {
  return `${label}: Insufficient information to determine.`;
}

function adfToText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(adfToText).filter(Boolean).join("\n");
  if (typeof value === "object") {
    const own = value.text ? value.text : "";
    const children = value.content ? adfToText(value.content) : "";
    return [own, children].filter(Boolean).join(" ");
  }
  return "";
}

app.get("/api/settings", (_req, res) => {
  res.json({
    jiraConfigured: Boolean(process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_TOKEN),
    groqConfigured: Boolean(process.env.GROQ_API_KEY)
  });
});

app.post("/api/settings/test-jira", async (_req, res) => {
  if (!process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_TOKEN) {
    return res.status(400).json({ error: "Jira configuration is missing." });
  }
  try {
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString("base64");
    const response = await fetch(`${process.env.JIRA_BASE_URL.replace(/\/$/, "")}/rest/api/3/myself`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" }
    });
    if (!response.ok) return res.status(response.status).json({ error: "Jira authentication failed." });
    res.json({ ok: true });
  } catch {
    res.status(502).json({ error: "Could not reach Jira." });
  }
});

app.post("/api/settings/test-groq", async (_req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(400).json({ error: "Groq configuration is missing." });
  }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        Accept: "application/json"
      }
    });
    if (!response.ok) return res.status(response.status).json({ error: "Groq authentication failed." });
    res.json({ ok: true });
  } catch {
    res.status(502).json({ error: "Could not reach Groq." });
  }
});

app.post("/api/test-plan", async (req, res) => {
  const issueId = String(req.body.issueId || "").trim().toUpperCase();
  if (!issuePattern.test(issueId)) {
    return res.status(400).json({ error: "Enter a valid Jira issue ID, such as QA-123." });
  }
  if (!process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_TOKEN) {
    return res.status(400).json({ error: "Jira configuration is missing." });
  }

  try {
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString("base64");
    const url = `${process.env.JIRA_BASE_URL.replace(/\/$/, "")}/rest/api/3/issue/${encodeURIComponent(issueId)}?fields=summary,description,issuetype,status,priority,assignee,acceptance,customfield_*`;
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" }
    });
    if (response.status === 404) return res.status(404).json({ error: "Jira issue was not found." });
    if (response.status === 401 || response.status === 403) {
      return res.status(response.status).json({ error: "Jira authentication or permission failed." });
    }
    if (!response.ok) return res.status(502).json({ error: `Jira returned HTTP ${response.status}.` });

    const issue = await response.json();
    const fields = issue.fields || {};
    const description = adfToText(fields.description).trim();
    const acceptanceKey = Object.keys(fields).find((key) => key === "acceptance" || /acceptance/i.test(key));
    const acceptance = acceptanceKey ? adfToText(fields[acceptanceKey]).trim() : "";
    const source = {
      key: issue.key,
      summary: fields.summary || "",
      description: description || "",
      acceptanceCriteria: acceptance || "",
      issueType: fields.issuetype?.name || "",
      status: fields.status?.name || "",
      priority: fields.priority?.name || ""
    };

    let plan;
    if (process.env.GROQ_API_KEY) {
      const template = `# Test Plan — <JIRA-KEY>: <title>
> Status: **DRAFT — pending human review.** Not approved until a QA owner signs off.
## 1. Scope & Objectives
- **In scope:**
- **Out of scope:**
- **Objective:** what "tested" means for this ticket.
## 2. Gaps & Questions for the author
| # | Area | Finding (⚠️/❌) | Question to author |
|---|------|----------------|--------------------|
## 3. Test Scenarios
| ID | Priority | Type (pos/neg/boundary) | Scenario | Maps to (AC / gap) |
|----|----------|-------------------------|----------|--------------------|
## 4. Test Data & Environment
- **Data:**
- **Environment / flags:**
- **Roles / permissions:**
## 5. Risks & Assumptions
- **Assumptions made:**
- **Risks:**
## 6. Entry / Exit criteria
- **Entry:**
- **Exit:**
## 7. Resource Allocation
## 8. Timelines, Sprint Details
---
## HUMAN REVIEW GATE
- **I assumed:** …
- **I could not confirm:** …
- **Open questions blocking sign-off:** …
- **Approve, or edit, before I write test cases / automation.**`;
      const prompt = `Use only the source JSON and exact template structure below. Separate factual requirements from proposed testing activities. Label proposals as Proposal. Use exactly "Insufficient information to determine." for missing facts. Do not invent requirements or product behavior. Return Markdown only.\n\nSOURCE:\n${JSON.stringify(source)}\n\nTEMPLATE:\n${template}`;
      const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0,
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!aiResponse.ok) return res.status(502).json({ error: "Test plan generation failed with Groq." });
      const ai = await aiResponse.json();
      plan = ai.choices?.[0]?.message?.content || "";
    } else {
      plan = `# Test Plan — ${source.key}: ${source.summary || "Insufficient information to determine."}

> Status: **DRAFT — pending human review.**

## 1. Scope & Objectives
- **In scope:** ${description || "Insufficient information to determine."}
- **Out of scope:** Insufficient information to determine.
- **Objective:** Insufficient information to determine.

## 2. Gaps & Questions for the author
| # | Area | Finding (⚠️/❌) | Question to author |
|---|------|----------------|--------------------|
| 1 | Requirements | ${acceptance ? "Acceptance criteria available in Jira." : "⚠️ Acceptance criteria missing"} | ${acceptance ? "Confirm whether these criteria are complete." : "What acceptance criteria apply?"} |

## 3. Test Scenarios
| ID | Priority | Type (pos/neg/boundary) | Scenario | Maps to (AC / gap) |
|----|----------|-------------------------|----------|--------------------|
| TS-1 | P0 | Proposal | Proposal: Verify documented Jira description and acceptance criteria. | Jira source |

## 4. Test Data & Environment
- **Data:** Insufficient information to determine.
- **Environment / flags:** Insufficient information to determine.
- **Roles / permissions:** Insufficient information to determine.

## 5. Risks & Assumptions
- **Assumptions made:** No product behavior assumed beyond Jira source.
- **Risks:** Insufficient information to determine.

## 6. Entry / Exit criteria
- **Entry:** Insufficient information to determine.
- **Exit:** Insufficient information to determine.

## 7. Resource Allocation
Insufficient information to determine.

## 8. Timelines, Sprint Details
Insufficient information to determine.

---
## HUMAN REVIEW GATE
- **I assumed:** No unconfirmed product behavior.
- **I could not confirm:** Scope, test data, environment, roles, entry/exit criteria, resources, and timelines.
- **Open questions blocking sign-off:** Complete the Jira requirements and approval fields.
- **Approve, or edit, before I write test cases / automation.**`;
    }
    res.json({ issue: source, plan });
  } catch {
    res.status(502).json({ error: "Jira request or test plan generation failed." });
  }
});

app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
