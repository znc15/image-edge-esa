# image-edge-esa

一个可以部署到函数或者Page的随机图床 API。


## 功能

- `GET /api/random`：直接返回随机图片（图片内容）
	- `GET /api/random?json=1`：返回随机图片信息（JSON）
	- `GET /api/random?id=xxx`：返回指定 id 的图片（图片内容）
- `GET /r`：302 重定向到随机图片（跳转到 `/images/*.webp` 路径）
- `GET /health`：健康检查（返回 JSON）
- `GET /`：展示页（静态页面）

## 配置

### 环境变量

- `IMAGE_URLS`：图片 URL 列表（逗号分隔），例如 `https://example.com/1.webp,https://example.com/2.webp` 或 `/images/1.webp,/images/2.webp`
- `CORS_ALLOW_ORIGIN`：跨域来源（默认 `*`）

### Cloudflare (Workers / Pages)

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

因为ESA没有环境配置，会自动使用脚本编译image文件夹中的所有图片。

用 `GET /health` 查看当前使用的是 `env` 还是 `default`。

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
