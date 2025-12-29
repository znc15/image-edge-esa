# Image Api for Aliyun ESA / Cloudflare Workers / Pages

一个可以部署到函数或者Page的随机图床 API。
支持 Aliyun ESA、Cloudflare Workers 和 Cloudflare Pages Functions。

## 功能

- `GET /api/random`：直接返回随机图片（图片内容）
	- `GET /api/random?json=1`：返回随机图片信息（JSON）
	- `GET /api/random?id=xxx`：返回指定 id 的图片（图片内容）
- `GET /r`：302 重定向到随机图片（跳转到 `/images/*.webp` 路径）
- `GET /health`：健康检查（返回 JSON）
- `GET /`：展示页（静态页面）

## 配置

### 环境变量

- `IMAGE_URLS`：图片 URL 列表（逗号分隔，可选）。配置后会覆盖默认图片列表，例如 `https://example.com/1.webp,https://example.com/2.webp` 或 `/images/1.webp,/images/2.webp`
- `CORS_ALLOW_ORIGIN`：跨域来源（默认 `*`）

### Cloudflare (Workers / Pages)

如果你把图片放在 `public/images/*.webp`，构建时会通过脚本生成默认列表（`scripts/generate-image-urls.mjs` → `src/generated/imageUrls.ts`），此时不需要手动填写 `IMAGE_URLS`。
需要使用外部图床或自定义来源时，再配置 `IMAGE_URLS`。

**Workers：**
1. 编辑 [wrangler.toml](wrangler.toml)，在 `[env.production]` 下配置：
   ```toml
   [env.production]
   vars = { IMAGE_URLS = "https://example.com/1.webp,..." }
   ```
2. 或在 Cloudflare Dashboard → Workers → Settings → Environment Variables 中配置

**Pages：**
1. Cloudflare Dashboard → Pages → 你的项目 → Settings → Environment variables
2. 生产/预览环境分别配置 `IMAGE_URLS` 和 `CORS_ALLOW_ORIGIN`

### 阿里云 ESA

因为 ESA 没有环境配置，会自动使用脚本收集 `public/images` 中的图片并生成默认列表。

## 本地开发

1. `npm i` — 安装依赖
2. `npm run dev:workers` — Workers 模式
3. `npm run dev:pages` — Pages Functions 模式
4. `npm run esa:dev` — ESA 模式 [需要安装 ESA CLI]

## 部署

- Workers：`npm run deploy:workers`
- Pages：`npm run deploy:pages`
- ESA：`npm run esa:deploy`

## 技术细节

- 配置：[esa.jsonc](esa.jsonc) / [wrangler.toml](wrangler.toml)
- 入口：`src/worker.ts`（Workers/ESA）/ `functions/*`（Pages）
- 构建：`npm run build` → `dist/worker.js`
- 静态：`./public/`（包含 `images/*.webp`）
