# Security policy

## Supported version

Security fixes are applied to the current `main` branch and the public deployment.

## Reporting a vulnerability

Do not open a public issue for a vulnerability or include API keys, access tokens, personal location data, or private photos in an issue. Contact the repository owner privately through their GitHub profile and include concise reproduction steps, impact, and a suggested mitigation if known.

## Secret handling

- Store `OPENAI_API_KEY` only in encrypted hosting environment settings or an untracked local environment file.
- Use restricted project keys with the minimum required permissions and budget controls.
- Rotate a key immediately if it appears in logs, chat, source control, or a public issue.
- Never add secrets to variables prefixed with `NEXT_PUBLIC_`.

## Privacy boundaries

The application requests geolocation only after user interaction. AI photo analysis is opt-in and begins only after an explicit submission. Production deployments should define retention periods for reports, images, identities, and location-derived records before adding persistent storage.
