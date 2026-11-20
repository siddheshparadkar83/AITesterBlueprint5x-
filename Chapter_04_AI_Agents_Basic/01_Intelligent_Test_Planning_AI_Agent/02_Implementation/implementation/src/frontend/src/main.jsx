import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [view, setView] = useState("main");
  const [issueKey, setIssueKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [settings, setSettings] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [credentials, setCredentials] = useState({
    JIRA_BASE_URL: "",
    JIRA_EMAIL: "",
    JIRA_TOKEN: "",
    GROQ_API_KEY: ""
  });
  const [envMessage, setEnvMessage] = useState("");

  function updateCredential(name, value) {
    setCredentials((current) => ({ ...current, [name]: value }));
  }

  async function loadEnvFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const contents = await file.text();
      const parsed = {};
      for (const line of contents.split(/\r?\n/)) {
        const match = line.match(/^\s*(JIRA_BASE_URL|JIRA_EMAIL|JIRA_TOKEN|GROQ_API_KEY)\s*=\s*(.*?)\s*$/);
        if (match) parsed[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
      }
      setCredentials((current) => ({ ...current, ...parsed }));
      setEnvMessage("Environment values loaded for this session.");
    } catch {
      setEnvMessage("Unable to read the selected .env file.");
    } finally {
      event.target.value = "";
    }
  }

  async function openSettings() {
    setView("settings");
    setError("");
    try {
      const response = await fetch("/api/settings");
      setSettings(await response.json());
    } catch {
      setError("Unable to load settings.");
    }
  }

  async function testConnection(target) {
    setConnectionStatus((current) => ({ ...current, [target]: { state: "testing" } }));
    setLoading(true);
    try {
      const response = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, config: credentials })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSettings((current) => ({ ...current, [target === "jira" ? "jiraConfigured" : "groqConfigured"]: true }));
      setConnectionStatus((current) => ({
        ...current,
        [target]: { state: "success", message: "Connection has been established." }
      }));
    } catch (e) {
      setConnectionStatus((current) => ({
        ...current,
        [target]: { state: "failure", message: `Connection Failed: ${e.message}` }
      }));
    } finally {
      setLoading(false);
    }
  }

  async function generate(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueKey, config: credentials })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Test plan generation failed.");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      {view === "main" ? (
        <div className="layout">
          <section className="card main-card">
            <h1>Reply with Test Plan</h1>
            <div className="output">
              {loading && <p>Generating test plan...</p>}
              {error && <p className="error">{error}</p>}
              {result ? <article dangerouslySetInnerHTML={{ __html: markdownToHtml(result.plan) }} /> : !loading && !error && <p>Enter a Jira ticket to begin.</p>}
            </div>
            <form onSubmit={generate}>
              <input
                aria-label="Jira Ticket"
                value={issueKey}
                onChange={(e) => setIssueKey(e.target.value)}
                placeholder="Prompt (JIRA Ticket)"
                disabled={loading}
              />
            </form>
          </section>
          <aside className="nav-card">
            <button className="nav-button" onClick={openSettings}>Settings</button>
          </aside>
        </div>
      ) : (
        <section className="card settings-card">
          <h1>Settings</h1>
          <button className="back" onClick={() => setView("main")}>← Main</button>
          <div className="env-upload">
            <label htmlFor="env-file">Load .env file</label>
            <input id="env-file" type="file" accept=".env,text/plain" onChange={loadEnvFile} />
            {envMessage && <p className="success" role="status">{envMessage}</p>}
            <small>Values stay in this page only and are cleared when you reload it.</small>
          </div>
          <div className="setting-box">
            <strong>JIRA Connection</strong>
            <label>Jira URL<input type="url" autoComplete="url" value={credentials.JIRA_BASE_URL} onChange={(e) => updateCredential("JIRA_BASE_URL", e.target.value)} placeholder="https://your-site.atlassian.net" /></label>
            <label>Email<input type="email" autoComplete="email" value={credentials.JIRA_EMAIL} onChange={(e) => updateCredential("JIRA_EMAIL", e.target.value)} placeholder="you@example.com" /></label>
            <label>API Token<input type="password" autoComplete="off" value={credentials.JIRA_TOKEN} onChange={(e) => updateCredential("JIRA_TOKEN", e.target.value)} /></label>
            <div className={settings?.jiraConfigured ? "configured" : "missing"}>{settings ? (settings.jiraConfigured ? "Configured" : "Missing") : "Loading..."}</div>
            <button onClick={() => testConnection("jira")} disabled={loading}>Test Connection</button>
            {connectionStatus.jira && (
              <p className={connectionStatus.jira.state === "failure" ? "error" : "success"} role={connectionStatus.jira.state === "failure" ? "alert" : "status"}>
                {connectionStatus.jira.state === "testing" ? "Testing connection..." : connectionStatus.jira.message}
              </p>
            )}
          </div>
          <div className="setting-box">
            <strong>LLM Configuration</strong>
            <div>1. Ollama Connection</div>
            <div className="missing">Not configured</div>
            <div>2. Groq.com (API Key)</div>
            <label>Groq API Key<input type="password" autoComplete="off" value={credentials.GROQ_API_KEY} onChange={(e) => updateCredential("GROQ_API_KEY", e.target.value)} /></label>
            <button onClick={() => testConnection("groq")} disabled={loading}>Test Groq.com</button>
            {connectionStatus.groq && (
              <p className={connectionStatus.groq.state === "failure" ? "error" : "success"} role={connectionStatus.groq.state === "failure" ? "alert" : "status"}>
                {connectionStatus.groq.state === "testing" ? "Testing connection..." : connectionStatus.groq.message}
              </p>
            )}
            {error && <p className="error" role="alert">{error}</p>}
          </div>
        </section>
      )}
    </main>
  );
}

function markdownToHtml(markdown) {
  const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escape(markdown)
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^\|(.+)$/gm, (line) => `<div class="table-line">${line}</div>`)
    .replace(/^- (.+)$/gm, "<p>$1</p>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

createRoot(document.getElementById("root")).render(<App />);
