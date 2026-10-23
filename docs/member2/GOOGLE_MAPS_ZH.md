# Google 地图内嵌配置

网站已接入 Google 官方 Maps JavaScript API，使用 AdvancedMarkerElement 显示三个示例地点。左右两部分共用原有四条公告、筛选条件、选中地点和公告跳转，未复制第二套公告数据。

## 启用真实地图

1. 用个人 Google 账号打开 https://developers.google.com/maps/documentation/javascript/demo-key ，选择 Get a Demo Key，按 Google 页面完成申请和条款确认。
2. 打开项目中的 `js/google-map-config.js`，把自己的 Key 填进 `apiKey: ''` 的引号内并保存，不要把 Key 发到聊天里。`mapId: 'DEMO_MAP_ID'` 可用于演示。
3. 在项目目录用本地网页服务器打开网站，例如 `http://localhost:8332/map.html`，然后刷新。配置有效时会默认加载 Google 地图，也可点击 Google Maps 切换。
4. 如 Google 控制台允许设置网站来源限制，将 Key 限制到你实际演示使用的本地地址和正式网站，并只启用所需的 Maps JavaScript API。具体限制能力以 Demo 项目设置为准。正式部署使用自己的受限 Key 和 Map ID。

Google Demo Key 的资格、配额和支持功能以官方文档为准。它面向测试和原型；不能据此保证无限免费、所有地区可申请或生产使用。需要网络能访问 Google Maps。

## 文件与发布

`js/google-map-config.js` 是本地配置，已加入 `.gitignore`。从 Git 仓库获取本项目后，先复制 `js/google-map-config.example.js` 为 `js/google-map-config.js`，再填写自己的 Key；下载交付压缩包时会附带一份空白配置。

浏览器地图 Key 会由浏览器向 Google 发送，并非服务器密钥；网页访客可以看到它，因此来源限制仍然必要。本地配置不随普通 Git 提交上传。交付包只包含空配置，不能把已经填写的配置文件混入共享压缩包。

缺少 Key、Google 脚本加载失败、认证失败或首次底图加载超时，都会保留或恢复离线示意图。浏览器报告断网时，当前 Google 地图也会切回示意图。仅 Google 的后续瓦片请求局部失败而浏览器仍报告在线时，不保证可以可靠检测。

## 当前验证边界

已用本地配置执行真实 Google Maps API 和真实地图瓦片验证，12 项检查通过，记录在 `google-map-live-verification.json`；真实截图是 `screenshots/map-google-live.png` 和 `screenshots/map-google-live-mobile.png`。另有 18 项模拟 Google API 的接入检查，记录为 `google-map-verification.json`，两类证据单独保存。

这只验证当前电脑和当前 Key。其他组员的账号、Key 权限、演示网络及正式部署域名仍需各自验证。

官方参考：

- https://developers.google.com/maps/documentation/javascript/demo-key
- https://developers.google.com/maps/documentation/javascript/load-maps-js-api
- https://developers.google.com/maps/documentation/javascript/advanced-markers/basic-customization
