# Douban Plus

Douban Plus 是一个适配 ScriptCat 和 Tampermonkey 的用户脚本。它只作用于豆瓣电影和电视剧详情页，把原页面重排为 Apple TV 风格的暗色界面，同时保留豆瓣原始链接、登录流程和标记能力。

![Hero screenshot](tests/screenshots/movie-shawshank-hero.png)

## 主要能力

Douban Plus 读取当前豆瓣详情页的现有文档对象模型（DOM），提取页面数据，然后用 Preact 渲染新的详情页界面：

- **沉浸式首屏**：使用海报、背景图、评分、简介和标记操作组成首屏体验
- **外部评分**：展示 IMDb、Rotten Tomatoes 和 Metacritic 评分，并在数据缺失时降级为空态
- **流媒体来源**：展示可播放平台，使用平台标识和跳转链接帮助你继续观看
- **媒体浏览**：支持海报、剧照和预告片 modal 预览
- **短评和影评**：同步 card 与 modal 内的投票状态，未登录时先打开登录提示
- **兴趣标记**：支持想看、在看、看过、评分、短评和取消标记
- **作品切换器**：通过 Sticky Nav 搜索电影和剧集，展示最多五个候选，并在新标签页打开所选作品或豆瓣原生搜索
- **登录提示**：在需要账号状态的操作前，打开 ATV 风格 modal，并嵌入豆瓣官方登录 iframe
- **响应式布局**：适配桌面、平板和手机视口，并尊重 `prefers-reduced-motion`
- **视觉回归截图**：端到端测试会生成首屏、整页和移动端截图

## 安装

从源码安装时，先构建用户脚本，再把生成文件安装到脚本管理器：

```bash
pnpm install
pnpm run build
```

然后在 ScriptCat 或 Tampermonkey 中新建脚本，粘贴 [`dist/douban-plus.user.js`](dist/douban-plus.user.js) 的完整内容。保存后访问 `https://movie.douban.com/subject/*` 页面，脚本会自动运行。

当前构建产物约为 `288 KB`，未压缩，便于检查和调试。

## 开发

先安装依赖：

```bash
git clone https://github.com/ZlatanCN/douban-plus.git
cd douban-plus
pnpm install
```

常用命令：

```bash
pnpm run dev
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:e2e
```

这些命令分别启动 Vite 开发服务器、构建用户脚本、检查代码风格、检查 TypeScript 类型、运行单元和集成测试、运行 Playwright 端到端测试。

开发服务器通过 `vite-plugin-monkey` 注入脚本。豆瓣页面的 Content Security Policy（CSP）可能阻止开发模式内联脚本，开发时可使用本地浏览器配置处理 CSP 限制。

## 项目结构

核心代码按运行阶段和页面体验拆分：

```text
src/
  main.ts              # 用户脚本入口
  runtime/             # 挂载、账号拦截、兴趣标记、登录 iframe 主题等运行时流程
  extract/             # 从豆瓣 DOM 提取页面数据
  resolve/             # 外部评分解析调度
  api/                 # 网络请求、缓存和站点解析
  modules/
    subject-page/      # Preact 详情页模块
      hero/            # 首屏、海报、简介和操作
      ratings/         # 豆瓣和外部评分
      media/           # 流媒体、演员、剧照、推荐和系列
      comments/        # 短评列表、modal 和点赞状态
      reviews/         # 影评列表、modal 和有用/没用状态
      interest/        # 想看、在看、看过表单
      login/           # 登录提示 modal 和官方 iframe 宿主
  components/
    common/            # 图标、星级等通用 UI
    layout/            # 区块和导航
    modal/             # 统一 modal shell、focus trap 和关闭按钮
  styles.css           # 样式入口
  styles/              # 按体验拆分的 CSS 文件
tests/
  qa.ts                # 端到端测试入口
  qa/                  # Playwright 场景、断言和截图流程
  screenshots/         # 视觉回归截图
```

`src/build/` 是旧的 DOM builder 层，已经退出当前架构。新的界面代码应进入 `src/modules/subject-page/` 或共享 Preact primitives。

## 工作原理

页面加载后，脚本按以下顺序运行：

1. **匹配页面**：`vite-plugin-monkey` 只在豆瓣 subject 页面和豆瓣账号登录 iframe 页面运行脚本
2. **提取数据**：`src/runtime/extract-data.ts` 组合 `extract/` 模块，得到 `DoubanData`
3. **渲染界面**：`src/runtime/mount.tsx` 把 `SubjectPage` 渲染到新的根节点
4. **启动效果**：运行头像补全、系列数据观察、sticky nav 和账号拦截等效果
5. **加载外部评分**：Preact rating 模块通过 `resolveAll` 并行解析 IMDb、Rotten Tomatoes 和 Metacritic
6. **保留豆瓣能力**：登录、标记和投票仍走豆瓣官方页面或接口，不复制账号表单逻辑

账号相关操作会先通过 `src/runtime/account-gate.ts` 检查登录状态。未登录时，脚本打开 ATV 风格登录 modal，并只嵌入豆瓣官方账号 iframe。

## 测试

单元和集成测试使用 Vitest：

```bash
pnpm run test
```

端到端测试使用 Playwright Edge，并注入 `dist/douban-plus.user.js`：

```bash
pnpm run build
pnpm run test:e2e
```

端到端测试覆盖真实豆瓣页面场景，包含核心渲染、内容区块、交互、媒体 modal 和截图断言。截图文件保存在 `tests/screenshots/`，每个场景包含 `hero`、`full` 和 `mobile` 三类截图。

## 发布前检查

发布或开 pull request 前运行：

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

如果改动会影响真实页面交互，再运行：

```bash
pnpm run test:e2e
```

版本号遵循语义化版本。面向用户的新能力或架构性重构使用 minor 版本，兼容修复使用 patch 版本。

## 常见问题

### 图片无法显示怎么办？

豆瓣图片可能受防盗链策略影响。脚本会尽量使用高清图源和合适的 `referrerPolicy`，但浏览器、网络环境或豆瓣 CDN 策略仍可能影响加载结果。

### 未登录时为什么先出现登录 modal？

短评点赞、影评投票和兴趣标记都依赖豆瓣账号状态。脚本会先打开登录提示 modal，避免未登录时出现乐观更新后回滚的状态跳动。

### 支持豆瓣首页、排行榜或搜索页吗？

不支持。脚本只匹配豆瓣电影和电视剧详情页，也就是 `/subject/*` 路径。

## 开源协议

[MIT](LICENSE)
