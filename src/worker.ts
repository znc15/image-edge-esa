import { handle, type AppEnv } from './app';

type Env = AppEnv & {
  ASSETS?: Fetcher;
};

function isApiPath(pathname: string): boolean {
  return pathname === '/health' || pathname === '/r' || pathname === '/api/random';
}

async function tryServeAsset(req: Request, env: Env): Promise<Response | null> {
  if (!env.ASSETS) return null;
  const method = req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return null;

  const url = new URL(req.url);
  if (isApiPath(url.pathname)) return null;

  if (url.pathname === '/') {
    url.pathname = '/index.html';
    const rewritten = new Request(url.toString(), req);
    const resp = await env.ASSETS.fetch(rewritten);
    return resp.status === 404 ? null : resp;
  }

  const resp = await env.ASSETS.fetch(req);
  return resp.status === 404 ? null : resp;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const asset = await tryServeAsset(req, env);
    if (asset) return asset;
    return handle(req, env);
  }
} satisfies ExportedHandler<Env>;
