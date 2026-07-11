# Cloudflare Pages deployment notes

更新时间：2026-07-11

## Pages 配置

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 留空
- Production branch: `main`
- Environment variable: `NODE_VERSION=22.12.0`

项目是 Astro 静态输出，`public/images/silent-bloom/` 会被复制到 `dist/images/silent-bloom/`。不要把 Cloudflare Pages 的 root directory 指到 `src`、`public` 或 `dist`。

## 部署前本地检查

```bash
npm run build
npm run verify:static
```

`verify:static` 会确认首页、Notes、Work、About、Garden、RSS、sitemap 和花园图片 fallback 都在构建产物里。

## 部署后线上检查

```bash
npm run verify:deploy
```

默认检查 `https://jingyier.pages.dev`。检查预览部署或自定义域时传入 URL：

```bash
npm run verify:deploy -- https://preview.example.pages.dev
```

这个脚本会请求首页、`/garden/`、Notes、Work、RSS、sitemap，以及静默花园的关键 WebP/PNG 图片资源。

## 静默花园图片不显示排查

1. 确认最新改动已经提交并推送到 Cloudflare Pages 连接的 Git 分支。
2. 在 Cloudflare Pages 的最新 deployment log 中确认 build output 是 `dist`。
3. 打开 deployment 的 file browser 或用 `npm run verify:deploy` 检查这些路径：
   - `/images/silent-bloom/backgrounds/opening-silence.webp`
   - `/images/silent-bloom/backgrounds/opening-silence.png`
   - `/images/silent-bloom/props/guide-rest.webp`
   - `/images/silent-bloom/flowers/flower-open.webp`
4. 如果 WebP 返回失败但 PNG 正常，页面会使用 `data-fallback-src` 自动回退。
5. 如果 WebP 和 PNG 都是 404，说明图片文件没有进入部署产物，优先检查 Git 是否提交了 `public/images/silent-bloom/`。
6. 如果资源是 200 但页面仍不显示，检查浏览器控制台是否有 CSP、混合内容、缓存或脚本错误。

## 不接真实服务的当前约束

当前版本不请求真实天气、不提交公开留言、不使用定位，也不把 API key 暴露到客户端。真实留言、天气和全文搜索等方案只记录在 `docs/service-readiness-plan.md`，等服务方案确认后再实现。
