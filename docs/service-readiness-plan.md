# jingyier service readiness plan

更新时间：2026-07-12

这份计划记录真实服务接入边界。当前已选择 Cloudflare D1 + Pages Functions 作为留言功能首选方案；天气已通过同源 Pages Function 接入 Open-Meteo；全文搜索仍不接真实外部服务。

## 留言后端方案

### 已选：Cloudflare D1 + Pages Functions

- 用途：访客提交留言，写入 D1 的 `messages` 表。
- API：`POST /api/messages` 提交留言，`GET /api/messages` 读取最近 20 条已审核留言。
- 存储：D1 database `jingyier_messages`，Pages binding name `DB`。
- 审核：第一版不做后台，在 Cloudflare D1 控制台手动把 `pending` 改为 `approved`。
- 前端要求：提交成功后提示“审核后公开”；API 失败时继续回退到浏览器本地保存。
- 风控：服务端限制长度、去空白、拒绝空内容，隐藏 honeypot 字段拦截简单机器人；后续再加 Turnstile 或管理接口。

审核 SQL：

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

### 备选：第三方表单服务

- 用途：如果不想维护 D1 审核流，可只接收留言，不做公开评论区。
- 风险：免费额度、品牌露出、数据导出能力要提前确认。

### 备选：GitHub Issues / Discussions

- 用途：把留言作为站点维护记录或公开讨论源。
- 风险：GitHub API 额度、权限和展示延迟需要处理；不适合匿名高频留言。

## 天气接入预案

- 现已接入同源 Pages Function `/api/weather`，默认城市由站点配置指定，不使用浏览器定位。
- 后端默认使用 Open-Meteo；接口失败时，首页回退到 `--°C`。
- 如需更换城市，直接通过部署平台环境变量覆盖默认坐标与时区。
- 如需让访客按城市名查询天气，需要增加一次地理编码 API 调用，把城市名转换为经纬度，再请求天气接口。
- 第一版只展示短句状态，不展示复杂预报面板。

## 搜索与归档预案

- Notes 先用静态标签筛选，继续来自 Astro content collections。
- Work 先用项目类型筛选，保留静默花园、站点桌面、小工具面板等条目。
- RSS 和 sitemap 继续静态生成。
- 真正全文搜索等内容量超过当前静态筛选能力后再评估，可选 Pagefind 或构建期索引。

## 接入门槛

- 留言已明确为审核后公开；删除和批量审核能力后续按需要补。
- 明确天气默认城市和展示语言。
- 明确搜索范围：只搜 Notes，还是 Notes + Work + About。
- 每个服务都有静态 fallback，不让首页依赖外部 API 才能渲染。
