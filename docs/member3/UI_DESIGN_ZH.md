# MutiaraConnect 整体 UI 设计与覆盖说明

范围更新：2026-10-28。用户更正文件5不属于本任务，**本文件描述的全平台UI是此前额外制作的公共素材，不是当前Member 3独自承担的职责**。当前M3为反馈模块＋时序图及完整解释＋本模块截图和演示；时序图及英文解释已在[sequence目录](sequence/README_ZH.md)完成，详见[当前分工](TASK_SCOPE_ZH.md)。图库与图件继续保留，沿用已有项目设计，未重新实现其他成员功能。

## 如何查看

双击仓库根目录的 `查看UI原型.cmd`，或直接打开 [UI 总览](ui/index.html)。不需要登录、地图 Key、数据库或预览服务器。

- 选择任一界面卡片，查看大图、用途、主要交互、设计说明和原作者／实现分工。
- 使用 Desktop / Mobile 切换 1440 像素桌面截图与 390 像素手机截图。
- Open working screen 打开实际工作页面；后台入口明确显示 Open design prototype。
- View full-size capture 打开未经拼接修改的整页截图；缩略图仅在卡片中裁剪显示。
- 图库保留 `screen` 和 `view` 查询参数，方便直接打开指定预览。

界面为英文，与现有网站一致；本说明用于中文组内查阅。

## 五个功能与八个界面

| 界面 | 功能覆盖 | 当前页面或原型 | 状态 | 核心交互 |
| --- | --- | --- | --- | --- |
| 01 Community home | 全站入口；F1 | index.html | 已实现，复用 Member 1 页面 | 从公告和五功能卡片进入后续页面 |
| 02 Announcement list | F1 公告 | announcements.html | 已实现，复用 Member 1 页面 | 搜索、区域和类型筛选、空结果、重置 |
| 03 Announcement detail | F1 → F2 | announcement-detail.html?id=MC-DEMO-002 | 已实现，复用详情页及地图联动 | 查看影响、进入同一公告对应地图 |
| 04 Construction impact map | F2 施工影响 | map.html?notice=MC-DEMO-002 | 已实现，复用 Member 2 页面 | 选择地点、查看影响、返回同一公告 |
| 05 Submit a concern | F3 反馈提交 | feedback.html | 已实现，阶段 1 制作 | 结构化表单、校验、可选照片、提交 |
| 06 Feedback receipt | F3 → F4 | feedback-success.html | 已实现，阶段 1 制作 | 回执、保留编号、前往查询 |
| 07 Track a report | F4 反馈跟踪 | tracking.html | 已实现，阶段 1 制作 | 编号查询、状态、时间线、回应 |
| 08 Staff dashboard | F5 管理 | ui/admin-prototype.html | 独立设计稿，交给后台负责人实现 | 示例队列、筛选、详情、状态与回应预览 |

“7 个已实现界面”不等于“7 个功能”；上述界面围绕组内既有 F1–F5 范围组织。回执是反馈流程的一个状态交接页面，不额外冒充独立主要功能。

分工编号按现有组内分工与仓库材料记录。后台视觉方案由本次 UI 设计提供，业务页面 `admin.html` 仍待 Member 4 接入；没有代替其架构图或其他报告职责。

## 导航与流程

[可编辑 SVG 导航图](ui/navigation.svg)说明两条主要路径：

1. 首页 → 公告列表 → 公告详情 ↔ 对应施工影响地图。
2. 首页／导航 → 反馈提交 → 成功回执及编号 → 查询状态和处理历史。

现有公共导航也允许直接进入地图或查询页面，并非必须逐页经过前述路径。图中实线表示已实现的页面流转；后台到公众查询的棕色虚线表示待接入的数据更新流程。当前后台设计稿本身不会改变公众反馈。

这张图是UI导航设计，不替代rubric中的模型图。按文件3，Sequence Diagram及完整解释本来就属于M3；User diagram、Use Case、Class和Architecture按相应成员分工处理，不因制作图库全部转给用户。

## 统一的视觉与交互规范

本次直接复用 `css/style.css`，并用有独立前缀的样式扩展原型工具。首页、公告、地图、反馈页面的既有源代码与功能在阶段 2 保持不变。

| 项目 | 采用的设计 |
| --- | --- |
| 品牌 | MutiaraConnect；MC 标记；LRT 社区信息与反馈定位 |
| 主要颜色 | Teal #116B70；深色文字 #152B3A；页面背景 #F5F8F9；进度浅色 #FFF3DF |
| 字体 | 沿用 Inter、Segoe UI、Arial、sans-serif 回退顺序，无新增在线字体依赖 |
| 结构 | 清楚的主标题、简短介绍、可见主要操作；白色内容区域配浅灰边界 |
| 控件 | 沿用按钮、表单、圆角和导航语言；次要操作与主要操作区分 |
| 状态 | Submitted / In Progress / Responded；颜色与文字同时表达状态 |
| 错误状态 | 表单指出具体错误；查询区分空值、格式错误和查无记录；列表提供清空筛选方式 |
| 可访问性 | 新原型提供原生按钮、明确标签、可见键盘焦点、跳过导航入口和状态提示；未声称完整通过某个无障碍认证 |
| 响应布局 | 桌面展示并排区域；小屏将表单、详情、队列和说明纵向排列。宽导航图可在容器内横向查看 |

完整的交互状态可直接在工作页面或后台设计稿中操作；不是只交付静态海报。

## 后台设计稿的范围

独立页面 [admin-prototype.html](ui/admin-prototype.html)位于 UI 目录，不占用正式 `admin.html` 路径。

- 提供三个示例队列条目、状态筛选、关键词搜索、详情选择、空结果和重置。
- 允许选择拟更新状态、输入回应并查看公众端文本预览。
- 输入为空时会阻止预览；输入中含 HTML 时按普通文字显示。
- 不导入 `feedback-store.js`，不读取用户实际反馈，不写入 localStorage，也不进行网络提交。
- 刷新即丢弃回应预览；队列当前状态不会因预览改变。页头、按钮与回显均说明是设计预览。
- 后台负责人可按此布局实现，并使用 [阶段 1 数据约定](INTEGRATION_ZH.md)接入共享反馈模型。

上述素材已覆盖全系统UI，但与M3已另行完成的时序图及完整解释为不同材料，也不代表全组后台业务页面及五功能完整集成完成。

## 截图和素材

- [八界面总览图](ui-overview.png)：从实际 UI 图库截取的索引，可快速检查覆盖范围。
- [UI 总览桌面截图](ui-catalogue-desktop.png)与[手机截图](ui-catalogue-mobile.png)。
- [导航图预览](ui-navigation-preview.png)与[SVG 源文件](ui/navigation.svg)。
- [16 张界面截图](ui/screenshots)：八界面各一张桌面和手机版本，文件名以 `-desktop`／`-mobile` 区分。
- UI 可编辑源文件：HTML、CSS、JS、SVG，均位于 `ui/`，后续可以继续调整。

截图由当前仓库实际页面在浏览器中生成；后台截图取自独立设计原型。地图使用离线示意图，不需要私人 Key；没有把示意图截图冒充真实 Google 底图。回执预览使用内置虚构编号 MC-FB-DEMO-001，不表示用户已提交这条记录。

## 验证

阶段 2 通过 **58 项** Microsoft Edge / Playwright 检查，记录见 [ui-verification.json](ui-verification.json)。

覆盖八界面桌面／手机截图无水平溢出、图册选择和真实链接目标、尺寸切换、带参数重载、键盘操作、导航图加载、后台筛选与预览、HTML 安全显示、原型对真实反馈存储的隔离、320／390／768／1024 像素下新 UI 工具布局，以及直接双击本地文件的使用方式。没有未处理脚本错误或失败的本地资源请求。

阶段 1 的 62 项功能检查记录单独保留，不将阶段 2 的图库检查冒充所有现有业务功能的再次完整验收。现有模块的运行截图和新增原型已目视复查；没有宣称后台认证、真实处理或数据库已经实现。

## 报告材料更新

此前已制作[两页英文Prototype Design稿](report/Member3_Prototype_Design.docx)、四幅图件及[合稿说明](report/REPORT_HANDOFF_ZH.md)，作为额外公共素材保留。M3提供本模块截图即可，不需要把16张图全部放进报告；M3时序图及解释已另行完成，见[新Word稿](sequence/Member3_Sequence_Diagrams.docx)。历史技术验收见[交接记录](DELIVERY_ZH.md)，不能用其推定个人任务全部完成。
