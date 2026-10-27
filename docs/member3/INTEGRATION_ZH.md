# Member 3 反馈提交与状态跟踪交接

记录日期：2026-10-27。阶段 1 已实现并完成浏览器验证。本模块是 Part A 前端模拟，数据保存在当前浏览器，不向真实项目团队发送，也不提供生产认证或访问控制。

范围更正（2026-10-28）：文件5不属于本任务；当前按文件3的Member 3执行，除本模块前端外，还须完成至少一张准确时序图及完整解释。**本轮已审查候选图并完成[正式两图及英文解释](sequence/Member3_Sequence_Diagrams.docx)**；本文件中的功能检查不代表个人任务全部完成。全平台UI和原型报告仅作为额外素材，见[当前分工](TASK_SCOPE_ZH.md)。

## 页面和演示流程

1. 双击仓库根目录 `打开网站.cmd`，从导航进入 Submit Feedback。
2. 填写摘要、类别、区域、地点和问题描述；可选择一张不大于 2 MB 的 JPG、PNG 或 WebP 示例照片。
3. 提交后进入 `feedback-success.html?reference=编号`，查看回执、复制编号或进入查询。
4. `tracking.html?reference=编号` 展示该反馈、状态、时间线、照片及已有回应；刷新后仍可查询。
5. 也可直接打开 tracking.html，点击三个示例卡片。示例数据全部为虚构内容。

| 示例编号 | 状态 | 场景 |
| --- | --- | --- |
| MC-FB-DEMO-001 | Submitted | 施工噪音 |
| MC-FB-DEMO-002 | In Progress | 行人通道标识 |
| MC-FB-DEMO-003 | Responded | 商家入口受影响 |

Chrome／Edge 同源页面使用同一存储。本轮还在 Microsoft Edge 验证了直接双击 HTML 的提交、回执和查询流程；其他浏览器对 file:// 存储的处理可能不同。使用同一个本地静态服务器可以保持明确的同源关系。不同协议、端口、浏览器、隐私会话或设备不会共享新提交的记录。

## 文件与影响范围

- 新页面：feedback.html、feedback-success.html、tracking.html。
- 页面逻辑：js/feedback-pages.js。
- 共享数据模型：js/feedback-store.js。
- 专用样式：css/feedback.css，继承 css/style.css 的颜色、导航、按钮和页面结构。
- 没有修改其他成员的 HTML、共享 app.js、共享 style.css 或地图代码。
- admin.html 尚未实现；这是后台成员的接入项，不是反馈模块已完成的功能。

## 后台接入约定

后台页按顺序引入 `js/feedback-store.js`，通过 `window.MutiaraConnectFeedback` 读写；不要直接维护另一套反馈数据。仅同一浏览器、同一来源内共享数据，不要求后台同学采用某个框架。

```js
const feedback = window.MutiaraConnectFeedback;
const reports = feedback.list();
const report = feedback.find('MC-FB-DEMO-002');
feedback.updateStatus(report.id, 'Responded', 'Sample response: the access concern has been reviewed.');
```

| API | 约定 |
| --- | --- |
| list() | 返回本机记录和三个示例记录的副本；已更新示例按本机记录覆盖 |
| find(reference) | 去首尾空格、不区分大小写查找，未找到返回 null |
| submit(input) | 校验字段，生成唯一编号并保存；成功返回记录副本，失败抛出错误且不报告成功 |
| updateStatus(reference, status, note) | 更新当前状态并添加带时间的历史；备注不可为空，最多 1,500 字符 |
| statuses | Submitted / In Progress / Responded，与 Member 2 当前类图一致 |
| categories | Noise / Road access / Pedestrian access / Business access / Safety concern / Other |
| areas | george-town / gelugor / bayan-lepas，以及对应显示名称 |

后台负责自己页面的筛选、展示和操作入口。新提交不会自动变成“已处理”，只有显式状态更新才追加进度；这样不会伪造工作人员回应。

## 记录结构

```js
{
  id: 'MC-FB-...',
  title: 'Short summary',
  category: 'Pedestrian access',
  area: 'gelugor',
  location: 'Sample walkway',
  description: 'Description of the sample concern',
  status: 'Submitted',
  createdAt: 'ISO 8601 timestamp',
  photo: null, // Or { name, dataUrl } for a validated image.
  history: [{ status: 'Submitted', at: 'ISO 8601 timestamp', note: '...', actor: 'MutiaraConnect' }]
}
```

存储键是 `mutiaraconnect.feedback.v1`，内容为 `{ version: 1, reports: [...] }`。时间存储为 ISO 字符串，界面统一按 Asia/Kuala_Lumpur 显示并标 MYT。保存会触发当前页面的 `mutiaraconnect:feedback-changed` 事件；其他标签页通过浏览器 storage 事件刷新已显示的查询结果。

不要把此存储当作安全数据库，或在演示中输入真实个人信息。清除网站存储会删除本机新建的反馈；三个内置示例来自代码，仍可用于演示。图片占用浏览器存储，空间不足时会阻止提交、保留表单内容并给出重试提示，不会跳转到成功回执。无法读取的旧数据不会被静默覆盖。

## 验证结果

本轮使用 Microsoft Edge 与 Playwright，通过 **62 项**检查，无未处理脚本错误和模块资源请求失败。记录见 [verification.json](verification.json)。

覆盖：

- 首页入口、表单校验、输入错误纠正及描述计数。
- 文件类型、实际图片解码、大小限制、照片预览／移除和跨页保存。
- 成功回执、唯一编号、复制回退、返回表单后的可用性。
- 新提交查询、刷新持久化、同源标签页共享、不同会话隔离。
- 后台 API 更新与已打开查询页的跨标签同步。
- 三种示例状态、时间线与预设虚构回应展示。
- 空编号、格式错误、未知编号、无效回执以及防止用户输入被当成 HTML 执行。
- 存储满／写入被禁和损坏数据时不误报成功、不覆盖旧数据。
- 原首页和公告筛选的基本回归检查。
- 1440、1024、768、390、320 像素下的三页宽度、手机菜单与直接打开本地 HTML。

截图位于 [screenshots](screenshots)。它们是阶段 1 的运行证据；阶段 2 已完成的全系统 UI 原型见 [UI_DESIGN_ZH.md](UI_DESIGN_ZH.md)。阶段 3 已完成的[报告插入稿](report/Member3_Prototype_Design.docx)含四幅精选图和图注。阶段 1 测试没有重新验证地图的全部功能，也没有验证尚未实现的后台业务界面。

## 技术验收与当前交接状态（2026-10-28）

本模块及额外原型素材曾通过反馈62项、UI58项、集成及图标20项检查，共140项，另补齐既有Leaflet库缺失图标；技术证据见[final-verification.json](final-verification.json)。时序图及英文解释已在[sequence目录](sequence/README_ZH.md)完成，当前按[交接说明](DELIVERY_ZH.md)整合报告、录制和交接。正式后台仍由其负责人接入；共享API的验证不代表工作人员页面已实现。分支已推送并建立[PR #5](https://github.com/gyxiii/penang-lrt-community-platform/pull/5)，等待负责人审阅／合并；旧ZIP只作历史快照。
