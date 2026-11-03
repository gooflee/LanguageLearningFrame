# LanguageLearningFrame (FrameOS — Seeed Studio reTerminal Sticky)

A FrameOS scene and TSX application designed for the **Seeed Studio reTerminal Sticky** (`seeed_reterminal_sticky` preset: 3.97" `800×480` black-and-white e-ink display powered by ESP32-S3).

## Project Structure

- [`src/app/app.tsx`](src/app/app.tsx) — Main FrameOS TSX UI component (`get(app, context)`) rendered at `800×480` (Landscape) or `480×800` (Portrait), using QuickJS-safe formatting and inline `<svg>` vector icons.
- [`src/app/vocab.ts`](src/app/vocab.ts) — ESP32-optimized compact pipe-delimited vocabulary decks (Spanish, French, German, Japanese, Korean) with built-in Ubuntu font compatibility + optional native CJK mode.
- [`src/app/config.json`](src/app/config.json) — FrameOS data app metadata and output schema.
- [`src/controls/app.ts`](src/controls/app.ts) — Logic app (`run(app, context)`) handling physical Sticky GPIO buttons (`GPIO 4` AI, `GPIO 5` UP, `GPIO 6` DOWN) and `back` / `forward` edge swipes.
- [`src/scene.template.json`](src/scene.template.json) — FrameOS scene node graph, state fields, and event flows.
- [`src/types/frameos.d.ts`](src/types/frameos.d.ts) — Complete TypeScript ambient declarations for `frameos`, `FrameOSApp`, `FrameOSContext`, and FrameOS JSX.
- [`Build-Scene.ps1`](Build-Scene.ps1) / [`build.cmd`](build.cmd) — Bundler that compiles `src/` into `dist/language-learning-scene.zip`, `dist/frame-import-sticky.json`, `dist/scenes.json`, and `dist/scene.json`.
- [`Deploy-Scene.ps1`](Deploy-Scene.ps1) / [`deploy.cmd`](deploy.cmd) — Automated deployer for a Local Docker installation of FrameOS (`http://localhost:8989`).
- [`preview/index.html`](preview/index.html) — Zero-dependency interactive **Seeed Studio Sticky (800×480 E-Ink)** hardware simulator & state inspector.
- [`docs/scene-guide.md`](docs/scene-guide.md) & [`docs/jsx-ui.md`](docs/jsx-ui.md) — Official FrameOS scene & JSX UI documentation.
- [`docs/seeed-sticky-specs.md`](docs/seeed-sticky-specs.md) — Hardware & e-ink design guide for the Seeed Studio reTerminal Sticky.

## Quick Start

### 1. Build the FrameOS Bundle
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Build-Scene.ps1
```
This outputs:
- [`dist/language-learning-scene.zip`](dist/language-learning-scene.zip) — FrameOS Template `.zip` (`template.json` + `scenes.json` + `800×480` `image.jpg` thumbnail)
- [`dist/frame-import-sticky.json`](dist/frame-import-sticky.json) — Complete pre-configured **Seeed Studio reTerminal Sticky** Frame export with the scene pre-installed
- [`dist/scenes.json`](dist/scenes.json) & [`dist/scene.json`](dist/scene.json) — Raw FrameOS scene JSON files

### 2. Deploy to Your Local Docker FrameOS Installation (`http://localhost:8989`)

#### Option A: Import Scene `.zip` in the FrameOS Web UI (Recommended)
1. Open your local FrameOS Docker UI (default: `http://localhost:8989`).
2. Either go to **Templates → Import template**, or open your Frame → **Scenes → Add scene → Import from `.zip`**.
3. Select [`dist/language-learning-scene.zip`](dist/language-learning-scene.zip).

#### Option B: Import a Complete Pre-Configured Sticky Frame in the UI
1. In your local FrameOS Docker UI, click **New frame → Import frame**.
2. Upload [`dist/frame-import-sticky.json`](dist/frame-import-sticky.json) to create a `seeed_reterminal_sticky` (`800×480` ESP32-S3) frame with the scene already attached.

#### Option C: One-Command CLI Deploy (`Deploy-Scene.ps1`)
1. In your local FrameOS Docker UI, go to **Settings → API tokens and MCP** and create an API token.
2. Run:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Deploy-Scene.ps1 -ApiToken "<YOUR_API_TOKEN>" -CreateFrameIfMissing
```
*(If your Docker container runs on another host/port, add `-FrameOSUrl "http://<host>:8989"`).*
