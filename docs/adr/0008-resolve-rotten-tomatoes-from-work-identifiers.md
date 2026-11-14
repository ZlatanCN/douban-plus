---
status: accepted
---

# 以作品标识解析烂番茄评分，保持客户端获取

2026-11-14 确认设计，尚未实现。douban-plus 是公开分发、免费且安装即用的用户脚本；烂番茄获取保留在用户浏览器中，不增加自建后端或要求用户申请 API key。使用 IMDb ID 优先定位作品，经 Wikidata 的有效标识映射找到 RT 页面，以豆瓣 ID 辅助核验和补查；明确区分电影、整剧与单季，接受缺失覆盖以避免误配。评分本体仍来自 RT 页面，Wikidata 提供作品映射。

## 决策依据

- 当前 `fetchRtRating` 使用英文片名生成 slug，按猜测 URL 请求；未核对返回对象，并可能用整剧结果填入单季缓存。
- 当前运行时和评分面板以 IMDb ID 控制全部外部评分；实际上 RT 的豆瓣 ID 映射不要求 IMDb ID。
- 当前 RT 解析器要求两侧均有 `score`。本次读取的电影和单季真实页面只有 `scorePercent`，因此即使 URL 正确，现有解析器也会返回空；现有手写 mock 没有捕获这一变化。
- `Promise.allSettled` 隔离失败，但运行时等待全部来源完成才更新面板。请求封装没有超时，不能把并行请求等同于独立上屏。

这些是源码事实或本次样本观察，不是已测得的总体误配率、覆盖率或时延。

## 获取链路

1. 从已提取的豆瓣作品数据构建身份：豆瓣 subject ID、可用 IMDb ID、标题、年份与明确的季信息。解析层不再独立读取 H1；季号不明确或来源互相矛盾时，不把整剧当作当前季。
2. 优先按 IMDb ID 查询 Wikidata，取候选条目的有效 RT ID（P1258）。通过公开 Action API 的属性值搜索查找条目，再读取 claims；不使用只搜名称的 `wbsearchentities`，也不依赖 SPARQL 服务。豆瓣 ID（P4529）用于核验和补查；无 IMDb ID 时仍可独立查询。
3. 检查标识 claim、rank、相关限定符、候选数量及对象粒度。弃用值、身份冲突与无法消歧的多候选不进入评分缓存；不能取第一条搜索结果或任意一个 P1258。整剧条目与其单季条目可以是不同 QID，不能仅凭 QID 不同就认定冲突。
4. 单季优先使用已确认的季级 RT 映射；只有整剧映射时，必须在确认所属剧集后找到并核验 RT 提供的对应季链接，再读取季页面。不得以整剧分数补缺，也不能仅因拼出的 `/sNN` 能返回页面就认定季匹配。
5. 获取 RT 页面，检查请求结果、规范地址及页面中的电影／整剧／季身份与已确认映射一致，再读取当前 `mediaScorecard` 结构化数据。映射缺失、页面不匹配、无评分和上游失败是不同诊断结果；产品界面保持简洁，不暴露内部协议。

不再保留 RT 的片名 slug 猜测、无年份 URL 消歧替代、搜索首条自动接受或季级失败后整剧补位等路径。开源抓取仓库仅作为参考；不引入其服务端架构，也不把旧解析代码作为兼容路径。

## 评分与本地快照

- 影评人和观众百分比分别可缺失；有一侧即可展示。严格区分缺失、空字符串与真实 0%，只接受有效的 0–100 百分比。百分比不是平均星级。
- 观众评分跟随 RT 页面默认的已验证／全部观众口径，并在来源详情保留该口径。不能用默认分数配上另一群体的人数，也不能使用 RT 要求隐藏的评分。
- 评分人数缺失不挡住已有分数；`250,000+` 等区间人数保留区间含义，不伪造精确数字或记为 0。
- 快照保存评分对象、实际 RT 来源地址、观众口径和获取日期；获取日期不能称为 RT 更新日期。身份键包含豆瓣条目、电影／整剧／季粒度以及已确认 RT 目标，避免电影与 TV、不同季或不同 RT 目标互读评分。
- 成功获取后 7 天内使用正常快照；7–30 天先展示带获取日期的旧值，并尝试刷新；超过 30 天隐藏评分并重新获取。只有已确认对象的旧值能在刷新失败时继续展示。新快照中某侧缺失时不暗中拼接成同时获取的双侧评分。
- 新链路不读取或迁移旧 `dp:rotten-cache` 中按片名猜测得到的评分。已确认身份发生冲突时，同样不能继续展示原快照。
- RT 请求与展示状态独立完成；新增网络操作有超时和结束状态，RT 的映射或请求不能让已完成的其他评分持续等待。取消页面生命周期后不再提交旧结果。

## 落地顺序

1. 先用固定作品样本验证 IMDb／豆瓣映射、弃用值和电影／单季边界，记录未命中与冲突；覆盖缺 IMDb、多季和重拍同名作品，不能只验证热门电影。
2. 在 subject 模块内完成最小端到端链路：身份输入、有效 RT 映射、当前评分解析、独立上屏及来源链接。沿用现有 GM 网络能力并添加必要的 Wikidata 域名权限；不建立通用 provider 插件体系。
3. 在可用链路上加入带身份和日期的本地快照及 7／30 天策略，同时移除 RT 旧获取路径和旧契约测试。评分解析使用裁剪后的真实结构样本，验证单侧、0%、区间人数、季号冲突及慢请求隔离。
4. 在 ScriptCat／Tampermonkey 中验证实际跨域权限、重定向、请求超时和页面卸载，再运行与改动相关的项目检查。本次设计核查未运行这些产品验证。

## 已核实的公开样本与限制

2026-11-14 直接读取公开接口或原始 HTML：

- 按豆瓣 `1292052` 查询 Action API 命中 `Q172241`；该条目 claims 同时包含 IMDb `tt0111161` 和有效 RT `m/shawshank_redemption`。电影 RT 页面 `mediaScorecard` 使用 `scorePercent`，观众人数为 `bandedRatingCount`，没有现有解析器要求的 `score`。见 [肖申克 Wikidata 条目](https://www.wikidata.org/wiki/Q172241) 与 [RT 页面](https://www.rottentomatoes.com/m/shawshank_redemption)。
- 按 IMDb `tt0108778` 查询命中整剧 `Q79784`，不是第一季条目；[第一季 Q975761](https://www.wikidata.org/wiki/Q975761) 有豆瓣 `1393859`、没有 IMDb ID，且唯一 RT ID `tv/2062/s01` 已标为 deprecated。不能把映射存在等同于映射有效。见 [整剧条目](https://www.wikidata.org/wiki/Q79784)。
- [权力的游戏第一季 RT 页面](https://www.rottentomatoes.com/tv/game_of_thrones/s01) 的 JSON-LD 类型为 `TVSeason`，带所属剧集；评分同样使用 `scorePercent`，观众人数为区间。这一读取验证了单季页面字段，未验证该季的自动映射链路。

以上仅为可行性和反例核查。尚无总体映射覆盖率、误配率、延迟数据或脚本环境端到端测试；IMDb ID 查询与豆瓣 ID 查询都依赖 Wikidata 中的对应关系，不能声称前者天然更准确。客户端直读也仍依赖 RT 的可达性和页面结构，这个方案不承诺上游稳定性或完整覆盖。

接口依据：[IMDb ID P345](https://www.wikidata.org/wiki/Property:P345)、[豆瓣 ID P4529](https://www.wikidata.org/wiki/Property:P4529)、[RT ID P1258](https://www.wikidata.org/wiki/Property:P1258)、[属性值搜索](https://www.mediawiki.org/wiki/Help:Extension:WikibaseCirrusSearch#haswbstatement)、[Action API 跨站请求](https://www.mediawiki.org/wiki/API:Cross-site_requests#Unauthenticated_CORS_Requests)、[RT 评分口径](https://www.rottentomatoes.com/about)。
