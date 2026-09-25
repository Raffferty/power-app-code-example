#!/usr/bin/env node
// Minimal chromium-cli-style REPL driver, for environments where
// chromium-cli itself isn't installed. Reads newline-delimited
// commands from stdin, drives one headless Chromium page.
//
// Commands:
//   nav <url>
//   wait-for text=<substring>
//   click <selector>
//   fill <selector> <text...>
//   press <key>
//   sleep <ms>
//   screenshot [path]        (default: /tmp/<session>-<n>.png)
//   console --errors         (prints collected console/page errors as JSON)
//
// Usage:
//   node driver.mjs [session-name] <<'EOF'
//   nav http://localhost:5173
//   wait-for text=Vite
//   screenshot
//   click button
//   console --errors
//   EOF

import { chromium } from 'playwright';
import readline from 'node:readline';

const session = process.argv[2] || 'default';
const errors = [];
const responses = [];
let shotCount = 0;

const browser = await chromium.launch();
const page = await browser.newPage({ bypassCSP: true, extraHTTPHeaders: { 'Cache-Control': 'no-cache' } });
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push(String(err)));
page.on('response', async (res) => {
  const url = res.url();
  if (/dataverse|catalogueitem|internalorder|api\.crm|\/api\/data\//i.test(url)) {
    try {
      const body = await res.text();
      responses.push({ url, status: res.status(), body: body.slice(0, 20000) });
    } catch {
      responses.push({ url, status: res.status(), body: '<unreadable>' });
    }
  }
});

const rl = readline.createInterface({ input: process.stdin });

for await (const raw of rl) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [cmd, ...rest] = line.split(' ');
  try {
    if (cmd === 'nav') {
      await page.goto(rest.join(' '), { waitUntil: 'networkidle' });
      console.log(`OK nav ${rest.join(' ')}`);
    } else if (cmd === 'wait-for') {
      const arg = rest.join(' ');
      const text = arg.startsWith('text=') ? arg.slice(5) : arg;
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
      console.log(`OK wait-for ${arg}`);
    } else if (cmd === 'click') {
      await page.click(rest.join(' '));
      console.log(`OK click ${rest.join(' ')}`);
    } else if (cmd === 'fill') {
      const [selector, ...text] = rest;
      await page.fill(selector, text.join(' '));
      console.log(`OK fill ${selector}`);
    } else if (cmd === 'press') {
      await page.keyboard.press(rest.join(' '));
      console.log(`OK press ${rest.join(' ')}`);
    } else if (cmd === 'sleep') {
      await page.waitForTimeout(Number(rest[0]));
      console.log(`OK sleep ${rest[0]}`);
    } else if (cmd === 'screenshot') {
      shotCount += 1;
      const path = rest[0] || `/tmp/${session}-${shotCount}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`OK screenshot ${path}`);
    } else if (cmd === 'console') {
      console.log('CONSOLE_ERRORS:', JSON.stringify(errors));
    } else if (cmd === 'network') {
      const filter = rest.join(' ');
      const matched = filter ? responses.filter((r) => r.url.includes(filter)) : responses;
      console.log('NETWORK:', JSON.stringify(matched));
    } else {
      console.log(`ERR unknown command: ${cmd}`);
    }
  } catch (err) {
    console.log(`ERR ${cmd}: ${err.message}`);
  }
}

await browser.close();
