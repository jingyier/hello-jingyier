# jingyier 静态网站设计与工程计划书

更新时间：2026-07-11

## 1. 项目定位

jingyier 是一个以“艺术气息、内容表达、轻量性能”为核心的静态网站。首版应先成为一个可发布、可持续更新、可扩展的品牌/个人/作品展示站，而不是一开始就做成复杂 Web App。

核心目标：

- 首屏美观、克制、有记忆点，适合后续沉淀品牌、文章、作品、影像与小型互动。
- 尽量免费部署，运行成本接近 0。
- 静态优先，动态能力只在必要时通过 Cloudflare Pages Functions + D1 增量接入。
- 工程结构保持清晰，后续可平滑添加 CMS、表单、订阅、作品库、搜索、多语言等功能。

## 2. 推荐技术栈

### 2.1 首选架构

- 前端框架：Astro
- 语言：TypeScript + Astro Components
- 样式：CSS Modules 或 Astro scoped CSS；若需要设计系统规模化，再引入 Tailwind CSS
- 内容：Markdown / MDX + Astro Content Collections
- 动效：原生 CSS transitions + View Transitions；复杂滚动叙事再按需引入 Lenis / GSAP
- 图片：本地 `src/assets` + Astro Image，输出 AVIF/WebP；外部素材需保留授权记录
- 后端 JSON/API：Cloudflare Pages Functions，目录建议为 `functions/api/*.ts`
- 留言存储：Cloudflare D1，binding name 固定为 `DB`，数据库建议名为 `jingyier_messages`
- 静态部署：Cloudflare Pages 优先；Vercel 只作为历史示例或备用预览，不作为留言功能主线
- DNS/CDN/WAF：Cloudflare
- 版本管理：GitHub，仓库 `https://github.com/jingyier/hello-jingyier.git`

选择原因：

- Astro 官方定位是内容驱动网站，默认尽量少发客户端 JavaScript，适合静态站、作品集、营销页和博客。
- Cloudflare Pages 可直接连接 Git 提供商，并可通过 Pages Functions 增加无服务器动态能力。
- Cloudflare Pages Functions 可和 Pages 同域部署，D1 适合承载低频、可审核的访客留言。
- GitHub Pages 可作为备用静态托管，但主线建议 Cloudflare Pages，因为 DNS、CDN、回滚、边缘能力整合更完整。

### 2.2 免费/低成本组件表

| 模块 | 推荐 | 免费策略 | 后续替换点 |
| --- | --- | --- | --- |
| 静态生成 | Astro | 开源免费 | 内容复杂后仍可保留 |
| 托管 | Cloudflare Pages | 免费计划足够首版 | 流量/团队需求升级 |
| JSON API | Cloudflare Pages Functions | 和 Pages 同域，免费额度适合首版 | 可迁移到 Workers |
| 留言存储 | Cloudflare D1 | 免费额度适合低频留言，手动审核 | 后续可加管理后台或 Turnstile |
| DNS/CDN | Cloudflare | 免费 DNS/CDN/WAF 基础能力 | 需要高级安全再升级 |
| 内容 | Markdown/MDX | Git 管理免费 | 可加 Decap CMS / TinaCMS / Sanity |
| 图片 | 本地优化 + Unsplash/Pexels | 免费素材，需遵守授权 | 品牌成熟后改自制摄影/视频 |
| 字体 | Google Fonts / 系统字体 | 免费 | 品牌字体可自托管 |
| 分析 | Cloudflare Web Analytics | 免费且轻量 | 后续接 Plausible/PostHog |
| CI/CD | GitHub + 平台自动构建 | 免费公共仓库友好 | 复杂检查再加 GitHub Actions |

## 3. 视觉方案

当前首页视觉方向已从传统静态作品站调整为手机优先的互动冥想花园产品，项目中文名为“静默花园”。旧的霓虹、WebGL、档案装置式方向已废弃；首页直接进入产品原型，而不是营销落地页。

### 3.1 核心概念

- 一句话概念：用户在静默的异星荒原中，以触摸播种、呼吸、共鸣和雨落完成一次短暂的冥想仪式。
- 体验关键词：安静、低饱和、纸张颗粒、粗轮廓、细纹理、异星植物、漂浮水母、轻微孤独感。
- 首屏形态：桌面端居中展示 9:16 手机画布；移动端全屏进入手机体验。
- 交互气质：克制、慢、柔和；不使用音乐，用视觉反馈承担节奏表达。

### 3.2 场景结构

当前产品流程保留 6 个主章节：

1. `Opening Silence`：触摸前的荒原，场景安静、留白较多。
2. `First Touch`：用户在土壤区域滑动播种，花朵从触摸路径附近离散生长。
3. `Breathing Path`：花朵呼吸感增强，画面进入更柔和的停留状态。
4. `Crystal Resonance`：漂浮物回应路径的光，画面发生共鸣式转场。
5. `Seed Rain`：进入雨落场景时触发花雨；每次重新进入该章节都会再次触发。
6. `Night Garden`：完成并保存为夜园结果。

场景切换时，用户种下的花卉会清空消失，以突出每一幕的重新开始。花雨作为转场层可以继续落完，但再次进入雨落场景必须重新生成。

### 3.3 视觉资产系统

资产主要来自用户提供的图像，放在 `public/images/silent-bloom/` 下：

- `backgrounds/`：六个主场景背景，包括荒原、呼吸、共鸣、雨落、夜园等。
- `flowers/`：交互生成的花朵、半开花、闭合花、种芽。
- `props/glow-moss-blooms.png`：地面苔藓花簇，分布在前四个场景的土壤位置，作为不突兀的场景装饰。
- `props/guide-rest.png`：未点击时的漂浮水母姿态。
- `props/guide-active.png`：点击推进场景时的水母姿态。

旧的水晶按钮素材和 CSS 绘制按钮已移除。场景推进按钮完全由漂浮水母素材承担，不再保留 `crystal-target`、`data-crystal` 或 `progress-crystal` 相关实现。

### 3.4 色彩与质感

- 主色调：粉灰天空、浅沙土、雾青、低饱和紫、旧纸米色。
- 点睛色：暖橙花光、浅青共鸣光、夜园中的深青绿色。
- 质感：全局保留纸张颗粒、轻微暗角和手绘线稿感；避免高饱和霓虹和硬边科技感。
- 图像处理：装饰素材通过低饱和、混合模式、投影和裁切融入地面，不做漂浮贴纸感。

### 3.5 交互视觉规则

- 播种只在 `Opening Silence` 和 `First Touch` 阶段响应。
- 花朵只能出现在土壤区域，避开人物、天空、水晶/物体、底部前景和左右边缘物体。
- 拖拽播种采用按距离生成的稳定算法，花朵带侧向离散偏移和最小间距，避免形成机械直线。
- 场景推进通过点击水母完成；点击后水母短暂切换姿态，然后推进章节。
- 水母可在整个手机画布内无规则移动，并且头部始终沿运动方向旋转。
- 水母移动速度较慢，单次漂移约 6-11 秒，符合冥想节奏。
- 不使用音频、音乐或 Web Audio，所有反馈通过图像、花雨、呼吸动效、场景切换完成。

### 3.6 UI 与文案原则

- UI 控制保持极少，只保留重置、进度、保存夜园和章节状态入口。
- 文案保持克制，不做教程式说明；交互含义主要通过花、雨、水母姿态和场景变化表达。
- 桌面端可以保留简短标题说明和章节导航；移动端隐藏外部说明，保持沉浸式手机画布。
- 控件不使用营销风格按钮，不使用大面积卡片堆叠；手机画布是第一视觉主体。

## 4. 信息架构

首版页面：

- `/` 首页：品牌名、短句、精选视觉、最新内容/作品入口。
- `/work` 作品：卡片/网格，按年份、类型或主题筛选。
- `/notes` 札记：Markdown 内容集合，支持标签。
- `/about` 关于：人物/品牌叙述、联系方式、社交链接。
- `/api/messages`：Cloudflare Pages Function，提交访客留言并读取最近审核通过的留言。
- `/api/site.json` 或历史示例 `api/site.ts`：可保留为站点配置、最新内容摘要或轻量动态数据示例，但不作为留言路径。

后续可扩展页面：

- `/gallery` 影像/视觉素材库。
- `/archive` 时间线。
- `/lab` 互动实验。
- `/rss.xml` RSS。
- `/sitemap.xml` SEO 站点地图。
- `/en/*` 多语言版本。

## 5. 资源获取策略

### 5.1 图片

优先级：

1. 自有摄影、自有图像、自制生成图。
2. Unsplash / Pexels，下载后本地压缩，并记录作者、URL、授权日期。
3. 公共领域博物馆/档案馆资源。

素材规范：

- 原图放入 `src/assets/originals`，生产图放入 `src/assets/images`。
- 每个外部素材在 `src/content/assets-log.json` 记录来源、作者、链接、授权、用途。
- 避免使用可识别人物、商标、艺术品作为核心商业视觉，除非授权明确。
- 输出优先 AVIF/WebP，保留合理 fallback。

### 5.2 视频

首版不建议使用大视频作为核心依赖。若必须使用：

- 使用 5-8 秒循环短视频，无声，压缩为 MP4/WebM。
- 移动端替换为静态海报图。
- 单个视频目标小于 2 MB。
- 后续可接 Cloudflare Stream 或 Mux，但首版保持本地静态资源即可。

### 5.3 字体

- 中文：系统字体栈，减少加载成本。
- 英文标题：可使用 Google Fonts，并优先自托管 woff2。
- 字重控制在 2-3 个，避免多字体多字重拖慢首屏。

## 6. 代码结构规划

建议目录：

```text
.
├─ api/
│  └─ site.ts                 # 历史 Vercel JSON API 示例，可后续删除
├─ db/
│  └─ schema.sql              # Cloudflare D1 schema
├─ functions/
│  └─ api/
│     └─ messages.ts          # Pages Functions 留言 API
├─ public/
│  ├─ favicon.svg
│  └─ robots.txt
├─ src/
│  ├─ assets/
│  │  ├─ images/
│  │  └─ originals/
│  ├─ components/
│  ├─ content/
│  │  ├─ notes/
│  │  ├─ work/
│  │  └─ assets-log.json
│  ├─ layouts/
│  ├─ pages/
│  ├─ styles/
│  └─ utils/
├─ astro.config.mjs
├─ package.json
├─ tsconfig.json
└─ DESIGN.md
```

## 7. 设计模式与代码约束

### 7.1 前端约束

- 页面只负责组合内容和布局。
- 可复用 UI 放在 `components`。
- 页面框架放在 `layouts`。
- 数据读取、格式化、排序放在 `utils`。
- 全局 token 放在 `styles/tokens.css`，如颜色、间距、字体、断点。
- 组件样式优先就近 scoped CSS，避免全局污染。

### 7.2 可维护设计模式

- Composition over inheritance：通过小组件组合页面，不做复杂继承。
- Adapter pattern：外部 API 或内容源统一封装，后续从 Markdown 切 CMS 不影响页面。
- Repository-like content access：内容读取集中在 `utils/content.ts`。
- Progressive enhancement：核心内容静态可读，互动只增强体验。
- Fail-soft API：JSON API 失败时页面仍可展示静态内容。

### 7.3 性能预算

- 首屏 JS：目标小于 30 KB gzip。
- 首页图片：首屏关键图小于 300 KB，其他图懒加载。
- Lighthouse：Performance / SEO / Accessibility / Best Practices 均目标 90+。
- 字体：最多 2 个字体族，最多 3 个字重。
- 动效：尊重 `prefers-reduced-motion`。

### 7.4 可访问性

- 所有图片必须有语义化 `alt`，装饰图 alt 为空。
- 保持键盘可导航。
- 文本对比度符合 WCAG AA。
- 不用纯颜色表达状态。
- 表单和交互控件必须有可识别 label。

## 8. 部署与 Git 工作流

### 8.1 Git 初始化

```bash
git init
git branch -M main
git remote add origin https://github.com/jingyier/hello-jingyier.git
git add .
git commit -m "docs: add jingyier design plan"
git push -u origin main
```

### 8.2 Cloudflare Pages

建议配置：

- Build command: `npm run build`
- Build output: `dist`
- Production branch: `main`
- Node version: 使用当前 LTS
- DNS：域名接入 Cloudflare 后添加 Pages 自定义域。

### 8.3 Cloudflare Pages Functions + D1 留言 API

留言功能首选同域 Cloudflare Pages Functions，不再把 Vercel 作为 API 主线。

建议配置：

- D1 database: `jingyier_messages`
- Pages D1 binding name: `DB`
- Schema: 执行 `db/schema.sql`
- API path: `GET /api/messages`、`POST /api/messages`
- 审核方式：第一版在 Cloudflare D1 控制台手动执行 `UPDATE messages SET status='approved' WHERE id=?;`

前端行为：

- 提交先请求 `/api/messages`。
- 服务端默认写入 `status='pending'`，前台只读取 `status='approved'`。
- API 缺失、D1 binding 未配置或请求失败时，回退到浏览器本地 `localStorage` 留言。
- 不使用定位、不暴露 API key、不承诺所有留言都会公开。

表结构：

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_agent_hash TEXT,
  ip_hash TEXT,
  source TEXT NOT NULL DEFAULT 'home'
);
```

如未来保留 Vercel，仅用于历史 `api/site.ts` 示例或备用预览；留言功能不依赖 Vercel。

需要继续遵守：

- API 返回统一 JSON：`{ ok: true }` 或 `{ ok: false, error }`。
- 错误响应不泄露内部异常细节。
- 服务端限制长度、去空白、拒绝空内容，并用隐藏 honeypot 字段拦截简单机器人。

## 9. 阶段计划

### Phase 0：工程基线

- 初始化 Git、`.gitignore`、README、DESIGN。
- 创建 Astro 项目。
- 配置 TypeScript、基础 lint/format。
- 配置 Cloudflare Pages 项目。

交付物：可构建、可部署的空站。

### Phase 1：视觉原型

- 确定首页艺术方向。
- 搭建首页、About、Work、Notes。
- 建立颜色、字体、间距 token。
- 准备 3-5 张首版图片素材。

交付物：可访问的首版静态网站。

### Phase 2：内容系统

- 使用 Astro Content Collections 管理作品与札记。
- 增加标签、时间、封面图、摘要字段。
- 增加 SEO、Open Graph、sitemap、RSS。

交付物：可长期更新的内容站。

### Phase 3：轻动态能力

- 增加 D1 留言表与 Cloudflare Pages Function。
- 接入 `POST /api/messages` 提交 pending 留言，`GET /api/messages` 读取 approved 留言。
- 做 fail-soft API fallback：接口不可用时继续保留静态内容与本地留言。

交付物：静态站 + D1 留言后端。

### Phase 4：体验增强

- 增加搜索、筛选、页面转场、轻量视差。
- 加入 Cloudflare Web Analytics。
- 做 Lighthouse、移动端、弱网验证。

交付物：体验完善的公开版本。

## 10. 风险与决策

- 不建议首版引入 React/Next.js：对静态艺术内容站来说运行时成本偏高。
- 不建议首版依赖大型视频：免费托管与移动端性能压力大。
- 不建议一开始把内容系统接数据库：Markdown 内容足够支撑早期内容迭代；访客留言属于运行时输入，接 D1 并设置审核字段是可接受的轻量动态边界。
- 若后续需要登录、评论、支付、复杂后台，再单独设计应用层，不污染静态站主架构。
- 若 API 只返回静态配置，优先用构建期 JSON；只有需要运行时变化时才用 Pages Functions。

## 11. 参考来源

- Astro 官方文档：`https://docs.astro.build/en/concepts/why-astro/`
- Cloudflare Pages 官方文档：`https://developers.cloudflare.com/pages/`
- Cloudflare Pages Functions 官方文档：`https://developers.cloudflare.com/pages/functions/`
- Cloudflare D1 官方文档：`https://developers.cloudflare.com/d1/`
- GitHub Pages 官方文档：`https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages`
- Unsplash License：`https://unsplash.com/license`
- Pexels License：`https://www.pexels.com/license/`
- Creative Bloq 作品集案例：`https://www.creativebloq.com/portfolios/examples-712368`
- Creative Bloq 视差网站案例：`https://www.creativebloq.com/web-design/parallax-scrolling-1131762`
- Awwwards：`https://www.awwwards.com/`
