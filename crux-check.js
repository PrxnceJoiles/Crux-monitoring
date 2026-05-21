require('dotenv').config();

const https = require('https');

const CRUX_API_KEY = process.env.CRUX_API_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const THRESHOLDS = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1
};

async function fetchCruxData() {
  const payload = JSON.stringify({
    origin: 'https://www.ghdhair.com',
    formFactor: 'PHONE',
    metrics: ['largest_contentful_paint', 'interaction_to_next_paint', 'cumulative_layout_shift']
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${CRUX_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sendSlackAlert(message) {
  const payload = JSON.stringify({ text: message });
  const url = new URL(SLACK_WEBHOOK_URL);

  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: url.hostname, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => { res.on('data', () => {}); res.on('end', resolve); }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('Fetching CrUX data for ghdhair.com...');
  const data = await fetchCruxData();
  const metrics = data.record.metrics;

  const lcp = metrics.largest_contentful_paint.percentiles.p75 / 1000;
  const inp = metrics.interaction_to_next_paint.percentiles.p75;
  const cls = metrics.cumulative_layout_shift.percentiles.p75;

  console.log(`LCP: ${lcp}s | INP: ${inp}ms | CLS: ${cls}`);

  const breaches = [];
  if (lcp > THRESHOLDS.LCP / 1000) breaches.push(`LCP: ${lcp}s (threshold: 2.5s)`);
  if (inp > THRESHOLDS.INP) breaches.push(`INP: ${inp}ms (threshold: 200ms)`);
  if (cls > THRESHOLDS.CLS) breaches.push(`CLS: ${cls} (threshold: 0.1)`);

  const allMetrics = `*Current p75 Metrics:*\n• LCP : ${lcp}s\n• INP : ${inp}ms\n• CLS : ${cls}`;

  if (breaches.length > 0) {
    const message = `:warning: *GHD Hair CrUX Alert*\nThe following Core Web Vitals metrics have breached their thresholds:\n${breaches.map(b => `• ${b}`).join('\n')}\n\n${allMetrics}\n\n*Metric Definitions:*\n• LCP (Largest Contentful Paint): measures loading performance. Good if under 2.5s\n• INP (Interaction to Next Paint): measures interactivity. Good if under 200ms\n• CLS (Cumulative Layout Shift): measures visual stability. Good if under 0.1`;
    await sendSlackAlert(message);
    console.log('Alert sent to Slack.');
  } else {
    const message = `:white_check_mark: *GHD Hair CrUX Weekly Report*\nAll Core Web Vitals metrics are within thresholds.\n\n${allMetrics}\n\n*Metric Definitions:*\n• LCP (Largest Contentful Paint): measures loading performance. Good if under 2.5s\n• INP (Interaction to Next Paint): measures interactivity. Good if under 200ms\n• CLS (Cumulative Layout Shift): measures visual stability. Good if under 0.1`;
    await sendSlackAlert(message);
    console.log('All metrics within thresholds. Report sent to Slack.');
  }
}

main().catch(console.error);