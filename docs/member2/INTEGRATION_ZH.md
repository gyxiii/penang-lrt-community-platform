# Member 2 地图与报告交接

施工影响地图已接入 MutiaraConnect 小组前端，复用三个示例地点和原有四条公告。Google Maps、离线示意图和 OpenStreetMap 街道图共享搜索、筛选、选中地点及公告详情链接。所有施工点和公告均为虚构演示数据，不是经过核实的施工坐标或交通指引。

## 打开网站

Windows 首次获取仓库后双击根目录 `打开网站.cmd`。它仅在 `js/google-map-config.js` 缺失时，从 example 复制空白配置，再打开首页；已有 Key 配置保持原样。其他系统先复制 example，再打开 `index.html` 或使用静态网页服务器。仅准备配置可运行 `打开网站.cmd --prepare-only`。

空配置使用示意图，无需账号或数据库。要显示真实 Google 地图，按 [GOOGLE_MAPS_ZH.md](GOOGLE_MAPS_ZH.md) 填写自己的有效 Key。私人配置被 Git 忽略，不随仓库或交付包上传。直接打开未准备配置的原始克隆会缺少该可选脚本，应先完成上述准备。

从首页选 Impact Map；也可打开 `announcement-detail.html?id=MC-DEMO-002`，点击 View impact map，再从地图点击 Read full announcement，检查同一公告的往返。

本地 HTML 预览中的 Street map 会另开 OpenStreetMap 官方页面，避免在缺少有效 HTTP 来源时向 OSM 请求瓦片而出现 Access blocked 图片。Google 地图和示意图仍内嵌；通过 HTTP/HTTPS 打开网站时保留内嵌街道图。外部 OSM 链接会随选中的示例地点更新。此前的123项记录针对上一轮修补，不代表本轮重新执行了真实 OSM 服务验收；本轮另有 `street-map-access-verification.json` 的无外部请求单元检查。

## 报告和模型

- [Member2_Models.docx](Member2_Models.docx)：两页精简模型正文，用于全组十页报告合稿。
- [Member2_Report.docx](Member2_Report.docx)：可编辑完整说明，含两页模型及一页最新地图证据。
- [Member2_Report.pdf](Member2_Report.pdf)：与完整 DOCX 一致的阅读版。
- [Member2_Report.md](Member2_Report.md)：可复制正文，模型图片使用相对路径。
- [diagrams/](diagrams/)：Use Case Diagram 和 Class Diagram 的 PNG、SVG 与可编辑 drawio，各一套。
- [Demo_Script_EN.md](Demo_Script_EN.md)：约三分钟个人讲解稿，已包含 Google、示意图和街道图的切换，以及公告往返。

优先把两页模型合入总报告；地图截图可与其他成员的原型证据合并取舍。不要额外加入 Objectives、Problem Statement 或独立背景页。完整说明供组内编辑与演示，不代表每一页都必须放入最终十页报告。

两张 UML 图描述 F1–F5 全系统设计。反馈、追踪、管理员和状态历史是计划中的其他模块，不能据此宣称已完成后端、数据库或生产认证。User Diagram 仍由组长向教师确认，不能用 Use Case Diagram 自动替代。原始 rubric 和全组终稿仍需小组核对。

## 本轮修补

- 900px 及以下窗口使用带可访问名称的图标全图按钮，避免 761px、768px 等窄平板窗口遮住底图按钮。
- Google 已加载后切到示意图再断网，重新点 Google 会保持示意图并提示离线；加载过程中断网同样不会激活迟到的结果。恢复网络后可重新选择 Google。
- 隐藏的 Google 实例收到离线回调时会清理，避免之后复用失效实例。
- 示意图测试与真实 Google 测试分别配置，避免 Google 默认切换导致测量隐藏的 Leaflet 图层。
- 补齐此前只在本地的模型、报告和演示稿，说明与最新三底图实现保持一致。

## 验证记录

本轮共通过 123 项检查：

| 检查 | 通过数 | 记录 |
| --- | --- | --- |
| 既有功能、公告往返、键盘、OSM及手机 | 45 | `verification.json` |
| 视口、拖动、恢复全图及11种宽度下的控件间距 | 26 | `viewport-verification.json` |
| Google API 模拟、加载竞态、断网及重连 | 22 | `google-map-verification.json` |
| 真实 Google HTTP | 14 | `google-map-live-verification.json` |
| 真实 Google 直接打开 HTML | 14 | `google-map-live-file-verification.json` |
| 初次生成配置及不覆盖已有配置 | 2 | `setup-verification.json` |

真实 Google 记录与模拟 API 记录分开保存。`screenshots/map-google-live.png` 和 `map-google-live-mobile.png` 是本轮真实底图截图。其他电脑的 Key 权限和演示网络仍需各自验证。

## 全组提交前

反馈、追踪、管理员页面，以及 Sequence Diagram、Architecture Diagram 属其他成员后续接入范围。全组统一合并引用和 AI credits。个人讲解稿已提供，最终录像仍需要本人练习、录制并与全组视频合并。Leaflet 许可证和地图署名需保留。
