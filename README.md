# ShipCheck

> Free visual regression testing tool — compare screenshots pixel by pixel.

**Live:** [shipcheck.safdarali.in](https://shipcheck.safdarali.in)

Built by [Safdar Ali](https://safdarali.in)

## Features

- **Upload mode** — Compare two PNG, JPEG, or WebP images (processed in-browser)
- **URL mode** — Capture full-page screenshots with Playwright (desktop, tablet, mobile)
- **Pixel diff engine** — Canvas-based comparison with configurable tolerance
- **Multiple views** — Side-by-side, overlay, diff-only, and split slider
- **Export** — Download diff PNG and JSON metadata reports
- **SEO optimized** — Structured data, FAQ, sitemap, robots.txt
- **Dark mode** — System, light, and dark themes
- **Secure** — SSRF protection, rate limiting, input validation, no permanent storage

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Canvas API (client-side diff)
- Playwright (URL screenshots)
- Zod + React Hook Form
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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run format` | Prettier |

## Environment Variables

No required env vars for local development.

Optional:

```env
# If set, middleware redirects custom hosts to this canonical domain.
# Leave unset to avoid forced redirects.
CANONICAL_HOST=shipcheck.safdarali.in
```

For production on Vercel, Playwright needs the `@playwright/browser-chromium` or serverless-compatible setup. On Vercel, consider using `@sparticuz/chromium` for serverless Playwright.

```env
# Analytics (auto-enabled via @vercel/analytics)
```

## Architecture

```
src/
├── app/                  # Next.js routes, API, metadata
├── components/
│   ├── compare/          # Compare tool UI
│   ├── layout/           # Header, footer, theme
│   ├── marketing/        # Feature cards, use cases
│   ├── seo/              # Structured data, FAQ
│   └── ui/               # Reusable primitives
├── lib/
│   ├── compareImages.ts  # Canvas diff engine
│   ├── security.ts       # SSRF + rate limiting
│   └── validation.ts     # Zod schemas
├── services/
│   └── screenshot.ts     # Playwright capture
└── types/
    └── compare.ts        # Shared types
```

## Deployment

Optimized for Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Set domain to `shipcheck.safdarali.in`
4. Deploy

For Playwright on Vercel serverless, install browsers in build step:

```json
"postinstall": "npx playwright install chromium"
```

## Security

- Uploads processed client-side only
- URL screenshots validated against SSRF (blocks localhost, private IPs)
- Rate limiting on screenshot API
- CSP and security headers via middleware
- 10 MB upload limit with MIME validation

## Roadmap

- [ ] CI/CD GitHub Action integration
- [ ] Batch URL comparison
- [ ] Visual diff history (local storage)
- [ ] AI-powered change summaries
- [ ] Blog with MDX

## License

MIT

## Contributing

PRs welcome. Please run `npm run lint` and `npm run test` before submitting.
# shipcheck
