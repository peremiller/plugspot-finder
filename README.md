# PlugSpot

PlugSpot is a public, mobile-friendly workspace finder for people who need a reliable outlet, usable Wi-Fi, and enough time to work. It combines precise map-based discovery, distance sorting, live in-app routes, community reports, and optional OpenAI assistance.

**Live app:** [plugspot-finder.ajmillertperez562.chatgpt.site](https://plugspot-finder.ajmillertperez562.chatgpt.site)

## What it does

- Finds outlet-friendly cafés, libraries, and coworking spaces on an interactive OpenStreetMap map.
- Uses GPS, a searched area, or a clicked map point as the starting location.
- Sorts by distance, travel time, workability, Wi-Fi speed, rating, or closing time.
- Shows community-tested download/upload speed, signal strength, opening hours, seating, outlet count, and confidence.
- Opens a live route inside the app, with an external Google Maps handoff when preferred.
- Supports optional ChatGPT sign-in for personalized saved places and alerts.
- Adds an OpenAI workspace planner, vision-based photo evidence checks, and community-note moderation when an API key is configured.
- Opens with a two-angle cinematic search sequence, then transitions into an immersive city-to-workspace scene.
- Includes user-controlled city ambience and interaction cues, with reduced-motion and tab-visibility safeguards.
- Uses stable, shareable URLs for places, routes, saved places, community activity, sign-in, reports, claims, and the AI planner.
- Carries the PlugSpot outlet-pin identity through the header, browser title, favicon, and mobile home-screen icon.

## OpenAI architecture

All OpenAI calls run in server routes. The browser never receives `OPENAI_API_KEY`.

| Capability | OpenAI product | Route |
| --- | --- | --- |
| Natural-language workspace planning | Responses API with structured outputs | `POST /api/ai/plan` |
| Outlet and seating evidence from photos | Vision through the Responses API | `POST /api/ai/verify` |
| Community safety screening | Moderation API | `POST /api/ai/moderate` |

The app remains fully usable when OpenAI is not configured; the AI panel clearly reports setup status without fabricating results.

## Local setup

Requirements: Node.js 22.13 or newer, npm, and the Linux tools used by the Sites build scripts.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Create a restricted project key in the [OpenAI Platform](https://platform.openai.com/api-keys), then set it locally:

```dotenv
OPENAI_API_KEY=your_project_key
OPENAI_MODEL=gpt-5.6-terra
```

Never commit an API key, paste it into an issue, or expose it through a `NEXT_PUBLIC_` variable.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
# Or run all checks:
npm run check
```

Pull requests run the same check suite in GitHub Actions. TypeScript strict mode is enabled. Server inputs are validated and size-limited, OpenAI calls time out, errors are sanitized, images are restricted by type and size, and moderation gracefully degrades when the optional AI service is unavailable.

## Project structure

```text
app/                    UI, authentication helpers, and API routes
app/api/ai/             Server-only OpenAI endpoints
lib/openai.ts           Shared secret access, timeout, and error handling
tests/                  Rendered application smoke tests
worker/                 Cloudflare/Vinext runtime entry point
.github/workflows/      Continuous integration
```

## Data and privacy

Location is requested only after a user action. Saved places and community-report counts in this prototype are stored in the browser. Photo verification sends the selected image to OpenAI only after the user explicitly clicks the check button. See [SECURITY.md](SECURITY.md) for reporting guidance.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
