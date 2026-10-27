# Member 3 默认main交付

更新日期：2026-10-28（马来西亚时间）。用户明确代码和报告文件应直接更新到默认分支，下一位组员普通clone就能拿到最新项目；负责人只负责把各人的报告内容合为最终Word文档。

- 当前交付分支：[main](https://github.com/gyxiii/penang-lrt-community-platform/tree/main)。
- [PR #5](https://github.com/gyxiii/penang-lrt-community-platform/pull/5)已合并；合并提交701ae8273ddf80b1d910321c6a73163d4a4df8ce，后续状态说明提交接续main。
- Member 3主要内容提交671291ef3910f1620f952817d9435a1d831e34a3；制作分支member3-feedback-ui保留为历史，不是组员获取最新公共项目的必要步骤。
- 推送账号ZeLei-web；提交使用本机既有Li Linze身份。

## 获取最新项目

新目录运行：

```text
git clone https://github.com/gyxiii/penang-lrt-community-platform.git
```

已有仓库先保留本地未提交内容，再切换main并执行`git pull --ff-only origin main`。无需checkout成员分支或等待负责人合并本次代码。

Windows双击根目录`打开网站.cmd`，从Submit Feedback进入提交→回执→查询。首页沿用公共设计，新增功能主要在feedback.html、feedback-success.html、tracking.html。地图私人配置和Word临时锁文件未入库，首次启动会准备空白地图配置，离线示意图可用。

## 报告取材入口

- [两页时序图英文报告](sequence/Member3_Sequence_Diagrams.docx)：本次M3报告主责，含两张图及完整解释。
- [图件与可编辑源文件说明](sequence/README_ZH.md)：PNG、SVG、双页draw.io、Mermaid。
- [反馈接口与集成说明](INTEGRATION_ZH.md)。
- [当前任务范围](TASK_SCOPE_ZH.md)：全平台原型材料是额外素材，不替代时序图报告。

Git合并已将这些材料放入main，不会自动把Word正文合并排版。负责人仍需统一图号、名称、格式和最多10页限制。本人视频及最终课程提交尚待完成。

正式admin.html仍由后台负责人接入；工作人员界面在图中明确为拟接入流程，共享状态更新API已存在。后台完成后继续联调公众提交→工作人员更新→公众查询，并按实际情况更新报告。

旧ZIP未重打包，仍为历史快照；请以main源码和当前报告材料为准。早期验证JSON的committed／pushed字段是当时快照，不代表当前尚未交付。
