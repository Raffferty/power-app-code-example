---
name: run-raftestpowerapp
description: Build, run, and drive RafTestPowerApp (a Vite + React Power Platform Code App). Use when asked to start the app, run the dev server, build it, take a screenshot of its UI, or interact with the running app.
---

This is a Vite + React web app (bootstrapped from the Vite React
template, wired up as a Power Platform Code App via
`@microsoft/power-apps`). There is no browser window to open in this
container — drive it headlessly: start the Vite dev server, then
control a headless Chromium page against it. Prefer `chromium-cli` if
it's installed in this environment; otherwise use the committed
fallback driver at `.claude/skills/run-raftestpowerapp/driver.mjs`
(same command vocabulary, one dependency: the project's own
`playwright` devDependency).

All paths below are relative to the repo root.

## Prerequisites

Node + npm (already required to build the app at all). Playwright is
a project devDependency — `npm install` pulls in the `playwright` npm
package, but the actual browser binary is a separate one-time
download, cached outside the repo:

```bash
npm install
npx playwright install chromium
```

No `apt-get` packages were needed on this machine (macOS). On a bare
Linux container, `npx playwright install --with-deps chromium` pulls
the missing shared libs too.

## Build

Not required to run the dev server. For a production build check:

```bash
npm run build   # tsc -b && vite build
```

## Run (agent path)

Start the dev server in the background and poll the port — don't
`sleep`, and note `timeout(1)` isn't available on macOS, so poll with
a loop instead:

```bash
npm run dev > /tmp/vite-dev.log 2>&1 &
disown
i=0
until curl -sf http://localhost:5173 >/dev/null || [ $i -ge 30 ]; do sleep 1; i=$((i+1)); done
curl -sf http://localhost:5173 >/dev/null && echo "SERVER UP" || cat /tmp/vite-dev.log
```

Then drive it. If `chromium-cli` is available:

```bash
chromium-cli --session raftestpowerapp <<'EOF'
nav http://localhost:5173
wait-for text=Vite
screenshot
click button
click button
screenshot
console --errors
EOF
```

Otherwise use the committed fallback driver (verified working in this
repo — same command syntax as above):

```bash
node .claude/skills/run-raftestpowerapp/driver.mjs raftestpowerapp <<'EOF'
nav http://localhost:5173
wait-for text=Vite
screenshot /tmp/raftestpowerapp-1.png
click button
click button
screenshot /tmp/raftestpowerapp-2.png
console --errors
EOF
```

That's the whole loop: `nav` → `wait-for` the text you expect →
`screenshot` → interact (`click`/`fill`/`press`) → `screenshot` again
→ `console --errors` to confirm nothing threw. The default app shell
renders "Vite + React" with a `count is N` button — clicking it twice
should produce "count is 2" in the second screenshot; that's the one
representative interaction confirming the app is alive and reactive,
not just serving a static shell.

| driver.mjs command | what it does |
|---|---|
| `nav <url>` | navigate, waits for network idle |
| `wait-for text=<substring>` | wait up to 15s for matching text to appear |
| `click <selector>` | Playwright click |
| `fill <selector> <text>` | Playwright fill (goes through React's input pipeline) |
| `press <key>` | keyboard press |
| `sleep <ms>` | fixed wait, avoid unless polling isn't possible |
| `screenshot [path]` | full-page screenshot, defaults to `/tmp/<session>-<n>.png` |
| `console --errors` | prints collected `console.error`/`pageerror` output as JSON |

Stop the dev server by killing the port's listener (not the npm
wrapper's `$!` — npm doesn't forward `SIGTERM` to the Vite process it
spawns):

```bash
lsof -ti:5173 -sTCP:LISTEN | xargs -r kill
```

## Run (human path)

```bash
npm run dev   # → http://localhost:5173, Ctrl-C to stop
```

## Test

No test suite is configured in `package.json` yet (no `test` script).
`npm run lint` runs ESLint.

## Gotchas

- **`timeout` is not a builtin on macOS** (`command not found: timeout`)
  — poll with a `until ... || [ $i -ge N ]` loop instead, as above.
- **`chromium-cli` was not installed in this environment** — the
  `driver.mjs` fallback exists specifically for that case and mirrors
  its command syntax so either can be used with the same heredoc.
- **Playwright's browser binary isn't part of `npm install`** — it's a
  separate ~180MB download cached under
  `~/Library/Caches/ms-playwright` (macOS) / `~/.cache/ms-playwright`
  (Linux), outside the repo. Run `npx playwright install chromium`
  once per machine.
