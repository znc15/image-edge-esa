# Image Api for Aliyun ESA / Cloudflare Workers / Pages / EdgeOne Pages

一个可以部署到函数或者Page的随机图床 API。
支持 Aliyun ESA、Cloudflare Workers、Cloudflare Pages Functions，以及 EdgeOne Pages（静态托管/构建/环境变量）。

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

部署到 Cloudflare 时：

- 默认图片列表来自构建生成（`scripts/generate-image-urls.mjs` → `src/generated/imageUrls.ts`），不需要手动维护图片 URL
- 如需使用外部图床/自定义来源，可选配置 `IMAGE_URLS` 来覆盖默认列表

**Workers（部署）：**
1. 可选：在 Cloudflare Dashboard → Workers → Settings → Environment Variables 配置 `IMAGE_URLS`、`CORS_ALLOW_ORIGIN`
2. 部署：`npm run deploy:workers`

**Pages（部署）：**
1. 将仓库连接到 Cloudflare Pages 并设置构建：
   - Build command：`npm run build`
   - Output directory：`public`
2. 可选：Cloudflare Dashboard → Pages → 你的项目 → Settings → Environment variables 配置 `IMAGE_URLS`、`CORS_ALLOW_ORIGIN`
3. 或直接部署（需要已登录/绑定）：`npm run deploy:pages`

### EdgeOne Pages

部署到 EdgeOne Pages 时：

- 静态输出目录使用 `public`（包含展示页 `index.html` 和 `images/*.webp`）
- 默认图片列表同样来自构建生成（`scripts/generate-image-urls.mjs` → `src/generated/imageUrls.ts`）
- 如需使用外部图床/自定义来源，可在项目环境变量中配置 `IMAGE_URLS` 覆盖默认列表

**Pages（部署）：**
1. 在 EdgeOne Pages 控制台创建项目并导入仓库
2. 配置构建（项目设置 → 构建部署配置）：
	- Root directory：`./`
	- Build command：`npm run build`
	- Output directory：`public`
	- Node.js 版本：选择 `18` 或更高（本项目要求 Node >= 18）
3. 可选：项目设置 → 环境变量 配置 `IMAGE_URLS`、`CORS_ALLOW_ORIGIN`

> 说明：本仓库的 `functions/*` 目录为 Cloudflare Pages Functions 的结构；EdgeOne Pages 的函数能力（Pages Functions/Edge Functions）需要按其平台规范单独适配。

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
- EdgeOne Pages：在控制台导入仓库并按“EdgeOne Pages”小节配置构建/输出

## 技术细节

- 配置：[esa.jsonc](esa.jsonc) / [wrangler.toml](wrangler.toml)
- 入口：`src/worker.ts`（Workers/ESA）/ `functions/*`（Pages）
- 构建：`npm run build` → `dist/worker.js`
- 静态：`./public/`（包含 `images/*.webp`）
