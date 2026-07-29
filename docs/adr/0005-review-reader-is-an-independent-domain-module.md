# Make review reading an independent domain module (moved to src/domains/)

`subject` 的影评分区和 `subject-reviews` 总览页需要同一套影评目录卡片、完整阅读和可从“有用”改投“没用”（或反向）的状态语义。我们将这些能力收敛在独立的 `review-reader` 深模块，并只从其公开入口使用；不将它们放入 `shared`，因为它们是明确的影评领域语义，放入 shared 会违背 ADR-0004 的页面无关边界。

初始实现在 `src/modules/review-reader/`，但在 2026-07-29 迁移到 `src/domains/review-reader/`，以确保 `modules/` 仅包含页面模块（每个对应一个 `PageMount`），而 `domains/` 容纳跨页面复用的领域特性。

## Consequences

- `review-reader` 拥有其跨路由呈现契约、双向投票状态与完整阅读体验；页面模块提供页面数据、账户守卫与原生互动适配。
- `subject` 与 `subject-reviews` 各自继续拥有路由、DOM 提取、无刷新导航、目录构图及页面专属样式，并且不能深层导入彼此实现。
- `domains/review-reader` 中的 `@deprecated` 兼容转发在迁移到 `src/domains/` 时随 `src/modules/review-reader/` 一并删除。
- 未来若另一条作品路由需要同一影评阅读语义，必须使用 `review-reader` 的公开入口，而不是复制 card、Modal 或投票状态。
