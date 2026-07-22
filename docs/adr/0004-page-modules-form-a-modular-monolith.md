# Make page modules the modular monolith boundary

douban-plus continues to ship as one userscript, but `subject` and `personage` are independent page modules rather than folders within a horizontal technical-layer architecture. Each module owns its page-specific UI, domain types, DOM extraction, external read/write adapters, runtime lifecycle, and styles; `main` may import only its public `index.ts` entry point, while modules may depend only on shared, page-agnostic primitives. This makes page ownership explicit without changing userscript behavior, and prevents the growing `subject` feature set from becoming a de facto global application layer.

## Consequences

- Migrate `subject` first and use its final public boundary as the template for `personage`.
- Shared code is limited to page-agnostic UI, styles, HTTP, cache, and DOM primitives; it cannot import page modules, and page modules cannot import one another or deep-import another module's implementation.
- `subject`'s existing global page types, extractors, API adapters, runtime code, and page styles move into the module. Any migration forwarding layer is temporary and removed before the `subject` migration completes.
- CI enforces import boundaries and public-entry contracts alongside the existing static checks, unit tests, and visual regression tests. This refactor deliberately excludes E2E execution and has no intentional user-visible behavior change.
- Production code may access a page module only through its `index.ts` API. White-box unit tests remain implementation-owned tests and may directly import internal seams; public-entry tests separately lock the published contract.
