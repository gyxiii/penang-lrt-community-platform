# Member 3 报告材料合稿说明

范围更新：2026-10-28。文件5不属于本任务；按文件3和rubric，M3报告主责为**至少一张准确时序图及完整解释，现已在[新时序图报告](../sequence/Member3_Sequence_Diagrams.docx)完成**。本目录现有两页Prototype Design是此前额外制作的全组可用素材，不能替代M3时序图报告。详见[当前分工](../TASK_SCOPE_ZH.md)。此轮保留DOCX与配套正文、截图原样；本文仅供组内合稿，不复制进提交正文。

## 推荐使用的文件

- [Member3_Prototype_Design.docx](Member3_Prototype_Design.docx)：两页可编辑英文插入稿，含正文、四幅精选界面图及图注。
- [Member3_Prototype_Design.md](Member3_Prototype_Design.md)：与 Word 内容一致的可复制正文，图件使用相对链接。
- [assets](assets)：四幅独立 PNG 图件及截图来源记录。
- [完整 UI 图库](../ui/index.html)：保留八界面的桌面／手机预览，供队长额外取图。

Word 采用 A4，Arial 10.5 pt 正文、20 pt 标题、13 pt 小标题和 9 pt 图注；上下边距 0.65 英寸、左右 0.7 英寸，与组员现有模型材料的常用版式协调。没有封面、目录或重复的项目背景页。

本机 Word 的实际导出结果为两页，两页均已渲染为图片逐页检查。合入总报告后，样式、章节编号及分页可能改变，最终仍以整组合稿为准。内部排版检查文件不属于需提交材料。

## 内容与图件

| 图号 | 独立图件 | 展示内容 | 使用时应保留的信息 |
| --- | --- | --- | --- |
| PD1 | [PD1_home_navigation.png](assets/PD1_home_navigation.png) | 运行首页的五功能入口 | 后台入口目前待接入，不能据此宣称五功能已全部运行 |
| PD2 | [PD2_staff_design_excerpt.png](assets/PD2_staff_design_excerpt.png) | 独立后台设计稿的队列、详情和回应编辑区 | 明确标为 design prototype，预览操作不修改已保存反馈 |
| PD3 | [PD3_feedback_form_excerpt.png](assets/PD3_feedback_form_excerpt.png) | 运行表单的摘要、类别、区域部分 | 是有意选取的 form excerpt，不是声称完整表单只有这些字段 |
| PD4 | [PD4_feedback_tracking.png](assets/PD4_feedback_tracking.png) | 运行查询页中的示例状态、回应与历史 | 编号 MC-FB-DEMO-003 是虚构示例，不是现实投诉 |

截图均直接截自当前网页的实际区域，没有修改截图中文字。来源页面、区域范围、截图宽度、设计稿标记及文件指纹见 [capture-manifest.json](assets/capture-manifest.json)。截图采用演示内容，无需私人地图 Key 或用户个人资料。

## 合入最多 10 页的整组报告

1. 将英文正文和必要图件放入全组 Prototype Design／User Interface Design 章节。文档标题不是新封面，不必另占一页。
2. PD1–PD4 是本材料的局部图号。合稿时按总报告图号顺序重新编号，并同步替换正文中的 Figure PD1 等交叉引用。
3. 两页是本次建议版式，不是教师规定 UI 部分必须两页。应与介绍、相关者、系统模型、架构和参考文献共同控制在 10 页以内。
4. 需要压缩时，优先保留反馈提交与跟踪的 PD3、PD4；首页或后台可按全组已有截图取舍。同时删除被移除图片的正文引用，保留对五功能导航及后台设计范围的简短说明。
5. 已有 Member 2 地图截图和模型说明不必在 UI 章节再次整页重复。地图界面在完整 UI 图库中仍可取用。
6. M3正式两图及英文解释现已制作并核对完成，见[图件说明](../sequence/README_ZH.md)，不能以本原型稿或UI导航图替代；也不替代user diagram、Use Case或Architecture Diagram。原型截图由全员提供，M3优先提供反馈、回执、跟踪的素材。

## 合稿时必须如实表达的范围

- 实现范围：现有公共信息页面、反馈提交、回执和查询是可运行前端。
- 反馈数据：新报告保存在同一浏览器中，刷新后可查；不同来源、设备或浏览器不共享。
- 后台范围：当前有独立设计稿，正式 `admin.html` 与其业务接入仍由后台成员实现。若之后已完成，应先更新实际页面、截图和表述，再宣称已实现。
- 状态名称：Submitted / In Progress / Responded，与现有类图一致。新反馈不会自动变成已处理。
- 示例性质：页面、投诉、回应及施工信息均为课程演示样例。
- AI：依用户告知的新政策，无需附加 AI 使用声明或 AI credits；普通来源引用与地图许可仍按全组资料保留。

## 验证与后续

文件内容、四幅嵌入图片、图号引用和 Word 实际两页版式已检查，记录见 [report-verification.json](report-verification.json)。报告没有把阶段 1、2 的测试次数当作应用正式性能、用户研究或无障碍认证结果。

此前两页DOCX的Word分页检查和前端集成测试继续作为素材质量证据，不作为当前M3完整交付验收。当前从已完成的时序图及解释推进本模块截图合稿、本人录制与代码交接；见[更正后的交接入口](../DELIVERY_ZH.md)。正式后台仍待其负责人接入，代码及新时序图报告已推送，并建立[PR #5](https://github.com/gyxiii/penang-lrt-community-platform/pull/5)且已合并main，负责人可直接从默认分支取Word材料合稿。旧ZIP内部的分工说明已过时，未在本轮重打包。
