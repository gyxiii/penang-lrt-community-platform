# Member 2 本次接入说明

## Google 地图已内嵌

已使用本地配置完成真实 Google Maps API 和真实底图验证。配置有效时默认显示 Google Maps；切换 Google、Schematic 和 Street map 时复用四条公告、三个地点、筛选和选中状态。底图为 Google 的真实地图，施工地点和公告仍是虚构示例。

本次完成 12 项真实 Google 检查（含初始三标记完整可见、点击、筛选、公告链接、重置、手机选中地点和底图切换），另通过 18 项模拟 API 接入检查。原有 45 项功能及 15 项布局检查也已通过。结果分别见 `google-map-live-verification.json`、`google-map-verification.json`、`verification.json` 和 `viewport-verification.json`。

配置说明见 `GOOGLE_MAPS_ZH.md`。本地 Key 文件已被 Git 忽略；分享包附带空白配置，其他组员需填写自己的受限 Key。本轮网页更改提交到独立分支供小组审查，合并后生效于 main。

## 2026年10月23日地图显示修复

已限制示意图的拖动范围，并按实际窗口重新计算最小缩放和初始取景，避免把底图拖离画面或缩成小块。右上角的 Show all locations 会收起详情并显示全部匹配地点，保留当前筛选条件。

重新通过原有 45 项浏览器检查，新增 15 项检查覆盖桌面和手机窗口切换、125% 像素比例、大幅拖动、缩小限制、恢复取景及选中标记不被详情遮挡。新增检查脚本为 `tests/map-layout-browser.cjs`，结果为 `viewport-verification.json`。

这次基于组员真实仓库 `gyxiii/penang-lrt-community-platform` 的 `main` 继续开发，起始提交为 `901638bc0b3bb55746ba257b6531fae8358dea59`。品牌统一使用前端现有的 **MutiaraConnect**。

## 已完成

- 将地图接入现有公共导航，沿用 `css/style.css` 的字体、颜色、按钮和页脚。
- 新增 `map.html`、`css/map.css`、`js/map.js`、`js/map-data.js` 及本地地图素材。
- 直接复用 `js/app.js` 中原有 4 条公告，展示 3 个示例点位，不复制第二套日期或影响说明。
- 实现地点、公告编号和关键词搜索，以及区域和公告类型的组合筛选。
- 点击卡片或地图标记可以查看对应影响说明和出入信息。
- 地图的 Read full announcement 打开组员的真实公告详情页；公告详情页的 View impact map 带公告编号返回选中的地图位置。
- 保留本地示意底图，并提供在线 OpenStreetMap 街道图；首次断网和加载成功后再断网均会恢复示意图。
- 更新系统 Use Case Diagram、Class Diagram、英文报告及约 3 分钟演示稿。

首页 `index.html`、公告列表 `announcements.html` 和公共样式 `css/style.css` 保持原样。原有 `app.js` 只增加共享数据接口和地图详情链接；公告正文、筛选逻辑和日期未改。

## 数据对应关系

| 示例点位 | 区域 | 使用的原公告 |
| --- | --- | --- |
| CS-GT-01 | George Town | MC-DEMO-001、MC-DEMO-004 |
| CS-GE-01 | Gelugor | MC-DEMO-002 |
| CS-BL-01 | Bayan Lepas | MC-DEMO-003 |

这些点是演示用的区域代表位置，不是经过核实的施工坐标。所有公告仍为组员已标明的虚构数据。

## 怎么查看

双击项目根目录的 `打开网站.cmd`，或直接打开 `index.html`，然后点 Impact Map。原目录结构需要保留。无需安装 Node，也不需要数据库。

想直接验证公告往返，可打开 `announcement-detail.html?id=MC-DEMO-002`，点 View impact map，再从地图点 Read full announcement。

## 报告交接

使用本目录中的 `Member2_Report.pdf` 阅读模型和说明；编辑时从 `Member2_Report.md` 复制正文，或用 `diagrams/` 下的 `.drawio` 文件修改图。PNG 适合插入报告，SVG 适合无损缩放。

核心模型正文占约 2 页，地图截图材料另 1 页。总报告是全组最多 10 页，请由组长与其它成员的内容一起取舍，不要重复加入项目背景、Objectives 或 Problem Statement。现有 Member 2 报告没有重写这些章节。

新稿只有开头写了 MutiaraChat，后文与前端都使用 MutiaraConnect；本次保持与前端一致。聊天截图中尚待老师澄清的 User Diagram 没有被擅自解释为另一张用例图。

## 本次实际验证

`verification.json` 记录 45 项实际 Microsoft Edge 检查，全部通过：

- 原首页公告、公告列表和原有筛选功能。
- 4 条公告各自的详情 → 地图 → 原详情往返，且标题、日期、时段、影响和出入说明一致。
- 搜索、区域/类型组合筛选、无结果提示和恢复。
- 卡片、marker 和关联公告按钮的键盘操作及焦点恢复。
- 本地示意图、实际在线街道瓦片、两种断网恢复情况。
- 390px 手机布局、菜单、筛选和详情不遮挡选中标记。
- 直接双击 HTML 的运行和筛选。
- 已实现页面无 JavaScript 异常和本地资源缺失。

## 其他成员后续接入

原仓库中的 `feedback.html`、`tracking.html`、`admin.html` 仍未上传，这次保持其原有导航入口，未代替其他成员实现。请对应成员继续提交自己的页面，再做全组导航和业务流程验收。

反馈状态的概念设计仍按分工表使用 Submitted / In Progress / Responded；M3、M4 如已决定改名，应同步修改模型、时序图、页面和演示稿。新版 UML 将现有前端实现与后续反馈/管理员设计范围分开解释。

视频仍需你本人练习、出镜及讲解。`Demo_Script_EN.md` 已按新网页流程更新。

## 引用和 AI credits

组长负责合并全组 References 和 AI credits。本次使用 AI 协助整理模型、实现地图及公告链接、编写说明和执行测试，应按课程要求如实说明。保留 Leaflet 的许可证及街道图上的 OpenStreetMap 署名。
