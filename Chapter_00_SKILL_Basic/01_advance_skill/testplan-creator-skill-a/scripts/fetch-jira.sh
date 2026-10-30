#!/usr/bin/env bash
set -euo pipefail

: "${JIRA_BASE_URL:?Set JIRA_BASE_URL to your Jira site URL}"
: "${JIRA_EMAIL:?Set JIRA_EMAIL to your Atlassian account email}"
: "${JIRA_TOKEN:?Set JIRA_TOKEN to your Atlassian API token}"
: "${KEY:?Set KEY to the Jira issue key, for example PROJECT-123}"

if ! command -v jq >/dev/null 2>&1; then
  printf 'Error: jq is required but was not found on PATH.\n' >&2
  exit 127
fi

jira_base_url=${JIRA_BASE_URL%/}

curl --fail --silent --show-error \
  --user "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  --header 'Accept: application/json' \
  "${jira_base_url}/rest/api/3/issue/${KEY}?fields=summary,description,issuetype,priority,components,labels,fixVersions,issuelinks,attachment" \
| jq '{
    key: .key,
    summary: .fields.summary,
    type: .fields.issuetype.name,
    priority: .fields.priority.name,
    components: [.fields.components[]?.name],
    labels: .fields.labels,
    fixVersions: [.fields.fixVersions[]?.name],
    description: .fields.description,
    links: [.fields.issuelinks[]? | {type: .type.name, key: (.outwardIssue.key // .inwardIssue.key)}],
    attachments: [.fields.attachment[]? | .filename]
  }'
