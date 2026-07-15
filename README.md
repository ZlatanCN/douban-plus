# Douban Plus

Douban Plus 是适配 ScriptCat 和 Tampermonkey 的豆瓣影视详情页用户脚本。它从当前页面读取公开资料，再以 Preact 重排为紧凑的暗色影视详情页；豆瓣原有链接、登录、标记与投票流程仍保留在其原生边界内。

![Hero screenshot](tests/screenshots/movie-shawshank-hero.png)

## 功能

- 沉浸式 Hero：海报、背景图、元数据、豆瓣与外部评分、简介及作品标记。
- 原生资料完整呈现：导演、编剧和主演会读取“更多...”后隐藏的完整署名；豆瓣榜单中的名次与榜单链接也会显示在 Hero。
- 外部评分：IMDb、Rotten Tomatoes 与 Metacritic 独立解析；缺失来源不会阻塞页面。
- 观看与媒体：观看平台、首播平台、剧集、演员、剧照、海报和预告片预览。
- 社区与账号操作：短评、影评、讨论、投票与作品标记；未登录时只承载豆瓣官方登录 iframe。
- 作品切换器：Sticky Nav 中可搜索并在新标签页打开影视条目或豆瓣原生搜索。
- 响应式与可访问性：适配桌面和移动视口，并尊重 `prefers-reduced-motion`。

## 安装

从源码构建：

```bash
pnpm install
pnpm build
```

将 [`dist/douban-plus.user.js`](dist/douban-plus.user.js) 的完整内容安装到 ScriptCat 或 Tampermonkey。随后访问 `https://movie.douban.com/subject/*`，脚本会自动运行。

构建产物未压缩，体积会随依赖和功能变化；以构建命令输出为准。

## 开发

```bash
git clone https://github.com/ZlatanCN/douban-plus.git
cd douban-plus
pnpm install
```

| 命令             | 用途                                         |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | 启动 Vite 开发服务器和 userscript 开发注入。 |
| `pnpm build`     | 生成 `dist/douban-plus.user.js`。            |
| `pnpm lint`      | 运行 Ultracite 与 Stylelint。                |
| `pnpm typecheck` | 检查源码和测试的 TypeScript 类型。           |
| `pnpm test`      | 运行 Vitest 单元与集成测试。                 |
| `pnpm test:e2e`  | 使用 Playwright Edge 在真实豆瓣页面执行 QA。 |

开发模式由 `vite-plugin-monkey` 注入脚本。若豆瓣页面 CSP 阻止开发注入，需要在本地浏览器环境中处理该限制。

## 架构

```text
src/
  main.ts              # userscript 入口；区分 subject 页和登录 iframe
  runtime/             # 挂载、数据组装与浏览器生命周期
  extract/             # 只读解析豆瓣 DOM
  resolve/             # 外部评分的并行解析调度
  api/                 # 网络请求、缓存和站点解析
  modules/subject-page/ # 页面体验模块
    hero/              # Hero、海报、元数据、简介和操作
    ratings/           # 豆瓣与外部评分
    media/             # 平台、演员、剧照、推荐和剧集
    comments/ reviews/ # 社区内容、modal 与投票状态
    interest/ login/   # 作品标记与豆瓣官方登录 iframe
    search/             # 作品切换器
  components/          # 通用 UI、布局与 canonical modal shell
  styles/              # 按体验所有权拆分，通过 styles.css 统一导入
tests/
  qa.ts                # QA / E2E 入口
  qa/                  # Playwright 场景、断言和截图流程
  screenshots/         # Hero、整页和移动端视觉回归截图
```

页面流程为：`extractDoubanData()` 读取当前文档 → `mountSubjectPage()` 创建 Preact 根节点 → `SubjectPageRuntime` 管理异步评分、首播平台、导航和媒体生命周期 → `SubjectPage` 渲染页面体验。外部评分在 `resolveAll()` 中并行获取，单个来源失败不会影响其余来源或首屏。

`src/build/` 是已退役的 DOM-builder 层。新增界面应进入 `src/modules/subject-page/` 或共享 Preact 组件，不要重建 imperative DOM UI。

## 验证

常规改动：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

会影响真实豆瓣页面交互、截图或浏览器生命周期时，再执行：

```bash
pnpm build
pnpm test:e2e
```

E2E 会注入刚构建的 userscript，并在每个场景生成 `hero`、`full` 与 `mobile` 三张截图。

## 常见问题

### 图片无法显示怎么办？

豆瓣图片可能受防盗链、CDN 或网络环境影响。脚本会尽量选用可用图源和合适的 `referrerPolicy`，但无法绕过浏览器或站点策略。

### 为什么未登录时会先出现登录 modal？

短评投票、影评投票和作品标记都依赖豆瓣账号状态。脚本只展示自己的 modal 外壳，并嵌入豆瓣官方登录 iframe；不会复制账号表单或读取凭据。

### 支持首页、榜单或搜索页吗？

不支持。脚本只匹配豆瓣电影和电视剧的 `/subject/*` 详情页，以及必要的豆瓣登录 iframe 页面。

## 开源协议

[MIT](LICENSE)
