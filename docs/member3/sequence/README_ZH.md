# Member 3 时序图与报告材料

完成日期：2026-10-28（马来西亚时间）。本材料对应文件3的Member 3，以及rubric R T31“至少一张准确时序图并完整解释”的要求。已审查组员候选PNG，并重新制作两张相互衔接的图及英文解释；不另增独立Feedback Workflow图。

## 直接使用

| 用途 | 文件 |
| --- | --- |
| 合入报告 | [Member3_Sequence_Diagrams.docx](Member3_Sequence_Diagrams.docx)，两页，329词，含两图及英文解释 |
| 复制正文 | [同内容Markdown](Member3_Sequence_Diagrams.md) |
| 提交过程图 | [PNG](diagrams/Sequence_Submission.png)／[SVG](diagrams/Sequence_Submission.svg) |
| 工作人员更新与公众查询图 | [PNG](diagrams/Sequence_Review_Tracking.png)／[SVG](diagrams/Sequence_Review_Tracking.svg) |
| 修改图形和文字 | [Member3_Sequence_Diagrams.drawio](diagrams/Member3_Sequence_Diagrams.drawio)，含两个可编辑页面 |
| 按文本改图 | [提交图Mermaid](diagrams/Sequence_Submission.mmd)／[更新与查询图Mermaid](diagrams/Sequence_Review_Tracking.mmd) |
| 验证记录 | [verification.json](verification.json) |

Word正文可直接编辑；插入的图是高分辨率PNG。修改图中元素时用draw.io源文件或SVG，导出后替换Word图片。`source`保留图形模型、生成脚本和定向检查，方便复现。

## 两张图表达什么

M3A显示已实现的公众提交：表单校验、失败时终止本次尝试、共享模型读取本地记录、建立编号及Submitted历史、保存失败或成功，以及仅在保存成功后给出回执。

M3B衔接已有编号，使用opt表示工作人员处理可以不发生，loop表示对同一记录的多次有效状态更新；随后展示公众查询及空／格式错误、查到／查无记录的分支。工作人员通过UI和共享模型更新，不直接访问存储。Feedback UI是相关页面的边界抽象，各阶段分别表示公众页或拟接入的工作人员页，不声称它们是同一HTML文件。

图中Browser storage指浏览器localStorage，不是服务器数据库。共享submit／find／updateStatus接口已存在；正式admin.html界面尚待后台成员接入。工作人员循环表示“有效输入、已存在记录且存储可写”的设计路径；共享API仍会拒绝无效状态、空备注、未知编号或写入失败。图不声称已实现工作人员登录或真实处理服务。

时间自上而下；竖向虚线是生命线，实线箭头表示调用，横向虚线箭头表示返回。break在条件满足时结束本次交互，alt按条件选择分支，opt表示可选处理，loop表示重复更新。图描述模块层面的主要交互，省略内部辅助函数的重复读取、DOM事件和照片解码等细节，不作为逐行代码跟踪图。

## 相比候选图修订了什么

1. 将未区分用途的Feedback Database改为浏览器本地存储，符合Part A现状。
2. 将工作人员直接访问数据库的路径改为拟接入的UI→共享模型→本地存储。
3. 对输入错误采用break，不让验证失败继续保存。
4. 明确编号和Submitted历史由模型创建，保存成功后才返回回执。
5. 对保存失败和成功采用alt，避免错误流程产生成功提示。
6. 查询区分空／格式错误和合法但不存在的编号。
7. 状态及历史与现有Feedback、FeedbackStatusHistory概念一致；不声称API强制只能单向流转。
8. 使用虚线生命线、调用／返回箭头、条件框和两张图的连续说明；源PNG保留原样。

## 合入全组报告

- 将两页内容放入Sequence Diagram及Explanation对应章节。M3A／M3B是局部图号，合稿时统一图号和引用。
- 两页是当前材料版式，不是教师规定的M3页数。文档当前为Letter、Arial 10.5pt，合稿采用全组统一设置，并重新检查最多10页的限制。无需额外封面或目录。
- 反馈模块截图已有，可按组内原型章节安排选择；此前两页Prototype Design是额外原型素材，不与本文件混为时序图报告。
- 本轮完成的是图及解释的制作。整组合稿、本人录制、代码交接、正式后台接入和最终提交仍分别推进。
- 原历史ZIP没有这些新文件，仍是旧快照；从当前目录取用材料。

## 验证与来源

已用本机Word只读导出，确认两页并逐页目视检查；图中文字、图注和正文无裁切或相互重叠。标准渲染脚本因环境缺少LibreOffice失败，实际分页依据Word，不把失败记为通过。临时PDF和页面PNG仅作QA，保存在工作区tmp/member3-sequence，不作为提交正文。

另检查两张SVG的63个文字元素，未发现边界溢出或相互重叠；用现有共享模型通过12项定向检查，验证保存顺序、失败不报成功、状态／历史更新和编号查询。旧的140项前端检查保留为历史证据，本轮未更改网页代码，也未重复执行整套浏览器功能测试。

任务依据为原题Q P7、P12、rubric R T31、P39–P40，以及分工G3 P27–P30；这些定位来自工作区原文摘录，不是Word页码。实现依据为仓库js/feedback-store.js和js/feedback-pages.js，指纹记录在验证文件中。

记法与源文件格式参考：[OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1)、[Eclipse UML2交互操作符](https://download.eclipse.org/modeling/mdt/uml2/javadoc/5.0.0/org/eclipse/uml2/uml/InteractionOperatorKind.html)、[Mermaid时序图语法](https://mermaid.js.org/syntax/sequenceDiagram.html)、[draw.io XML编辑说明](https://www.drawio.com/docs/manual/advanced/diagram-source-edit/)。
