# Static CSS audit with explicit boundaries

CSS dead-code auditing uses PostCSS plus JavaScript/TypeScript/JSX AST evidence. It reports unused owned rules, selector branches, custom properties, keyframes, and unresolved project variables; host selectors and dynamic class, selector, attribute, style, and CSS-text expressions remain unverified. The audit is deterministic and deliberately does not add browser CSS Coverage or change the repository's existing coverage and QA infrastructure.

## Consequences

- `pnpm check:css` is a static, reproducible check and `pnpm lint` enforces it.
- Findings are candidates for review; the tool never deletes CSS automatically.
- Dynamic and host boundaries are visible in the report without being mislabeled as dead CSS.
- Runtime CSS Coverage remains out of scope, so unverified boundaries require explicit review when their source changes.
