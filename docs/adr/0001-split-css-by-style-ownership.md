# Split CSS by style ownership without cascade layers

The subject-page stylesheet is split behind a single `src/styles.css` manifest so agent and human readers can find style ownership by UI experience while `main.ts` still imports one stylesheet. We deliberately do not wrap the imported ATV styles in CSS cascade layers: the userscript runs inside Douban pages, and unlayered host author styles would outrank layered ATV normal declarations, risking visual regressions.

**Consequences**

- Source files are organized by style ownership boundaries, not by one CSS file per TSX component.
- Import order in `src/styles.css` preserves the original cascade order from the former giant stylesheet.
- CSS Modules, selector renames, and token renames are out of scope for this split.
