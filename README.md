# 北纬 · 加拿大图寻学习

加拿大 GeoGuessr 中文学习网页。13 个省和地区的交互地图、19 张实拍观察卡、17 条 Meta 线索、12 道判断练习、错题本与本机学习进度。实景模块支持分类筛选、搜索、隐藏地点练习、放大看图和同区域街景入口。

首页为 13 个省区的独立课程目录。每课包含区域地理、相关 Meta、当地实拍和 2 道专项练习，共 26 道专项题。每区的四节完成情况、最佳成绩和练习轮数独立保存，使用本机存储键 `north-canada-courses-v1`；保留原有全国练习和学习进度。

课程直达链接格式为 `#study/BC/geography`、`#study/BC/meta`、`#study/BC/scenes`、`#study/BC/quiz`，将 BC 替换为其他省区缩写即可。

无构建依赖。运行 `python -m http.server 4173`，访问 http://localhost:4173。

内容资料链接保存在 `data.js`；核对日期 2026-10-27。图示为学习示意，不是街景照片。地图边界来自 Click That ’Hood / OpenStreetMap，为较旧的简化数据，不用于精确测绘。OpenStreetMap 数据 © OpenStreetMap contributors，依据 ODbL 使用。

GitHub Actions 在推送至 main 后部署到 GitHub Pages。

照片来自 Wikimedia Commons，作者、拍摄日期和许可证随图片展示，完整列表见 `CREDITS.md`。下载的许可图片经缩小、WebP 转码，画面未裁切；网页采用 contain 显示完整构图。所有街景入口均为同区域代表点，不表示照片的原始机位。
