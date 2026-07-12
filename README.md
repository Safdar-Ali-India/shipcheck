# ShipCheck

ShipCheck is a free no-login QA tool for web teams.
It combines:

- **AI browser smoke testing** (auto-crawl, form checks, step reports, replay video)
- **Visual diff testing** (pixel-by-pixel screenshot comparison)

**Live:** [shipcheck-seven.vercel.app](https://shipcheck-seven.vercel.app)  
**Author:** [Safdar Ali](https://safdarali.in)

## UI Preview

![ShipCheck UI (local preview)](file:///Users/apple/.cursor/projects/Users-apple-Desktop-Theme-untitled-folder-Projects-shipcheck/assets/Shipcheck___Build_By_Safdar_Ali-02a0a8b5-171a-433a-a809-a77c4d62a205.png)

## Core Features

### 1) AI Browser Test
- One-click auto test for any public URL
- Real Chromium run with screenshot-per-step and optional video replay
- Safer form handling (skips sensitive login/payment patterns)
- Console + network logs in report
- Run history + shareable report URLs (`/reports/:id`)

### 2) Visual Diff
- Upload mode (PNG/JPEG/WebP)
- URL capture mode (desktop/tablet/mobile viewport)
- Side-by-side, overlay, diff-only, split comparison views
- JSON export

### 3) Security & Reliability
- SSRF protection (`assertSafeUrl`)
- In-memory rate limiting
- Retry + fallback strategies for flaky page load/selectors
- Configurable canonical redirect (`CANONICAL_HOST`) with safe fallback behavior

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Playwright
- Zod
- Vitest

## Getting Started

```bash
git clone <your-repo>
cd shipcheck
npm install
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run test` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## Environment Variables

No required env vars for local development.

Optional:

```env
# Optional canonical redirect target.
# Leave unset if you want Vercel domain and custom domain to both work.
CANONICAL_HOST=shipcheck.safdarali.in
```

## API Endpoints

- `POST /api/browser-test` -> run browser test
- `GET /api/browser-test` -> list recent runs
- `GET /api/browser-test/[id]` -> fetch one report JSON
- `GET /api/browser-test/video/[id]` -> fetch replay video
- `POST /api/screenshot` -> screenshot capture for visual diff

## Test Cases

### Automated (Vitest)
- URL safety checks (protocol/private hosts/rate limit)
- Compare math and image validation
- Canonical host redirect logic
- Auto-journey helper scoring + URL normalization

### Manual QA Cases (recommended before release)
1. Run auto test on `https://example.com` and verify report renders steps, logs, and replay.
2. Run auto test on local app (`http://localhost:<port>`) in dev mode.
3. Confirm share URL opens report page (`/reports/:id`) on a fresh tab/session.
4. Confirm history list updates after each run and links are valid.
5. Verify visual diff in upload mode with two clearly different images.
6. Verify visual diff in URL mode at all 3 viewports.
7. Validate no forced redirect happens when `CANONICAL_HOST` is unset.
8. Validate canonical redirect works for custom hosts when `CANONICAL_HOST` is set.

## Deployment Notes (Vercel)

1. Import repo into Vercel
2. Add custom domain (optional)
3. Set `CANONICAL_HOST` only after DNS is correctly configured
4. Ensure Playwright browser install runs in build (`postinstall` already included)

## Contributing

PRs welcome. Run these before opening a PR:

```bash
npm run test
npm run build
```
