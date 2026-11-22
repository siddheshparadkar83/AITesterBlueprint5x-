import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

export const config = {
  jira: {
    baseUrl: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    token: process.env.JIRA_TOKEN
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY
  }
};

export function jiraConfigured() {
  return Boolean(config.jira.baseUrl && config.jira.email && config.jira.token);
}

export function jiraRequest(pathname) {
  const baseUrl = config.jira.baseUrl.replace(/\/$/, "");
  const auth = Buffer.from(`${config.jira.email}:${config.jira.token}`).toString("base64");
  return fetch(`${baseUrl}${pathname}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" }
  });
}
