# Contributing to PlugSpot

Thanks for helping make reliable workspaces easier to find.

## Development workflow

1. Create a focused branch from `main`.
2. Install locked dependencies with `npm ci`.
3. Keep UI behavior accessible by keyboard and usable at mobile widths.
4. Add or update tests for behavior changes.
5. Run `npm run check` before opening a pull request.
6. Explain user impact, testing performed, and any privacy or security implications in the pull request.

## Engineering standards

- Keep TypeScript strict; do not use `any` to bypass an unclear type.
- Validate untrusted data at server boundaries and return sanitized errors.
- Never expose service credentials to client components or source control.
- Prefer small, testable modules and descriptive names over clever abstractions.
- Preserve anonymous access to public discovery features.
- Treat location, identity, and uploaded images as sensitive user data.
- Do not present AI-generated claims as verified facts; ground recommendations in supplied place data and surface uncertainty.

## Commit and pull request scope

Use imperative, specific commit subjects such as `Add photo evidence verification`. Keep unrelated refactors out of feature pull requests. A pull request should be small enough to review confidently and must pass CI.
