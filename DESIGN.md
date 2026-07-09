# jingyier 静态网站设计与工程计划书

更新时间：2026-07-09

## 1. 项目定位

jingyier 是一个以“艺术气息、内容表达、轻量性能”为核心的静态网站。首版应先成为一个可发布、可持续更新、可扩展的品牌/个人/作品展示站，而不是一开始就做成复杂 Web App。

核心目标：

- 首屏美观、克制、有记忆点，适合后续沉淀品牌、文章、作品、影像与小型互动。
- 尽量免费部署，运行成本接近 0。
- 静态优先，动态能力只在必要时通过 JSON API 增量接入。
- 工程结构保持清晰，后续可平滑添加 CMS、表单、订阅、作品库、搜索、多语言等功能。

## 2. 推荐技术栈

### 2.1 首选架构

- 前端框架：Astro
- 语言：TypeScript + Astro Components
- 样式：CSS Modules 或 Astro scoped CSS；若需要设计系统规模化，再引入 Tailwind CSS
- 内容：Markdown / MDX + Astro Content Collections
- 动效：原生 CSS transitions + View Transitions；复杂滚动叙事再按需引入 Lenis / GSAP
- 图片：本地 `src/assets` + Astro Image，输出 AVIF/WebP；外部素材需保留授权记录
- 后端 JSON：Vercel Functions，目录建议为 `api/*.ts`
- 静态部署：Cloudflare Pages 优先；Vercel 可作为 API 与预览部署
- DNS/CDN/WAF：Cloudflare
- 版本管理：GitHub，仓库 `https://github.com/jingyier/hello-jingyier.git`

选择原因：

- Astro 官方定位是内容驱动网站，默认尽量少发客户端 JavaScript，适合静态站、作品集、营销页和博客。
- Cloudflare Pages 可直接连接 Git 提供商，并可通过 Pages Functions 增加无服务器动态能力。
- Vercel Functions 可用极少代码返回 JSON，适合配置、订阅、表单代理、轻量查询等场景。
- GitHub Pages 可作为备用静态托管，但主线建议 Cloudflare Pages，因为 DNS、CDN、回滚、边缘能力整合更完整。

### 2.2 免费/低成本组件表

| 模块 | 推荐 | 免费策略 | 后续替换点 |
| --- | --- | --- | --- |
| 静态生成 | Astro | 开源免费 | 内容复杂后仍可保留 |
| 托管 | Cloudflare Pages | 免费计划足够首版 | 流量/团队需求升级 |
| JSON API | Vercel Functions | 小流量免费额度通常足够 | 可迁移到 Cloudflare Workers |
| DNS/CDN | Cloudflare | 免费 DNS/CDN/WAF 基础能力 | 需要高级安全再升级 |
| 内容 | Markdown/MDX | Git 管理免费 | 可加 Decap CMS / TinaCMS / Sanity |
| 图片 | 本地优化 + Unsplash/Pexels | 免费素材，需遵守授权 | 品牌成熟后改自制摄影/视频 |
| 字体 | Google Fonts / 系统字体 | 免费 | 品牌字体可自托管 |
| 分析 | Cloudflare Web Analytics | 免费且轻量 | 后续接 Plausible/PostHog |
| CI/CD | GitHub + 平台自动构建 | 免费公共仓库友好 | 复杂检查再加 GitHub Actions |

## 3. 视觉方向调研

调研来源包含 Awwwards、Creative Bloq 设计作品集与视差网站集合、Godly/现代作品集类站点，以及 Cloudflare/Astro/Vercel 官方文档。

可吸收的风格模式：

1. 画廊式作品集
   - 特征：大图、少文字、强留白、网格布局。
   - 适合 jingyier 的作品、摄影、设计实验展示。

2. 编辑部杂志风
   - 特征：强排版层级、窄栏正文、跨栏标题、图文节奏变化。
   - 适合品牌故事、文章、策展式内容。

3. 轻量视差叙事
   - 特征：少量滚动层次、图片或视频作为叙事节点。
   - 注意：只用于关键页面，不让动效成为性能负担。

4. 极简品牌主页
   - 特征：黑白/低饱和背景、明确主标题、1-2 个高质量视觉资产。
   - 适合首版快速上线，保持高级感。

5. 艺术实验感界面
   - 特征：非对称栅格、细线、索引式导航、局部 hover 互动。
   - 注意：导航和内容可读性必须优先。

推荐首版视觉方案：

- 基调：温润的米白或浅灰底，搭配墨黑文字、低饱和青绿/朱红作为点睛色。
- 排版：中文使用系统字体栈，英文标题可用 `Inter` / `Instrument Serif` / `Cormorant Garamond` 之一。
- 首屏：不要营销式大口号；用 “jingyier” 作为明确第一视觉信号，配一张真实质感图片或短视频。
- 版式：首屏下方露出下一段内容，形成继续探索的暗示。
- 动效：页面切换、图片显影、滚动进入即可；避免重型全屏动画。

## 4. 信息架构

首版页面：

- `/` 首页：品牌名、短句、精选视觉、最新内容/作品入口。
- `/work` 作品：卡片/网格，按年份、类型或主题筛选。
- `/notes` 札记：Markdown 内容集合，支持标签。
- `/about` 关于：人物/品牌叙述、联系方式、社交链接。
- `/api/site.json` 或 Vercel `api/site.ts`：返回站点配置、最新内容摘要或轻量动态数据。

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
│  └─ site.ts
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

### 8.3 Vercel JSON API

建议将轻量 API 放在 `api/`：

```ts
export default function handler() {
  return Response.json({
    name: "jingyier",
    status: "alive",
    updatedAt: new Date().toISOString()
  });
}
```

若前端部署在 Cloudflare、API 部署在 Vercel，需要处理：

- CORS allowlist，只允许正式域名和预览域名。
- API 返回缓存头，例如 `Cache-Control: s-maxage=60, stale-while-revalidate=300`。
- 不在前端暴露任何密钥。

## 9. 阶段计划

### Phase 0：工程基线

- 初始化 Git、`.gitignore`、README、DESIGN。
- 创建 Astro 项目。
- 配置 TypeScript、基础 lint/format。
- 配置 Cloudflare Pages 和 Vercel 项目。

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

- 增加 Vercel `api/site.ts`。
- 接入表单代理、订阅、站点公告或最新状态。
- 做 API fallback 和缓存策略。

交付物：静态站 + 小型 JSON 后端。

### Phase 4：体验增强

- 增加搜索、筛选、页面转场、轻量视差。
- 加入 Cloudflare Web Analytics。
- 做 Lighthouse、移动端、弱网验证。

交付物：体验完善的公开版本。

## 10. 风险与决策

- 不建议首版引入 React/Next.js：对静态艺术内容站来说运行时成本偏高。
- 不建议首版依赖大型视频：免费托管与移动端性能压力大。
- 不建议一开始接数据库：Markdown 内容足够支撑早期内容迭代。
- 若后续需要登录、评论、支付、复杂后台，再单独设计应用层，不污染静态站主架构。
- 若 API 只返回静态配置，优先用构建期 JSON；只有需要运行时变化时才用 Vercel Functions。

## 11. 参考来源

- Astro 官方文档：`https://docs.astro.build/en/concepts/why-astro/`
- Cloudflare Pages 官方文档：`https://developers.cloudflare.com/pages/`
- Vercel Functions 官方文档：`https://vercel.com/docs/functions`
- GitHub Pages 官方文档：`https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages`
- Unsplash License：`https://unsplash.com/license`
- Pexels License：`https://www.pexels.com/license/`
- Creative Bloq 作品集案例：`https://www.creativebloq.com/portfolios/examples-712368`
- Creative Bloq 视差网站案例：`https://www.creativebloq.com/web-design/parallax-scrolling-1131762`
- Awwwards：`https://www.awwwards.com/`
