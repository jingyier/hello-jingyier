# Cloudflare Pages deployment notes

更新时间：2026-07-12

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

## D1 留言配置

留言功能使用 Cloudflare Pages Functions + D1，不需要 Vercel。

1. 在 Cloudflare 创建 D1 database：`jingyier_messages`。
2. 在 Pages 项目设置里绑定 D1：
   - Binding name: `DB`
   - Database: `jingyier_messages`
3. 在 D1 控制台执行 `db/schema.sql`。
4. 部署后检查 `GET /api/messages` 返回 JSON。

访客提交会写入 `status='pending'`。第一版采用 D1 控制台手动审核：

```sql
SELECT id, body, status, created_at
FROM messages
WHERE status='pending'
ORDER BY created_at DESC
LIMIT 20;

UPDATE messages
SET status='approved'
WHERE id='实际留言ID';
```

首页只读取 `approved` 留言。D1 binding 未配置或 API 不可用时，首页会继续展示静态留言，并回退到浏览器本地留言。

## 天气接口配置

天气接口使用 Cloudflare Pages Functions 的 `GET /api/weather`，不需要 D1，也不需要把第三方天气密钥暴露到客户端。

1. 新增函数文件：`functions/api/weather.ts`。
2. 如需自定义城市，在 Pages 项目里配置环境变量：
    - `WEATHER_LOCATION_NAME`：展示名称，例如 `南昌`
    - `WEATHER_LATITUDE`：纬度，例如 `28.6829`
    - `WEATHER_LONGITUDE`：经度，例如 `115.8582`
    - `WEATHER_TIMEZONE`：时区，例如 `Asia/Shanghai`
3. 如果不配置环境变量，接口默认使用南昌坐标。
4. 接口上游使用 Open-Meteo，返回前端可直接渲染的 JSON：

```json
{
   "ok": true,
   "location": {
      "name": "南昌",
      "latitude": 28.6829,
      "longitude": 115.8582,
      "timezone": "Asia/Shanghai"
   },
   "weather": {
      "condition": "晴",
      "temperature": 29,
      "windSpeed": 3.1,
      "observedAt": "2026-07-12T08:00"
   }
}
```

5. 首页卡片会先显示“加载中”，如果接口失败则回退到 `--°C`。
6. 本地验证：`astro dev` 默认不运行 Cloudflare Pages Functions。需要先构建，再用 Pages 兼容的本地服务或线上预览环境检查接口。

```bash
npm run build
npx wrangler pages dev dist
```

7. 访问本地 Pages dev 地址或 Cloudflare 预览部署的 `/api/weather`，确认返回 `ok: true`，并且首页的 `#local-time` 与 `#weather-info` 正常刷新。
8. 如果需要让用户按城市名动态查询天气，需要额外增加一个地理编码 API 调用，把城市名转换为经纬度。当前版本没有这一步，因此只显示环境变量或 query string 指定的地点。

## 部署后线上检查

```bash
npm run verify:deploy
```

默认检查 `https://jingyier.pages.dev`。检查预览部署或自定义域时传入 URL：

```bash
npm run verify:deploy -- https://preview.example.pages.dev
```

这个脚本会请求首页、`/api/messages`、`/api/weather`、`/garden/`、Notes、Work、RSS、sitemap，以及静默花园的关键 WebP/PNG 图片资源。

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

## 真实服务边界

当前版本已接入 D1 留言，并通过同源 Pages Function 提供天气接口 `/api/weather`。天气不使用浏览器定位，密钥也不进入客户端 bundle；如果需要改城市，直接用环境变量覆盖默认坐标即可。全文搜索等方案仍只记录在 `docs/service-readiness-plan.md`，等后续再接。
