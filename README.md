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
- **预告片支持**：预告片横向滚动画格，点击弹出 H5 视频播放器（自动加载豆瓣视频源）
- **流媒体来源**：展示可用播放平台，一键跳转
- **短评聚合**：用户头像、星级、评论内容、点赞数
- **评论覆盖层**：点击短评展开详情覆盖层，超出文本自动折叠+"展开"按钮
- **评论点赞**：覆盖层内一键"有用"投票
- **头像懒解析**：GM_xmlhttpRequest 爬取用户头像，localStorage 缓存 30 分钟，下次直接复用
- **奖项展示**：获奖信息卡片展示
- **概要折叠/展开**：过长剧情简介自动截断，点击"展开"阅读全文
- **想看/看过/在看标记**：完整标记弹窗，支持 5 星评分 + 短评输入
- **IMDb 链接**：详情区展示 IMDb 外部链接
- **固定导航栏**：滚动超过 300px 显示，快捷跳转各区块
- **原始功能保留**：所有豆瓣链接、标记按钮正常可用
- **响应式设计**：适配桌面、平板、手机三种布局
- **无障碍支持**：`prefers-reduced-motion` 禁用动画

## 安装方式

### ScriptCat / Tampermonkey

1. 安装 [ScriptCat](https://scriptcat.org/) 或 [Tampermonkey](https://www.tampermonkey.net/)
2. 新建脚本，将 [`dist/douban-plus.user.js`](dist/douban-plus.user.js) 内容粘贴进去
3. 访问任意豆瓣电影/电视剧详情页即可生效

> **构建产物**：克隆仓库后需先运行 `pnpm run build` 生成 `dist/douban-plus.user.js`（约 104KB）。

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

构建输出 `dist/douban-plus.user.js`（约 104KB 单文件油猴脚本）。

### 运行测试

```bash
pnpm test
```

基于 Playwright 的 E2E 测试，覆盖 10 个豆瓣页面（7 部电影 + 2 部电视剧 + 预告片专项），在 31 个断言模块中执行 60+ 条断言检查，并自动截图对比视觉回归。测试涵盖核心渲染、内容正确性、交互功能、UI 导航、边界页面五大阶段。

### 项目结构

```
douban-plus/
├── src/                       # TypeScript 源码
│   ├── main.ts                # 入口 — 渲染主流程
│   ├── styles.css             # 全局样式（Apple TV+ 暗色主题）
│   ├── types.ts               # TypeScript 类型定义
│   ├── constants.ts           # 常量配置
│   ├── api/                   # 数据接口层（头像解析、评论投票、兴趣标记）
│   ├── build/                 # UI 模块构建（hero、cast、photos 等）
│   ├── extract/               # 从豆瓣 DOM 提取数据
│   ├── components/            # 通用 UI 组件（modal、dom 工厂等）
│   └── utils/                 # 工具函数（GM_xmlhttpRequest 封装、DOM 辅助等）
├── dist/
│   └── douban-plus.user.js    # 构建产物（单文件油猴脚本）
├── tests/
│   ├── qa.ts                  # Playwright QA 测试入口
│   ├── qa/                    # 测试子模块
│   │   ├── asserts.ts         # 31 个断言函数
│   │   ├── constants.ts       # 测试常量与场景定义
│   │   ├── logger.ts          # 断言记录与汇总
│   │   ├── reporter.ts        # 报告生成
│   │   └── types.ts           # 测试类型定义
│   └── screenshots/           # 视觉回归截图（10 页面 × 3 视图 = 30 张）
├── vite.config.ts             # Vite + vite-plugin-monkey 配置
├── tsconfig.json
├── package.json
├── LICENSE
└── README.md
```

### 工作原理

1. 脚本在模块加载时注入自定义 CSS（Apple TV+ 配色 + 布局，通过 `vite-plugin-monkey` 包装为 `GM_addStyle`）
2. 从现有豆瓣 DOM 中提取数据（无需 API 调用）
3. 构建新 UI 结构（`#atv-douban-root`）并插入页面顶部
4. 隐藏原始豆瓣页面（`#wrapper` 设为 CSS 隐藏，DOM 保留）
5. 想看/看过按钮通过 proxy-click 转发到原始豆瓣按钮
6. 用户头像通过 `GM_xmlhttpRequest` 爬取用户主页解析，结果缓存在 localStorage（30 分钟 TTL），下次直接复用

### 测试场景

当前覆盖的 10 个测试页面：

| 场景                    | 类型   | 说明                            |
| ----------------------- | ------ | ------------------------------- |
| movie-shawshank         | 电影   | 肖申克的救赎（基础回归）        |
| movie-nezha             | 电影   | 哪吒之魔童降世                  |
| movie-wandering-earth-2 | 电影   | 流浪地球 2                      |
| tv-got-s1               | 电视剧 | 权力的游戏 第一季               |
| tv-blossoms-shanghai    | 电视剧 | 繁花（国产电视剧边界）          |
| movie-spirited-away     | 电影   | 千与千寻（日本动画电影边界）    |
| movie-rashomon          | 电影   | 罗生门（1950 年老片，无流媒体） |
| movie-all-about-ing     | 电影   | 关于伊丽（小众独立电影）        |
| movie-oppenheimer       | 电影   | 奥本海默（现代大片）            |
| movie-wandering-earth   | 电影   | 流浪地球（预告片专项）          |

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
