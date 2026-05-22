# GHD CrUX Mobile Web Vitals — Automated Monitoring Setup

## Overview
Automated weekly health check that queries GHD Hair's Core Web Vitals via the Chrome UX Report (CrUX) API and sends alerts to Slack when performance thresholds are breached.

**Key capabilities:**
- Queries GHD Hair's mobile (PHONE) p75 Core Web Vitals metrics
- Checks LCP, INP, and CLS against Google's recommended thresholds
- Sends Slack alerts with metric definitions when thresholds are breached
- Runs automatically every Monday at 9:00 AM UTC
- Can be triggered manually anytime via GitHub Actions

---

## Setup Steps

### 1. Google Cloud Platform
- Created a personal GCP project
- Enabled the **Chrome UX Report API**
- Generated an API key restricted to the Chrome UX Report API only

### 2. GitHub Repository
- Created a new private repository (`Crux-monitoring`)
- Added two repository secrets under **Settings → Secrets and variables → Actions**:
  - `CRUX_API_KEY` — GCP API key
  - `SLACK_WEBHOOK_URL` — Slack incoming webhook URL

### 3. Slack
- Created a dedicated channel (`#crux-monitoring-test`) in the DevOps Monitoring workspace
- Created a new Slack app via [api.slack.com/apps](https://api.slack.com/apps)
- Enabled **Incoming Webhooks** and linked the webhook to the channel

### 4. Script & Workflow (VS Code)
- Created `crux-check.js` — queries the CrUX API, evaluates thresholds, and sends Slack alerts
- Created `.env` for local testing and `.gitignore` to prevent secrets being pushed
- Created `.github/workflows/crux-check.yml` — GitHub Actions workflow with weekly cron schedule and manual trigger
- Tested the script locally, confirming alerts fire correctly in Slack

### 5. Deployment
- Initialised git, committed all files, and pushed to GitHub
- Navigated to **Actions → CrUX Weekly Health Check** and executed a manual run to confirm end-to-end functionality

---

## Thresholds

| Metric | Full Name | Threshold |
|---|---|---|
| LCP | Largest Contentful Paint | ≤ 2.5s |
| INP | Interaction to Next Paint | ≤ 200ms |
| CLS | Cumulative Layout Shift | ≤ 0.1 |
