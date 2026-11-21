import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [page, setPage] = useState("main");
  const [issueKey, setIssueKey] = useState("");
  const [issue, setIssue] = useState(null);
  const [strategy, setStrategy] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [integrations, setIntegrations] = useState({ jiraConfigured: false, groqConfigured: false });
  const [jiraTest, setJiraTest] = useState("");
  const [groqTest, setGroqTest] = useState("");

  useEffect(() => {
    fetch("/api/status")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load connection status.");
        setIntegrations(await response.json());
      })
      .catch(() => setMessage("Could not load backend status."));
  }, []);

  async function generate(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setIssue(null);
    setStrategy("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueKey })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Strategy generation failed.");
      setIssue(data.issue);
      setStrategy(data.strategy);
      setMessage("Draft generated. Review and edit before using.");
    } catch (error) {
      setMessage(error.message || "Strategy generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function checkConnection(service) {
    const setState = service === "jira" ? setJiraTest : setGroqTest;
    setState("Testing...");
    try {
      const response = await fetch(`/api/settings/test-${service}`, { method: "POST" });
      const data = await response.json();
      setState(response.ok ? `${service === "jira" ? "Jira" : "Groq"} connection successful.` : data.error);
    } catch {
      setState("Could not reach the backend.");
    }
  }

  async function copyStrategy() {
    try {
      await navigator.clipboard.writeText(strategy);
      setMessage("Strategy copied.");
    } catch {
      setMessage("Could not copy. Select and copy the strategy text.");
    }
  }

  function downloadStrategy() {
    const blob = new Blob([strategy], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue?.key || "test-strategy"}-test-strategy.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">Q</span><span>Test Strategy Builder</span></div>
        <nav className="top-nav" aria-label="Main navigation">
          <button className={page === "main" ? "nav-button selected" : "nav-button"} onClick={() => setPage("main")}>Main page</button>
          <button className={page === "settings" ? "nav-button selected" : "nav-button"} onClick={() => setPage("settings")}>Settings</button>
        </nav>
      </header>

      <main className="content">
        {page === "main" ? (
          <section className="main-panel">
            <p className="eyebrow">JIRA → TEST STRATEGY</p>
            <h1>Main page</h1>
            <div className="result" aria-live="polite">
              {busy ? (
                <div className="loading"><span className="spinner" /> Retrieving ticket and preparing strategy...</div>
              ) : strategy ? (
                <div className="strategy-result">
                  {issue && <a className="issue-reference" href={issue.url} target="_blank" rel="noreferrer">{issue.key}: {issue.summary}</a>}
                  <div className="output-actions">
                    <button className="secondary-button" type="button" onClick={copyStrategy}>Copy</button>
                    <button className="secondary-button" type="button" onClick={downloadStrategy}>Download .md</button>
                  </div>
                  <textarea aria-label="Editable test strategy" value={strategy} onChange={(event) => setStrategy(event.target.value)} />
                </div>
              ) : (
                <div className="empty-output">
                  <div className="document-icon"><span /><span /><span /></div>
                  <p>Your test strategy will appear here.</p>
                </div>
              )}
            </div>
            {message && strategy && <p className="notice">{message}</p>}
            {!strategy && message && !busy && <p className="error-text">{message}</p>}
            <form className="ticket-form" onSubmit={generate}>
              <label className="sr-only" htmlFor="jira-ticket">Jira ticket</label>
              <input
                id="jira-ticket"
                aria-label="Jira ticket"
                value={issueKey}
                onChange={(event) => setIssueKey(event.target.value.toUpperCase())}
                placeholder="JIRA Ticket (e.g., KAN-5)"
                pattern="[A-Za-z][A-Za-z0-9]*-[0-9]+"
                title="Enter a Jira ticket such as KAN-5"
                required
              />
              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? "Working..." : "Generate Test Strategy"}
              </button>
            </form>
          </section>
        ) : (
          <section className="settings-page">
            <p className="eyebrow">CONFIGURATION</p>
            <h1>Settings</h1>
            <p className="subheading">Connections use backend environment variables. Secrets are never shown here.</p>
            <div className="settings-grid">
              <article className="card setting-card">
                <div className="setting-icon jira-icon">J</div>
                <h2>Jira connection</h2>
                <p>Jira URL, email, and API token</p>
                <div className="connection-state"><span className={integrations.jiraConfigured ? "state-dot good" : "state-dot"} />{integrations.jiraConfigured ? "Configured on backend" : "Not configured"}</div>
                <button className="secondary-button" type="button" onClick={() => checkConnection("jira")}>Test Connection</button>
                {jiraTest && <p className={jiraTest.includes("successful") ? "success-text" : "setting-result"}>{jiraTest}</p>}
              </article>
              <article className="card setting-card">
                <div className="setting-icon groq-icon">G</div>
                <h2>LLM Configuration</h2>
                <p>Groq API key</p>
                <div className="connection-state"><span className={integrations.groqConfigured ? "state-dot good" : "state-dot"} />{integrations.groqConfigured ? "Configured on backend" : "Not configured"}</div>
                <button className="secondary-button" type="button" onClick={() => checkConnection("groq")}>Test Connection</button>
                {groqTest && <p className={groqTest.includes("successful") ? "success-text" : "setting-result"}>{groqTest}</p>}
              </article>
            </div>
          </section>
        )}
      </main>
      <footer>Generated strategies are drafts and require QA review.</footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
