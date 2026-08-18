# کارها — Persian Todo (Tauri + React)

A personal, Notion/AFFiNE-styled todo app:

- **Today view** — a Jalali (Persian) week strip + agenda list, with optional time and duration per task.
- **Board view** — Kanban columns: **New → Doing → Finished**, drag-and-drop, powered by `@dnd-kit`.
- **AI chat sidebar** — talk to it in Persian or English ("move the report task to doing", "remind me tomorrow at 10am to call the doctor") and it creates/edits/moves/deletes todos through real tool calls, not guesses.
- **Bring your own model** — Settings accepts any OpenAI-compatible `base_url` + API key + model name (OpenAI, OpenRouter, Groq, Together, a local server, etc). Presets are one click away.
- Everything is local: SQLite file on your machine, API key stored only in that local DB, and requests go straight from your machine to the API you configured — nothing passes through a third party.

## Stack

- Tauri v2 (Rust shell) — `tauri-plugin-sql` (SQLite) + `tauri-plugin-http` (CORS-free fetch to your AI endpoint)
- React 18 + TypeScript + Vite + Tailwind
- `jalaali-js` for Jalali/Gregorian conversion, `@dnd-kit` for drag-and-drop
- `@fontsource/vazirmatn` — Persian UI font, bundled offline

## Prerequisites (one-time, per machine)

This project was scaffolded and type-checked here, but not compiled — that needs a full Rust + Tauri toolchain with a display, which this sandbox doesn't have. On your own machine:

1. **Node.js** 18+ and npm (you already have this if you're reading this from a working editor).
2. **Rust** — install via [rustup.rs](https://rustup.rs).
3. **Tauri system dependencies** for your OS — follow the official list for your platform: https://v2.tauri.app/start/prerequisites/
   - macOS: Xcode Command Line Tools.
   - Windows: Microsoft C++ Build Tools + WebView2 (usually preinstalled on Win 11).
   - Linux: `webkit2gtk`, `libayatana-appindicator3`, etc. — see the link above for your distro's exact package list.

## Run it

```bash
npm install
npm run tauri dev
```

This starts the Vite dev server and opens the native window. First launch creates `todo.db` (SQLite) next to the app's data directory automatically — no setup needed.

## Build a native installer

```bash
npm run tauri build
```

Outputs land in `src-tauri/target/release/bundle/`.

### Regenerate proper app icons (optional)

Placeholder icons are included so the project builds out of the box. To swap in your own:

```bash
npm run tauri icon path/to/your-logo.png
```

## Using the AI assistant

1. Open **Settings** (gear icon in the left rail).
2. Pick a preset or paste any OpenAI-compatible base URL, e.g.:
   - OpenAI: `https://api.openai.com/v1`
   - OpenRouter: `https://openrouter.ai/api/v1`
   - Groq: `https://api.groq.com/openai/v1`
   - A local server (Ollama's OpenAI-compatible endpoint, LM Studio, etc): `http://localhost:11434/v1` or similar
3. Paste your API key and a model name that supports **tool/function calling** (e.g. `gpt-4o-mini`, `gpt-4o`, most OpenRouter chat models, `llama-3.3-70b-versatile` on Groq).
4. Open the chat sidebar (spark icon) and just talk to it — it can:
   - `list_todos` — search/filter your todos
   - `create_todo` — make a new one, with optional Jalali date/time/duration
   - `update_todo` — edit title, notes, date, time, duration
   - `move_todo` — change its column (new/doing/finished)
   - `delete_todo` — remove it

## Project layout

```
src/
  lib/
    types.ts     shared types (Todo, AppSettings, ChatMessage)
    jalali.ts     Jalali calendar + Persian digit helpers
    db.ts         SQLite data access (todos + settings)
    ai.ts         OpenAI-compatible client + tool-calling loop
  components/
    TodayView.tsx    Jalali week strip + agenda
    BoardView.tsx    Kanban board (dnd-kit)
    TodoCard.tsx     card + draggable wrapper
    TodoModal.tsx    create/edit form
    ChatSidebar.tsx  AI chat panel
    SettingsModal.tsx  API base_url/key/model config
src-tauri/
  src/main.rs        registers the sql + http plugins
  tauri.conf.json     window, bundle, and CSP config
  capabilities/default.json   permission scopes for sql/http plugins
```

## Notes & things you may want to tweak

- The window CSP is disabled (`"csp": null`) so the app can call whatever AI endpoint you configure without fighting a content-security-policy allowlist. This is fine for a personal single-user app; tighten it if you ever ship this more broadly.
- Dates are stored as Jalali strings (`"1403-05-24"`) directly in SQLite — simplest for a Jalali-first UI, and what the AI's tools speak natively.
- Time is a plain `"HH:MM"` 24h string, intended as Tehran local time (there's a `nowTehranTime()` helper in `jalali.ts` if you want to prefill "now").
