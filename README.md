# 图寻知识库

以中文整理的 GeoGuessr / 图寻学习网站。无构建依赖，沿用 GitHub Pages 发布。

## 页面

- `/`：知识目录、跨专题搜索、学习入口。
- `/canada/`：13 个省与地区的图册、全国地图、26 个 Google 街景观察点、19 张实拍照片、17 条识别线索与参考资料。
- `/china/`：中国大陆电话区号地图、城市车牌与四列对照表。31 个省级行政区、452 个城市/地区/区县单位、320 个去重电话区号。直辖市按区县展示，但不把车牌字母分配给区县。

加拿大章节使用 `/canada/#study/BC/panorama`、`geography`、`meta`、`scenes`、`memory` 等链接。旧首页 `#study/...` 等链接自动转到加拿大页面。原 `designs/china-area-codes/` 链接跳转到 `/china/`，保留查询参数和省市选择。

## 本地开发与发布

在仓库根目录运行 `python -m http.server 4311`，访问 `http://localhost:4311/`。

`python scripts/check_site.py` 检查入口、站内资源、图片与 HTML 标识。JavaScript 使用 `node --check <文件>` 检查语法。GitHub Actions 在 main 推送后先运行资源检查，再复制主页、`canada/`、`china/`、`assets/` 和 `designs/` 等静态文件发布。部署配置为 `.github/workflows/pages.yml`。

## 设计与组织

`site.css` / `site.js` 管理共用导航、字号、语义色与手机菜单；`home.css` / `home.js` 管理总目录及搜索；`reader.css` 管理加拿大专题；中国专题样式、脚本和地图数据仍归属 `designs/china-area-codes/`。业务数据与图片不重复复制。

统一米白底、森林绿主色，车牌使用蓝色。正文 16px、辅助信息 14px，页面标题 28–32px；同类边框与圆角一致。真实照片保留完整构图，首页封面裁切已在图源中说明。省内地图为省域轮廓保留独立空间，空间充足的城市标注保留在区域内部，密集标注移到就近空白处；连线指向真实城市中心，选中城市的连线加深。地图高度随标注数量与补充框自适应，手机可从地图工具栏切省。

原创 Logo 为内置 image_gen 于 2026-11-05 生成的可爱地球仪与足球。原图在 `assets/brand/globe-football.png`，网页图标与缩小版本保留透明度；完整提示词见 `assets/brand/logo-prompt.txt`。

本次布局验收覆盖 320 / 375 / 390 / 768 / 1440px，包含站点导航、加拿大图册与阅读页、中国地图和对照表、查询空状态、长名称与弹窗；31 个省级页面的手机城市标注均检查过重叠。

## 资料与时间

页面显示资料原有核对日期：加拿大 2026-10-27，中国电话区号 2026-10-31，车牌 2026-11-02。此次网站和 Logo 改版不表示资料重新核对，也没有自动更新任务。

Google 街景使用 Google Maps 分享嵌入，由原站提供；3D 地形通过同位置链接打开 Google Earth。需要能访问 Google，影像时间以画面为准；参考照片与街景机位不同。选点参考 Plonk It Canada。来源、作者、拍摄日期和许可在各图详情中展示，完整照片署名见 `CREDITS.md`。

加拿大地图边界来自 Click That ’Hood / OpenStreetMap，为较旧的简化数据，仅用于学习定位。© OpenStreetMap contributors（ODbL）。中国省市地图来源、电话区号调整与车牌口径详见专题页面的“口径与来源”和 `designs/china-area-codes/README.md`。
