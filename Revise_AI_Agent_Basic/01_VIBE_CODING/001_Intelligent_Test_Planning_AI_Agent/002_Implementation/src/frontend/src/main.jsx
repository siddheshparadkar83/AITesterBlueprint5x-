import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

async function readApiResponse(response) {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`The server returned an empty response (HTTP ${response.status}). Check the backend and try again.`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`The server returned an invalid response (HTTP ${response.status}). Check the backend logs.`);
  }
}

function App() {
  const [page, setPage] = useState("main");
  const [issueId, setIssueId] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ jiraConfigured: false, groqConfigured: false });
  const [testState, setTestState] = useState("");
  const [groqTestState, setGroqTestState] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => {});
  }, []);

  async function generate(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setStatus("");
    setPlan("");
    try {
      const response = await fetch("/api/test-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId })
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || "Request failed.");
      setPlan(data.plan);
      setStatus(`DRAFT — ${data.issue.key}`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function testJira() {
    setTestState("Testing...");
    try {
      const response = await fetch("/api/settings/test-jira", { method: "POST" });
      const data = await response.json();
      setTestState(response.ok ? "Jira connection successful" : data.error);
    } catch {
      setTestState("Could not reach the backend.");
    }
  }

  async function testGroq() {
    setGroqTestState("Testing...");
    try {
      const response = await fetch("/api/settings/test-groq", { method: "POST" });
      const data = await response.json();
      setGroqTestState(response.ok ? "Groq connection successful" : data.error);
    } catch {
      setGroqTestState("Could not reach the backend.");
    }
  }

  return (
    <main className="shell">
      {page === "main" ? (
        <section className="panel main-panel">
          <h1>Main page</h1>
          <div className="result" aria-live="polite">
            {loading ? <p>Loading...</p> : plan ? <pre>{plan}</pre> : <p>{status || "Reply with Test Plan"}</p>}
          </div>
          <form onSubmit={generate}>
            <input
              aria-label="Jira issue ID"
              value={issueId}
              onChange={(event) => setIssueId(event.target.value)}
              placeholder="Prompt (JIRA Ticket)"
            />
            <button type="submit" disabled={loading}>Generate</button>
          </form>
        </section>
      ) : (
        <section className="panel settings-panel">
          <h1>Settings</h1>
          <div className="card">
            <h2>JIRA Connection</h2>
            <p>Token, Email, URL</p>
            <button type="button" onClick={testJira}>Test Connection</button>
            <p className="setting-status">{testState || (settings.jiraConfigured ? "Configured" : "Not configured")}</p>
          </div>
          <div className="card">
            <h2>LLM Configuration</h2>
            <p>1. Ollama Connection</p>
            <p>2. Groq.com (api Key)</p>
            <button type="button" onClick={testGroq}>Test Connection</button>
            <p className="setting-status">{groqTestState || (settings.groqConfigured ? "Groq configured" : "Groq not configured")}</p>
          </div>
        </section>
      )}
      <nav aria-label="Page navigation">
        <button type="button" className={page === "main" ? "active" : ""} onClick={() => setPage("main")}>Main</button>
        <button type="button" className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>Settings</button>
      </nav>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
