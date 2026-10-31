# Member 4 管理员后台交接说明

更新日期：2026-10-31。范围依据 `CMT322_Part_A_四人小组任务分配.docx`：M4 负责 F5 Administrative Dashboard、Architecture Diagram 与集成组织。

## 本模块完成了什么

`admin.html` 原先不存在，但全站导航、首页功能卡与报告都指向它。本模块新增了正式后台页面，并与 Member 3 的共享反馈模型完成对接：

- 查看反馈队列、按状态／区域／类别／关键词筛选、重置筛选与空结果提示。
- 查看单条反馈的完整内容、可选照片与完整活动时间线。
- 选择新状态并填写回应，保存后通过 `MutiaraConnectFeedback.updateStatus()` 追加带时间的历史记录；公众端 `tracking.html` 在同一个浏览器内立即显示新状态与回应。
- “Published announcements” 只读页签：列出 Member 1 的示例公告，以及 Member 2 在影响地图中新增的浏览器本地公告；可按区域、类型和关键词筛选，并打开真实详情页。
- 视觉与导航沿用 `css/style.css` 与 `css/feedback.css`；状态颜色、时间线、按钮、跳过导航与页脚与现有页面一致。

## 新增文件（未改动其他成员的任何文件）

| 文件 | 作用 |
| --- | --- |
| `admin.html` | 管理员后台页面：状态卡、反馈队列、详情／回应表单、公告只读视图 |
| `js/admin.js` | 队列筛选、详情渲染、状态更新与跨标签页刷新 |
| `css/admin.css` | 后台专用布局与响应式样式，继承共享配色 |
| `tests/admin-browser.cjs` | Playwright／Edge 浏览器验证脚本 |
| `docs/member4/verification.json` | 本次验证记录 |
| `docs/member4/screenshots/` | 桌面与手机运行截图 |

`index.html`、`announcements.html`、`announcement-detail.html`、`map.html`、`feedback.html`、`feedback-success.html`、`tracking.html`、`js/app.js`、`js/feedback-store.js`、`js/location-store.js`、`js/feedback-pages.js`、`css/style.css`、`css/feedback.css` 均保持原样。导航中的 Admin 链接原本就存在，因此没有产生死链，也不需要修改其他成员页面。

## 数据对接方式

```js
const feedback = window.MutiaraConnectFeedback;      // js/feedback-store.js
const reports = feedback.list();                     // 本机记录 + 三个内置示例
feedback.updateStatus('MC-FB-DEMO-002', 'In Progress', 'Sample follow-up note.');
```

- 只使用 `list()` 与 `updateStatus(reference, status, note)`，没有另建一套反馈数据，也没有直接改 `localStorage` 结构。
- 保存会触发 `mutiaraconnect:feedback-changed`，并写入 `mutiaraconnect.feedback.v1`；公众查询页通过 `storage` 事件刷新。
- 新提交不会自动变成“已处理”，必须由后台显式保存状态更新，避免伪造工作人员回应。
- 公告视图读取 `js/app.js` 的共享 `announcements` 数组；本地公告通过 `announcements.html`／`announcement-detail.html` 的既有 `noticeHref()` 生成兼容 `file://` 的链接。
- 用户输入的标题、描述与回应一律用 `textContent` 或转义后输出，不会被当作 HTML 执行。

## 演示步骤（约 4 分钟）

1. 双击 `打开网站.cmd`（或启动任意静态服务器），在导航点 **Admin**。
2. 观察状态卡与队列；用状态、区域、类别或关键词筛选，点击 **Reset filters** 恢复。
3. 选择 `MC-FB-DEMO-002`，查看问题描述与活动时间线。
4. 把新状态改为 **Responded**，填写示例回应并保存；确认成功提示、状态徽章与统计卡立即更新。
5. 点击 **Open the public tracking view**（或另开 `tracking.html?reference=MC-FB-DEMO-002`），确认公众端显示同一状态与回应。
6. 切到 **Published announcements**，展示公告只读列表与筛选，打开一条详情后返回。
7. 说明这是 Part A 前端模拟：没有账号、服务器或数据库；数据仅存在当前浏览器。

## 验证

`tests/admin-browser.cjs` 使用 Microsoft Edge（Playwright）在本地静态服务器上执行，覆盖：初始队列与统计、筛选与空状态、详情与时间线、空回应校验、状态保存与历史追加、HTML 输入按纯文本显示、公众查询页同源联动与跨标签自动刷新、公告视图与筛选、Tab 键盘操作、导航链接可达、1024／768／390／320 像素无横向溢出，以及无脚本错误和失效本地资源。

运行方式（与仓库其他测试一致）：

```powershell
# 任选一个静态服务器，例如在仓库根目录
python -m http.server 8341
# 或 node <任意静态服务器脚本> . 8341

$env:BASE_URL='http://127.0.0.1:8341'
$env:PLAYWRIGHT_MODULE='C:\path\to\node_modules\playwright-core'
node tests/admin-browser.cjs
```

结果写入 `docs/member4/verification.json`，截图写入 `docs/member4/screenshots/`。

## 报告与架构图衔接

- 报告第 7 页 Architecture Diagram（`Architecture_diagram_M4.docx`）已把 Presentation Layer 描述为 “public interface + administrator dashboard (view reports, filter, simulate status updates)”。本页面正是该架构图 Presentation Layer 中管理端的落地实现，Client-Side Logic Layer 对应 `js/admin.js`，Mock Data Layer 对应浏览器存储中的反馈记录。
- 报告 7.2 节目前写的是 “The main staff page and its connection to saved feedback remain for the administrator module to implement.”。合稿时请改为已完成，并加入后台截图（`docs/member4/screenshots/admin-desktop.png` 与 `admin-mobile.png`），说明管理端与公众查询端共享同一状态模型。
- 品牌差异：`report1.docx` 正文使用 “MutiaraChat”，站点界面与仓库其余部分使用 “MutiaraConnect”。后台页面沿用站点品牌；合稿时请小组统一名称，本模块不擅自改动报告或他人页面。

## 已知限制

- 没有登录／权限控制，任何能打开页面的人都能修改本浏览器内的记录；这是 Part A 前端模拟的刻意限制。
- 数据不跨浏览器、设备或协议共享；`file://` 下不同浏览器的存储行为可能不同，建议使用本地静态服务器演示。
- 公告仅可查看，发布／编辑功能不在 Part A 范围内。
- 状态更新记录的 actor 固定为共享模型中的 “Project team (sample)”。
