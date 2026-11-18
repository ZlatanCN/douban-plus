# Live rating audit

Run `pnpm run qa:ratings-live` when reviewing a PR that changes external-rating acquisition. The command is opt-in and is not part of the default CI workflow. It loads each manifest sample's live Douban page with the real extractor, then renders `SubjectPageRuntime`; the runtime uses the normal Wikidata, IMDb, Metacritic and Rotten Tomatoes acquisition and parser code. The command injects a fetch-backed GM network adapter and captures typed per-source updates through `SubjectPageRuntime`'s outcome callback; it does not register user-visible diagnostic commands.

The report is written to `artifacts/live-rating-audit.md`. Set `DP_RATING_AUDIT_OUTPUT` to choose another path.

- `pass`: the runtime verified an external rating or confirmed that the current verified source page has no rating.
- `fail`: the runtime found a mapping, identity or parsing failure.
- `unverified`: Douban extraction, network access, a source restriction or incomplete runtime outcomes prevented a conclusion. These rows never count as passes or as proof that the source has no rating.

Captured scores and provider responses are historical regression evidence. The live report records the current outcome and does not compare today's scores with historical values.
