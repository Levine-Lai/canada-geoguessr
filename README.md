# 北纬 · 加拿大图寻学习

加拿大 GeoGuessr 中文实景教程。按 10 个省、3 个地区阅读：Google 360°街景、区域地理、Meta 讲解、图文实拍与记忆对照。无测验、答题、评分、隐藏答案或完成门槛。

每区包含 2 个 Google 街景观察点，共 26 个，选点参考 Plonk It Canada 的公开地图链接。网页使用 Google Maps 的分享嵌入格式载入原站全景，不下载或托管 Google 影像。Google Earth 3D 地形通过同位置链接在原站打开。加载需要能访问 Google；旧全景失效时提供附近街景入口。拍摄日期以 Google 画面为准。

另保留 19 张带署名的实拍照片、17 条 Meta 线索及全国区域地图。照片讲解直接展示，支持放大与分类检索。Google 街景载入前的背景是本区参考照片，明确标注为参考图，与全景机位不同。

教程直达链接格式为 `#study/BC/panorama`、`#study/BC/geography`、`#study/BC/meta`、`#study/BC/scenes`、`#study/BC/memory`。将 BC 替换为其他省区缩写即可。旧测验链接返回教程；旧本机学习记录不再读取或写入。

无构建依赖。运行 `python -m http.server 4173`，访问 http://localhost:4173。

内容资料链接保存在 `data.js`；核对日期 2026-10-27。图示为学习示意，不是街景照片。地图边界来自 Click That ’Hood / OpenStreetMap，为较旧的简化数据，不用于精确测绘。OpenStreetMap 数据 © OpenStreetMap contributors，依据 ODbL 使用。

GitHub Actions 在推送至 main 后部署到 GitHub Pages。

中国大陆电话区号学习表位于 `designs/china-area-codes/`，含地图版、圆圈分组版与城市对照表。覆盖 01—09 前缀，重点对照 06、07、08；支持按前缀与城市搜索、分享当前筛选和打印。区号按省级行政区、主要本地网整理，细分边界接入不逐一列出。资料链接和整理日期在页面底部。

照片来自 Wikimedia Commons，作者、拍摄日期和许可证随图片展示，完整列表见 `CREDITS.md`。下载的许可图片经缩小、WebP 转码，画面未裁切；网页采用 contain 显示完整构图。所有街景入口均为同区域代表点，不表示照片的原始机位。

阅读布局采用大字与大图：移除侧栏，省区内保留街景、照片、识别要点三个入口。主讲解字号为 20–22px，详情与来源按需展开；省区图册采用大幅图片导航。
