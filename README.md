# Douban Plus

> 将豆瓣电影/电视剧详情页重构成 Apple TV+ 风格的沉浸式暗色界面，保留豆瓣品牌色 #41be5d 作为交互强调色。

![Hero Screenshot](tests/screenshots/movie-shawshank-hero.png)

## 功能特性

- **沉浸式 Hero 横幅**：以模糊背景剧照配合渐变叠加营造沉浸感，海报卡片支持点击全屏浏览
- **Apple TV+ 暗色美学**：采用纯黑背景（#000）、精炼排版与统一圆角体系
- **豆瓣绿强调色**：保留经典色值 #41be5d 作为交互高亮元素的主色调
- **评分展示**：半星精度支持，评价人数按本地化格式呈现
- **海报与剧照高清升级**：自动将缩略图替换为高清源
- **演员卡片轮播**：圆形头像配以姓名与角色信息，横向滚动画廊
- **剧照墙**：横向滚动图片列表，点击触发全屏预览
- **预告片集成**：预告片横向滚动画格，点击弹出 H5 视频播放器（自动加载豆瓣视频源）
- **流媒体来源**：展示可用的播放平台，支持一键跳转
- **短评聚合**：聚合展示用户头像、星级评分、评论内容及点赞数
- **评论详情浮层**：点击短评展开详情浮层，超出文本自动折叠并配有"展开"按钮
- **评论点赞**：浮层内提供"有用"投票功能
- **头像延迟加载**：通过 `GM_xmlhttpRequest` 抓取用户头像，结果缓存在 `localStorage`（TTL 30 分钟）
- **奖项展示**：以卡片形式展示影片获奖信息
- **剧情简介折叠**：过长剧情简介自动截断，点击"展开"阅读全文
- **兴趣标记弹窗**：完整标记弹窗，支持五星评分及短评输入
- **IMDb 链接**：详情区提供 IMDb 外部跳转链接
- **固定导航栏**：页面滚动超过 300px 后固定显示，支持快捷跳转各内容区块
- **原始功能保留**：所有豆瓣原生链接与标记按钮保持正常可用
- **响应式布局**：适配桌面端、平板与手机三种视口
- **无障碍支持**：尊重 `prefers-reduced-motion` 系统偏好，禁用动画

## 安装方式

### ScriptCat / Tampermonkey

1. 安装 [ScriptCat](https://scriptcat.org/) 或 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 新建用户脚本，将 [`dist/douban-plus.user.js`](dist/douban-plus.user.js) 的完整内容粘贴至脚本编辑器
3. 保存后访问任一豆瓣电影或电视剧详情页（`/subject/*`），脚本将自动生效

> **注意**：若从仓库源码安装，需先执行 `pnpm run build` 生成 `dist/douban-plus.user.js`（约 104KB）。

## 开发指南

### 本地环境搭建

```bash
git clone https://github.com/ZlatanCN/douban-plus.git
cd douban-plus
pnpm install
```

### 项目结构

```
douban-plus/
├── src/                       # TypeScript 源码
│   ├── main.ts                # 入口文件 — 渲染主流程
│   ├── styles.css             # 全局样式（Apple TV+ 暗色主题）
│   ├── types.ts               # 类型定义
│   ├── constants.ts           # 常量配置
│   ├── api/                   # 数据接口层（头像解析、评论投票、兴趣标记）
│   ├── build/                 # UI 模块构建（hero、cast、photos 等）
│   ├── extract/               # 豆瓣 DOM 数据提取
│   ├── components/            # 通用 UI 组件（modal、dom 工厂等）
│   └── utils/                 # 工具函数（GM_xmlhttpRequest 封装、DOM 辅助等）
├── dist/
│   └── douban-plus.user.js    # 构建产物（单文件用户脚本）
├── tests/
│   ├── qa.ts                  # Playwright QA 测试入口
│   ├── qa/                    # 测试子模块
│   │   ├── asserts.ts         # 断言函数（31 条）
│   │   ├── constants.ts       # 测试常量与场景定义
│   │   ├── logger.ts          # 断言记录与汇总
│   │   ├── reporter.ts        # 报告生成
│   │   └── types.ts           # 测试类型定义
│   └── screenshots/           # 视觉回归截图
├── vite.config.ts             # Vite + vite-plugin-monkey 构建配置
├── tsconfig.json
├── package.json
├── LICENSE
└── README.md
```

### 工作原理

1. **样式注入**：脚本在模块初始化时通过 `GM_addStyle` 注入自定义 CSS（Apple TV+ 配色方案与布局）
2. **数据提取**：从现有豆瓣 DOM 中直接提取影片数据，无需外部 API 调用
3. **UI 构建**：构建新的 UI 结构（`#atv-douban-root`）并将其插入页面顶部
4. **原生页面隐藏**：原生豆瓣页面（`#wrapper`）通过 CSS 隐藏，DOM 结构完整保留
5. **交互代理**：想看/看过等操作按钮通过 proxy-click 机制转发至原生豆瓣按钮
6. **头像获取**：通过 `GM_xmlhttpRequest` 抓取用户主页解析头像，结果缓存在 `localStorage`（TTL 30 分钟）

### 开发服务器（HMR 热更新）

```bash
pnpm run dev
```

启动 Vite 开发服务器后，通过 `vite-plugin-monkey` 自动将用户脚本注入浏览器。修改 `src/` 目录下任意源码即可触发热更新。

> **注意**：开发服务器通过内联脚本注入，可能触发豆瓣的内容安全策略（CSP）。建议安装 **"Disable-CSP"** 浏览器扩展以绕过此限制。

### 生产构建

```bash
pnpm run build
```

构建产物输出为 `dist/douban-plus.user.js`（约 104KB 的单文件用户脚本）。

### 运行测试

```bash
pnpm test
```

基于 Playwright 的端到端（E2E）测试套件，覆盖 10 个豆瓣页面（7 部电影、2 部电视剧及 1 个预告片专项场景），包含 31 条断言函数和 60 余项检查点，并自动生成视觉回归截图。测试覆盖五大阶段：核心渲染、内容正确性、交互功能、UI 导航及边界页面。

### 测试场景

| 场景                    | 类型   | 说明                                |
| ----------------------- | ------ | ----------------------------------- |
| movie-shawshank         | 电影   | 肖申克的救赎（基础回归场景）        |
| movie-nezha             | 电影   | 哪吒之魔童降世                      |
| movie-wandering-earth-2 | 电影   | 流浪地球 2                          |
| tv-got-s1               | 电视剧 | 权力的游戏 第一季                   |
| tv-blossoms-shanghai    | 电视剧 | 繁花（国产电视剧边界测试）          |
| movie-spirited-away     | 电影   | 千与千寻（日本动画电影边界测试）    |
| movie-rashomon          | 电影   | 罗生门（1950 年老片，无流媒体数据） |
| movie-all-about-ing     | 电影   | 关于伊丽（小众独立电影边界测试）    |
| movie-oppenheimer       | 电影   | 奥本海默（现代大片场景）            |
| movie-wandering-earth   | 电影   | 流浪地球（预告片专项场景）          |

## 常见问题

**问：图片无法显示，应如何处理？**

豆瓣 CDN 实施了防盗链策略。脚本已设置 `referrerPolicy="no-referrer"` 以绕过此限制。请确保使用最新版本的 Chrome、Edge 或 Firefox 浏览器。

**问：想看/看过等标记按钮是否可用？**

可用。这些按钮通过事件转发机制代理至原生豆瓣按钮。若用户尚未登录，豆瓣将正常跳转至登录页面。

**问：是否会支持豆瓣首页或排行榜等页面？**

不会。本脚本仅作用于豆瓣电影/电视剧详情页（路径匹配 `/subject/*`），暂无扩展至其他页面的计划。

**问：如何参与项目贡献？**

源码位于 `src/` 目录，使用 TypeScript 编写。可通过 `pnpm run dev` 启动开发服务器进行 HMR 开发，`pnpm run build` 构建产物，`pnpm test` 运行测试套件。欢迎提交 Issue 与 Pull Request。

## 开源协议

[MIT](LICENSE)
