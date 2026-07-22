# Inline 影视作品候选：可行性研究

**结论：建议第一阶段加入候选列表，但把它当作可失败的增强功能。** 豆瓣电影存在一条可在当前页面同源调用的 JSON 建议接口，返回的数据已足以消除常见同名歧义（海报、年份、原文名、剧集数、直达作品 URL）。接口没有公开稳定性或限流承诺，并且本次浏览中普通作品页曾被导向安全校验页；实现必须少请求、可取消、静默降级为“在新标签页打开原生影视搜索”。

## 已验证的一方路径

`GET https://movie.douban.com/j/subject_suggest?q=<URL-encoded query>`

这是 `movie.douban.com` 下的同源 JSON 响应。2026-07-14 的无登录浏览器验证：

| 查询 | HTTP 结果 | 观察到的候选 |
| --- | --- | --- |
| [`哈利·波特`](https://movie.douban.com/j/subject_suggest?q=%E5%93%88%E5%88%A9%20%E6%B3%A2%E7%89%B9) | 200 JSON | 2 部电影；例如《哈利·波特与魔法石》（2001） |
| [`权力的游戏`](https://movie.douban.com/j/subject_suggest?q=%E6%9D%83%E5%8A%9B%E7%9A%84%E6%B8%B8%E6%88%8F) | 200 JSON | 5 个季条目，均带集数 |
| [`权`](https://movie.douban.com/j/subject_suggest?q=%E6%9D%83) | 200 JSON | 至少 1 个候选，说明服务端不强制两字起搜 |
| [`a`](https://movie.douban.com/j/subject_suggest?q=a) | 200 JSON | 空数组 |

同次验证也从电影作品页面的脚本执行上下文成功调用了相对路径 `/j/subject_suggest?q=%E9%98%BF%E7%94%98`，返回 `200` 与《阿甘正传》。所以这里没有跨域读取问题：候选请求运行在 `movie.douban.com`，与脚本的作品页相同源。

提交/降级路径仍可使用 [豆瓣电影搜索页](https://search.douban.com/movie/subject_search?search_text=%E5%93%88%E5%88%A9%20%E6%B3%A2%E7%89%B9)。该页面的搜索框和电影/剧集导航会渲染，但在无登录自动化会话中持续显示“正在搜索…”，未稳定产出页面内结果；这不影响将它作为新标签页的原生搜索降级目标。

## 响应数据与显示映射

一次候选的实测结构如下（字段名来自上述一方 JSON 响应）：

```json
{
  "id": "3016187",
  "title": "权力的游戏 第一季",
  "sub_title": "Game of Thrones",
  "year": "2011",
  "episode": "10",
  "img": "https://img1.doubanio.com/view/photo/s_ratio_poster/public/...webp",
  "url": "https://movie.douban.com/subject/3016187/?suggest=...",
  "type": "movie"
}
```

建议行只需三层信息：`img` 海报、`title` 加 `year` 的主标签、`sub_title`（为空则省略）的次标签；`episode` 非空时加“共 N 集”。点击应使用服务端给出的 `url` 并以 `target="_blank"` 打开，符合已确认的新标签页导航选择。实现前要检查 URL 为 `https:` 且主机恰为 `movie.douban.com`、路径匹配 `/subject/<digits>/`；不要把不受信任的响应 URL 原样赋给链接。

`type` **不能**用来区分电影和剧集：上述《权力的游戏》剧集候选也返回 `"movie"`。接口位于 `movie.douban.com`，实测候选均为该站的影视 subject；应把“影视范围”交给这个端点，而不是再按 `type` 排除剧集。

## 与现有脚本的契合度

当前 userscript 仅匹配 `*://movie.douban.com/subject/*`，并声明了 `GM_xmlhttpRequest` 和 `@connect movie.douban.com`；因此建议接口已在网络授权范围内。[`vite.config.ts`](../../vite.config.ts) 还显示脚本运行于 `document-start`，但搜索组件本身应在现有应用挂载后才发起请求。

项目已有 [`gmGet`](../../src/shared/utils/request.ts) 作为 GM 请求包装，但本功能应优先用原生 `fetch`：调用同源、无需额外 GM 授权、并能用 `AbortController` 在输入变化时立即取消旧请求。只有在同源 fetch 被实际回归阻断时，才考虑复用 `gmGet`。

## 风险与防护

1. **非公开接口。** `/j/` 路径不是有版本化契约的公开 API；字段、排序、条数或可用性都可能变动。运行时把 JSON 视为未知输入：验证数组和每个必须字段；无效响应显示空状态，不抛出页面级错误。
2. **反爬/验证风险。** 本次快速探查中，打开 `https://movie.douban.com/subject/1292052/` 被重定向到 `sec.douban.com/c?...`，尽管该会话的建议接口仍返回 200。不要把每个键入事件直接变成网络请求，也不要自动重试 4xx、验证页或解析错误。
3. **没有公开限流信息。** 采用 250–300 ms 防抖；同一规范化查询只发一次；空白不请求。产品决定接受任意非空查询（包括单字片名或简称），所以用请求取消与短期查询复用控制频率，而不以字数拦截。限制展示前 5 条，避免向未声明稳定性的端点索取更多。
4. **竞态与失焦。** 用递增请求序号或 `AbortController`，只接受仍匹配当前输入的最新成功响应。失败、超时或空响应时保留“在新标签页搜索电影、剧集”的提交行为；不要把网络错误暴露为破坏导航栏的错误界面。
5. **隐私与内容加载。** 用户已在豆瓣页面输入作品名，因此请求留在豆瓣同源；候选海报来自 `*.doubanio.com`。图片应 `loading="lazy"`，并以纯色占位/文本行保证图片失败时仍可选择候选。

## 交付建议

将候选列表纳入第一阶段，范围保持克制：可展开的 Sticky Nav 输入框、300 ms 防抖、任意非空查询、最多 5 条、键盘上下/Enter/Escape，以及原生搜索的新标签页兜底。把接口适配层隔离为一个小模块，配合固定 JSON fixtures 的单元测试；这样接口变化时只影响适配层，而不会牵动导航交互。

### 证据范围

外部证据均为 2026-07-14 对以上链接的无登录浏览器读取；没有找到豆瓣公开的此端点契约或限流文档，因此关于稳定性和节流是基于该缺口及观察到的安全校验作出的保守工程判断，而不是豆瓣的官方承诺。
