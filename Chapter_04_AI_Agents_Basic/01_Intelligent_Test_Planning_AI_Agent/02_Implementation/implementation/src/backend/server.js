const path = require("path");
const fs = require("fs");
const express = require("express");
const dotenv = require("dotenv");

let envDir = path.resolve(__dirname, "../../../../");
for (let i = 0; i < 8; i += 1) {
  const envPath = path.join(envDir, ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
  envDir = path.dirname(envDir);
}

const app = express();
app.use(express.json({ limit: "1mb" }));

const template = fs.readFileSync(path.join(__dirname, "Test_Plan_Template.md"), "utf8");

function getConfig(input = {}) {
  const value = (key) => typeof input[key] === "string" && input[key].trim()
    ? input[key].trim()
    : process.env[key] || "";
  return {
    JIRA_BASE_URL: value("JIRA_BASE_URL").replace(/\/$/, ""),
    JIRA_EMAIL: value("JIRA_EMAIL"),
    JIRA_TOKEN: value("JIRA_TOKEN"),
    GROQ_API_KEY: value("GROQ_API_KEY")
  };
}

function jiraText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(jiraText).filter(Boolean).join("\n");
  if (typeof value === "object") {
    return [value.text, jiraText(value.content)].filter(Boolean).join("\n");
  }
  return "";
}

async function jiraRequest(url, config, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: "Basic " + Buffer.from(`${config.JIRA_EMAIL}:${config.JIRA_TOKEN}`).toString("base64"),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

app.get("/api/settings", (_req, res) => {
  res.json({
    jiraConfigured: Boolean(process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_TOKEN),
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    jiraUrl: process.env.JIRA_BASE_URL || "",
    jiraEmail: process.env.JIRA_EMAIL || "",
    groqUrl: "https://api.groq.com/openai/v1",
    ollamaConfigured: false
  });
});

app.post("/api/settings/test", async (req, res) => {
  const target = req.body?.target;
  const config = getConfig(req.body?.config);
  if (target === "jira") {
    if (!config.JIRA_BASE_URL || !config.JIRA_EMAIL || !config.JIRA_TOKEN) {
      return res.status(400).json({ error: "Jira configuration is incomplete." });
    }
    try {
      const response = await jiraRequest(`${config.JIRA_BASE_URL}/rest/api/3/myself`, config);
      if (!response.ok) return res.status(response.status).json({ error: "Jira authentication or permission check failed." });
      return res.json({ ok: true });
    } catch {
      return res.status(502).json({ error: "Unable to reach Jira." });
    }
  }
  if (target === "groq") {
    if (!config.GROQ_API_KEY) return res.status(400).json({ error: "Groq API key is missing." });
    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${config.GROQ_API_KEY}` }
      });
      if (!response.ok) return res.status(response.status).json({ error: "Groq authentication or provider check failed." });
      return res.json({ ok: true });
    } catch {
      return res.status(502).json({ error: "Unable to reach Groq." });
    }
  }
  res.status(400).json({ error: "Unknown test target." });
});

app.post("/api/generate", async (req, res) => {
  const issueKey = String(req.body?.issueKey || "").trim().toUpperCase();
  const config = getConfig(req.body?.config);
  if (!/^[A-Z][A-Z0-9]*-[0-9]+$/.test(issueKey)) {
    return res.status(400).json({ error: "Enter a valid Jira issue ID, for example QA-123." });
  }
  if (!config.JIRA_BASE_URL || !config.JIRA_EMAIL || !config.JIRA_TOKEN) {
    return res.status(500).json({ error: "Jira configuration is missing." });
  }
  if (!config.GROQ_API_KEY) {
    return res.status(500).json({ error: "Groq configuration is missing." });
  }

  let issueResponse;
  try {
    issueResponse = await jiraRequest(
      `${config.JIRA_BASE_URL}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=*all`,
      config
    );
  } catch {
    return res.status(502).json({ error: "Unable to reach Jira." });
  }
  if (issueResponse.status === 404) return res.status(404).json({ error: "Jira issue was not found." });
  if (issueResponse.status === 401 || issueResponse.status === 403) {
    return res.status(issueResponse.status).json({ error: "Jira authentication or permission check failed." });
  }
  if (!issueResponse.ok) return res.status(502).json({ error: "Jira returned an unavailable issue response." });

  const issue = await issueResponse.json();
  const fields = issue.fields || {};
  const description = jiraText(fields.description);
  const acceptance = Object.entries(fields)
    .filter(([name, value]) => /acceptance/i.test(name) && value != null)
    .map(([, value]) => jiraText(value))
    .filter(Boolean)
    .join("\n");

  const source = {
    key: issue.key,
    summary: fields.summary || "",
    description: description || "Insufficient information to determine.",
    acceptanceCriteria: acceptance || "Insufficient information to determine.",
    status: jiraText(fields.status?.name),
    priority: jiraText(fields.priority?.name),
    issueType: jiraText(fields.issuetype?.name),
    labels: Array.isArray(fields.labels) ? fields.labels : []
  };

  const prompt = `Use only the source Jira content below. Follow the supplied template exactly: same section names and order. Mark missing details exactly as "Insufficient information to determine.". Label proposed testing activities as proposals. Do not invent requirements or facts. Return Markdown only.\n\nTemplate:\n${template}\n\nJira source:\n${JSON.stringify(source, null, 2)}`;

  let aiResponse;
  try {
    aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
          { role: "system", content: "Generate deterministic test planning content from supplied source data. Never invent facts." },
          { role: "user", content: prompt }
        ]
      })
    });
  } catch {
    return res.status(502).json({ error: "Unable to reach the AI provider." });
  }
  if (!aiResponse.ok) return res.status(aiResponse.status).json({ error: "AI generation failed." });

  const aiData = await aiResponse.json();
  const plan = aiData.choices?.[0]?.message?.content;
  if (!plan) return res.status(502).json({ error: "The AI provider returned no test plan." });
  res.json({ issueKey, source, plan });
});

const dist = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

module.exports = app;

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, "localhost", () => console.log(`Server running at http://localhost:${port}`));
}
