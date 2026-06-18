# Douban Plus

> 将豆瓣电影/电视剧详情页重塑为 Apple TV+ 沉浸式暗色风格，保留豆瓣绿作为强调色。

![Hero Screenshot](tests/screenshots/movie-shawshank-hero.png)

## 功能特性

- **沉浸式 Hero 横幅**：模糊背景剧照 + 渐变叠加，海报卡片点击全屏查看
- **Apple TV+ 暗色美学**：纯黑背景 #000、精致排版、四级圆角体系
- **豆瓣绿强调色**：保留经典 #41be5d 作为交互高亮色
- **电视剧完整支持**：季数、集数、单集片长、首播日期等字段
- **评分展示**：半星支持，评价人数本地化格式
- **海报/剧照 HD 升级**：自动将缩略图替换为高清大图
- **演员横滑卡片**：圆形头像 + 姓名 + 角色，横向滚动轮播
- **剧照墙**：横向滚动图片，点击弹出全屏大图预览
- **流媒体来源**：展示可用播放平台，一键跳转
- **短评聚合**：用户头像、星级、评论内容、点赞数
- **相似作品推荐**：海报 + 标题网格，点击跳转详情页
- **想看/看过/在看标记**：完整标记弹窗，支持 5 星评分 + 短评输入
- **固定导航栏**：滚动超过 300px 显示，快捷跳转各区块
- **原始功能保留**：所有豆瓣链接、标记按钮正常可用
- **响应式设计**：适配桌面、平板、手机三种布局
- **无障碍支持**：`prefers-reduced-motion` 禁用动画

## 安装方式

### ScriptCat / Tampermonkey

1. 安装 [ScriptCat](https://scriptcat.org/) 或 [Tampermonkey](https://www.tampermonkey.net/)
2. 新建脚本，将 [`dist/douban-plus.user.js`](dist/douban-plus.user.js) 内容粘贴进去
3. 访问任意豆瓣电影/电视剧详情页即可生效

> **贡献者注意**：克隆仓库后需先运行 `pnpm run build` 生成 `dist/douban-plus.user.js`。

## 开发指南

### 本地安装

```bash
git clone https://github.com/zhujiayou/douban-plus.git
cd douban-plus
pnpm install
```

### 开发服务器（HMR 热更新）

```bash
pnpm run dev
```

启动 Vite 开发服务器，通过 `vite-plugin-monkey` 自动注入油猴脚本到浏览器。修改 `src/` 下任何文件即可热更新。

> **⚠️ CSP 注意**：开发服务器通过内联脚本注入，会触发豆瓣的内容安全策略。开发时请安装 **"Disable-CSP"** 浏览器扩展。

### 生产构建

```bash
pnpm run build
```

构建输出 `dist/douban-plus.user.js`（约 60KB 单文件油猴脚本）。

### 运行测试

```bash
pnpm test
```

基于 Playwright 的 E2E 测试，覆盖 4 个豆瓣页面（3 部电影 + 1 部电视剧），共 114 条断言，包含视觉、功能、布局三类检查。

### 项目结构

```
douban-plus/
├── src/                       # TypeScript 源码
│   ├── index.ts               # 入口 — 启动引导 + 元数据
│   ├── build/                 # UI 模块构建（hero、cast、photos 等）
│   ├── extract/               # 从豆瓣 DOM 提取数据
│   ├── components/            # 通用 UI 组件（modal、dom 工厂等）
│   ├── services/              # 服务层（标记状态、流媒体来源）
│   ├── utils/                 # 工具函数
│   └── types.ts               # TypeScript 类型定义
├── dist/
│   └── douban-plus.user.js    # 构建产物（单文件油猴脚本）
├── tests/
│   ├── qa.ts                  # Playwright QA 测试（114 条断言）
│   └── screenshots/           # 视觉回归截图
├── vite.config.ts             # Vite + vite-plugin-monkey 配置
├── tsconfig.json
├── package.json
├── LICENSE
└── README.md
```

### 工作原理

1. 脚本在模块加载时注入自定义 CSS（Apple TV+ 配色 + 布局）
2. 从现有豆瓣 DOM 中提取数据（无需 API 调用）
3. 构建新 UI 结构（`#atv-douban-root`）并插入页面顶部
4. 隐藏原始豆瓣页面（`#wrapper` 设为 CSS 隐藏，DOM 保留）
5. 想看/看过按钮通过 proxy-click 转发到原始豆瓣按钮

> **说明**：CSS 在模块加载时注入（在内容检查之前），这是有意为之 — 所有 UI 在 `#atv-douban-root` 作用域下，即使检查被拒也不会影响页面。

## 常见问题

**Q: 图片为什么不显示？**
A: 豆瓣 CDN 有防盗链机制。脚本已设置 `referrerPolicy="no-referrer"` 绕过。请使用最新版 Chrome / Edge / Firefox。

**Q: 想看/看过按钮能用吗？**
A: 能用。它们会转发点击到原始豆瓣按钮。如果未登录，豆瓣会跳转到登录页（这是正常行为）。

**Q: 会支持豆瓣首页或排行榜吗？**
A: 不会。本脚本仅作用于详情页（`/subject/*`）。

**Q: 如何贡献代码？**
A: 源码在 `src/` 目录（TypeScript）。运行 `pnpm run dev` 启动 HMR 开发，`pnpm run build` 构建产物，`pnpm test` 运行测试。

## 开源协议

[MIT](LICENSE)
