# jingyier 静态网站设计与工程计划书

更新时间：2026-07-12

## 1. 项目定位

jingyier 是一个静态优先的个人门户网站。当前前端方向不再是浅色纸质编辑索引，而是参考 XingHuiSama 截图气质重做的深色沉浸式个人宝藏站：固定导航、模糊图像背景、玻璃浮层、发光粒子、搜索入口、全局音乐播放器、悬浮快捷按钮和栏目化页面。

参考站只作为布局、氛围、组件位置和交互骨架参考；本站不复制其品牌、人物、歌曲、截图素材或技术栈。

核心目标：

- 首页表达 jingyier 的个人入口身份，整合 Notes、Work、Music、Garden、留言和小工具。
- `/garden` 保留为独立互动房间，不成为整个网站首页身份。
- 技术栈保持 Astro + TypeScript + 原生 CSS，不引入 React、Next、Tailwind 或大型 UI 库。
- 已实现接口和前端脚本契约不丢失，尤其是 `/api/messages` 留言。
- 本地或静态环境下 `/api/messages` 404 时，历史静态留言和 localStorage 留言仍可见。

## 2. 技术架构

- 前端框架：Astro
- 语言：TypeScript + Astro Components
- 样式：原生 CSS，设计变量集中在 `src/styles/tokens.css`
- 内容：Astro Content Collections，当前集合为 `notes` 和 `work`
- 首页增强：`src/scripts/home.js`
- 内容筛选：`src/scripts/content-filter.js`
- 音乐增强：`src/scripts/music.js`
- 留言 API：Cloudflare Pages Functions，路径固定为 `/api/messages`
- 留言存储：Cloudflare D1，database 固定为 `jingyier_messages`，binding name 固定为 `DB`
- 音乐 API：Cloudflare Pages Functions，路径为 `/api/music`，返回静态音乐元数据
- 静态部署：Cloudflare Pages

保留的公共契约：

- 路由：`/`、`/notes`、`/work`、`/about`、`/garden`
- 新增路由：`/music`
- 留言接口：`GET /api/messages`、`POST /api/messages`
- 留言返回结构：`{ ok: true }` 或 `{ ok: false, error }`
- 音乐接口：`GET /api/music` 返回 `{ ok: true, currentTrack, tracks, lyrics }`
- 筛选 hook：`data-filter-scope`、`data-filter-mode`、`data-filter-value`、`data-filter-item`、`data-filter-values`、`data-filter-status`
- 首页 hook：`data-home-page`、`data-tool`、`data-home-clock`、`data-weather-label`、`data-status-label`、`data-quote-*`、`data-message-*`
- 音乐 hook：`data-music-root`、`data-music-toggle`、`data-music-next`、`data-music-prev`、`data-music-*`

## 3. 信息架构

- `/` 首页：参考站式个人门户。包括顶部搜索、个人介绍玻璃面板、Cloud Music 预览面板、quote/歌词横条、Notes/Work/Garden 入口、小工具和留言流。
- `/notes` 归档：Archive/Search 风格页面，按标签筛选。每条短记保留日期、标题、摘要和 inline 标签。
- `/work` 项目：Projects Matrix 风格页面，按类型筛选。每条作品展示年份、类型、标题、摘要和入口。
- `/music` 音乐：云端乐律播放器骨架。展示封面、曲目信息、歌词/歌单 tabs 和播放控制 UI。
- `/about` 关于：沉浸式封面、头像/身份卡、简介和状态信息。
- `/garden` 灵境：独立互动房间，保留手机画布、章节轮盘、播种、呼吸、共鸣、雨落和保存体验。
- `/api/messages` 留言：提交 pending 留言，读取 approved 留言；接口不可用时前端回退 localStorage。
- `/api/music` 音乐：返回静态曲目与歌词元数据；无真实音频时进入预览模式。

## 4. 视觉语言

当前视觉方向是“深色沉浸个人宝藏站”：

- 深蓝/夜色背景、固定顶栏、明亮 serif 品牌字。
- 模糊本地图像背景、局部紫蓝光晕、轻粒子和草线氛围。
- 玻璃面板用于主要信息区，边框轻、阴影克制、背景半透明。
- 大标题和搜索入口形成栏目页首屏骨架。
- 悬浮快捷按钮在桌面右侧出现，移动端减少遮挡。
- 全局音乐播放器固定在底部，移动端压缩为紧凑条。
- 使用本地 Silent Bloom 资产作为背景和音乐封面，不引入未授权素材。

页面规则：

- 首页首屏必须包含搜索、个人面板、音乐预览和横向 quote/歌词条。
- Notes 与 Work 可以使用玻璃容器，但列表项仍应像 archive entry，而不是三列等尺寸卡片。
- `/garden` 不强行套全局播放器，避免遮挡互动手机画布。
- 移动端优先保证可读、可点、不溢出；播放器和 dock 不遮挡核心输入与列表。

## 5. 页面布局模式

### 首页

- 顶部：站内搜索形态入口。
- 主体：左侧个人介绍玻璃面板，右侧 Cloud Music 预览面板。
- 中段：深色横向 quote/歌词条，保留“换一句”按钮。
- 下段：内容 tiles、工具、Recent Notes、Selected Work。
- 底部：留言板。先显示 `home.json` 静态历史，再显示 localStorage 留言；远端 approved 留言成功时增强显示。

### Work

- 页面 hero 使用大标题 `Projects Matrix`、返回入口和搜索框。
- 筛选条保留 `data-filter-*` 契约。
- 项目列表为纵向 archive entry。
- Featured 项目允许左侧预览 rail，但仍不是同质卡片网格。

### Notes

- 页面 hero 使用大标题 `归档与探索` 和搜索框。
- 筛选条保留标签筛选和 `aria-live` 状态。
- 每条短记使用日期轴 + 正文摘要结构。
- 标签为安静 inline metadata。

### Music

- `/music` 使用播放器页面骨架：唱片/封面、曲目信息、进度、控制按钮、歌词 panel。
- `src/content/music.json` 是静态 fallback。
- `/api/music` 是同源增强接口。
- 当前不托管真实音频；没有 `audioSrc` 时 UI 显示预览模式，不请求外部音频。

### Garden

静默花园仍是独立项目房间，保留现有图像资产和交互结构：

1. `Opening Silence`
2. `First Touch`
3. `Breathing Path`
4. `Crystal Resonance`
5. `Seed Rain`
6. `Night Garden`

garden 可以保留自己的手机框架、章节轮盘、呼吸动效和较强沉浸式样式。

## 6. 组件与 CSS 约束

- 页面只组合内容和布局；复用 UI 放在 `src/components`。
- `SiteShell.astro` 承担普通页面的沉浸式 chrome：固定导航、背景层、dock、全局播放器。
- `NoteList.astro` 输出 note archive，并保留筛选 `data-*`。
- `WorkList.astro` 输出 work archive，并保留筛选 `data-*`。
- `SectionHeader.astro` 用于内容页 section heading，需在深色 shell 中保持可读。
- 全局 token 放在 `src/styles/tokens.css`。
- 页面样式继续放在 `src/styles/global.css`，当前以 treasure shell overrides 覆盖普通页面外观。
- 不改 `functions/api/messages.ts` 的请求路径、返回结构和审核逻辑。
- 不改 `src/scripts/home.js`、`src/scripts/content-filter.js` 的行为契约。
- 新增音乐行为只放在 `src/scripts/music.js`，不影响留言和筛选。

## 7. 可访问性与响应式

- 使用语义化 `main`、`section`、`article`、`nav`。
- 筛选按钮和工具按钮保留清楚的 `aria-pressed` 状态。
- 音乐 tabs 保留 `role="tablist"` / `aria-selected`。
- 留言输入保留 label 或 `aria-label`。
- `data-filter-status` 保留 `aria-live="polite"`。
- 文本对比度目标符合 WCAG AA。
- 尊重 `prefers-reduced-motion`。
- 桌面端展示固定 nav、宽搜索、左右玻璃面板、右侧 dock 和底部播放器。
- 平板端收敛为单列/两列。
- 手机端导航换行、播放器压缩、dock 隐藏或降噪，避免遮挡核心内容。

## 8. 留言与动态边界

留言功能首选同域 Cloudflare Pages Functions：

- `POST /api/messages`：服务端校验长度、去空白、honeypot，写入 `status='pending'`。
- `GET /api/messages`：只返回最近 approved 留言。
- 前端初始化先渲染 `home.json` 静态历史留言，再渲染 localStorage 留言。
- 本地 `localhost` / `127.0.0.1` 默认跳过远端 GET/POST，避免普通 `astro dev` 的 404 让历史留言不可见。
- 生产接口失败时只降级为本地留言，不清空静态历史。
- 前端始终提示留言需要审核。

D1 表结构由 `db/schema.sql` 维护。第一版审核可在 Cloudflare D1 控制台手动完成，后续再考虑 Turnstile、rate limiting 或管理界面。

## 9. 性能与维护

- 静态优先，核心内容不依赖客户端 JavaScript 才可读。
- 首页小工具、quote、留言、音乐预览和筛选属于 progressive enhancement。
- 不使用定位或外部天气 API；天气当前只是静态占位 copy。
- 不请求外部音乐 API；音乐当前由本地 JSON 和同源 Pages Function 提供。
- 图片资产优先使用本地 WebP，源文件和授权记录写入 `src/content/assets-log.json`。
- 构建检查使用 `npm run build`。
- 静态检查使用 `npm run verify:static`。
- Cloudflare Pages 输出目录为 `dist`。

## 10. 风险与决策

- 不引入 React/Next：当前站点是内容型静态个人网站，运行时框架会增加不必要复杂度。
- 不复制参考站素材：参考只用于布局和氛围，不用于内容或版权资产。
- 不把 Garden 作为首页：Garden 是重要项目，但首页需要承担个人门户、内容入口、音乐入口和留言入口。
- 不改变 API 契约：留言路径和 JSON 结构已经适配 Cloudflare Pages Functions + D1。
- 不改变内容集合：Notes 和 Work 仍由 Astro Content Collections 管理。
- 音乐先做接口和 UI 骨架：真实音频资产后续再接入，避免版权和资源阻塞。
