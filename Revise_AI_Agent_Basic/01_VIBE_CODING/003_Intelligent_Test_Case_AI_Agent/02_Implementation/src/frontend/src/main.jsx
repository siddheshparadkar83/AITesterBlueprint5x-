import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [page, setPage] = useState("main");
  const [ticket, setTicket] = useState("");
  const [issue, setIssue] = useState(null);
  const [testCases, setTestCases] = useState("");
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
    setTestCases("");
    try {
      const response = await fetch("/api/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Test case generation failed.");
      setIssue(data.issue);
      setTestCases(data.testCases);
      setMessage("Draft generated. Review before execution.");
    } catch (error) {
      setMessage(error.message || "Test case generation failed.");
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

  async function copyTestCases() {
    try {
      await navigator.clipboard.writeText(testCases);
      setMessage("Test cases copied.");
    } catch {
      setMessage("Could not copy. Select and copy the test case text.");
    }
  }

  function downloadTestCases() {
    const blob = new Blob([testCases], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue?.key || "test-cases"}-test-cases.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">Q</span><span>Test Case Generator</span></div>
        <nav className="top-nav" aria-label="Main navigation">
          <button className={page === "main" ? "nav-button selected" : "nav-button"} onClick={() => setPage("main")}>Main page</button>
          <button className={page === "settings" ? "nav-button selected" : "nav-button"} onClick={() => setPage("settings")}>Settings</button>
        </nav>
      </header>

      <main className="content">
        {page === "main" ? (
          <section className="main-panel">
            <p className="eyebrow">JIRA → TEST CASES</p>
            <h1>Main page</h1>
            <div className="result" aria-live="polite">
              {busy ? (
                <div className="loading"><span className="spinner" /> Retrieving ticket and generating test cases...</div>
              ) : testCases ? (
                <div className="test-case-result">
                  {issue && <a className="issue-reference" href={issue.url} target="_blank" rel="noreferrer">{issue.key}: {issue.summary}</a>}
                  <div className="output-actions">
                    <button className="secondary-button" type="button" onClick={copyTestCases}>Copy</button>
                    <button className="secondary-button" type="button" onClick={downloadTestCases}>Download .md</button>
                  </div>
                  <textarea aria-label="Editable generated test cases" value={testCases} onChange={(event) => setTestCases(event.target.value)} />
                </div>
              ) : (
                <div className="empty-output">
                  <div className="document-icon"><span /><span /><span /></div>
                  <p>Your test cases will appear here.</p>
                </div>
              )}
            </div>
            {message && testCases && <p className="notice">{message}</p>}
            {!testCases && message && !busy && <p className="error-text">{message}</p>}
            <form className="ticket-form" onSubmit={generate}>
              <label className="sr-only" htmlFor="jira-ticket">Jira ticket</label>
              <input
                id="jira-ticket"
                aria-label="Jira ticket"
                value={ticket}
                onChange={(event) => setTicket(event.target.value.toUpperCase())}
                placeholder="Prompt (JIRA Ticket, e.g. KAN_5)"
                pattern="[A-Za-z][A-Za-z0-9]*[-_][0-9]+"
                title="Enter a Jira ticket such as KAN_5"
                required
              />
              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? "Working..." : "Generate Test Cases"}
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
      <footer>Generated test cases are drafts. Verify requirements before execution.</footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
