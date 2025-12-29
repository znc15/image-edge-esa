import { json, isPreflight, preflight, withCors } from './shared/http';
import { parseImageUrls, pickRandom } from './shared/random';
import { DEFAULT_IMAGE_URLS } from './generated/imageUrls';

export type AppEnv = {
  IMAGE_URLS?: string;
  CORS_ALLOW_ORIGIN?: string;
};

function getFilename(pathname: string): string {
  const idx = pathname.lastIndexOf('/');
  return idx >= 0 ? pathname.slice(idx + 1) : pathname;
}

function stripExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.slice(0, idx) : filename;
}

function resolveToAbsoluteUrl(requestUrl: URL, urlOrPath: string): URL {
  return new URL(urlOrPath, requestUrl.origin);
}

type PickedWithId = { url: string; index: number; total: number; id: string };

function pickById(urls: string[], idRaw: string | null, requestUrl: URL): PickedWithId {
  const total = urls.length;
  if (total <= 0) {
    throw new Error('No image URLs configured');
  }

  if (!idRaw) {
    const picked = pickRandom(urls, Math.random());
    return { ...picked, id: String(picked.index + 1) };
  }

  const id = idRaw.trim();
  if (!id) {
    const picked = pickRandom(urls, Math.random());
    return { ...picked, id: String(picked.index + 1) };
  }

  const idLower = id.toLowerCase();

  for (let i = 0; i < total; i++) {
    const u = urls[i];
    const abs = resolveToAbsoluteUrl(requestUrl, u);
    const filename = getFilename(abs.pathname).toLowerCase();
    if (filename === idLower) {
      return { url: u, index: i, total, id: stripExtension(filename) };
    }
  }


  for (let i = 0; i < total; i++) {
    const u = urls[i];
    const abs = resolveToAbsoluteUrl(requestUrl, u);
    const filename = getFilename(abs.pathname);
    const base = stripExtension(filename).toLowerCase();
    if (base === idLower) {
      return { url: u, index: i, total, id: stripExtension(filename) };
    }
  }

  const asNumber = Number(id);
  if (Number.isInteger(asNumber)) {
    if (asNumber >= 0 && asNumber < total) {
      return { url: urls[asNumber], index: asNumber, total, id: String(asNumber + 1) };
    }
    if (asNumber >= 1 && asNumber <= total) {
      const index = asNumber - 1;
      return { url: urls[index], index, total, id: String(asNumber) };
    }
  }

  throw new Error('Invalid id');
}

function cacheHeaders(mode: 'short' | 'no-store' = 'short'): HeadersInit {
  if (mode === 'no-store') return { 'cache-control': 'no-store' };
  return { 'cache-control': 'public, max-age=60' };
}

export async function handle(req: Request, env: AppEnv): Promise<Response> {
  const url = new URL(req.url);
  const allowOrigin = env.CORS_ALLOW_ORIGIN ?? '*';
  const method = req.method.toUpperCase();

  const toHead = (resp: Response): Response => {
    return new Response(null, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers
    });
  };

  if (isPreflight(req)) {
    return preflight(allowOrigin);
  }

  if (method !== 'GET' && method !== 'HEAD') {
    return withCors(json({ error: 'Method Not Allowed' }, { status: 405 }), allowOrigin);
  }

  const envUrls = parseImageUrls(env.IMAGE_URLS);
  const imageUrls = envUrls.length > 0 ? envUrls : DEFAULT_IMAGE_URLS;
  const configuredSource = envUrls.length > 0 ? 'env' : 'generated';

  if (url.pathname === '/' || url.pathname === '/health') {
    const resp = withCors(
      json(
        {
          ok: true,
          endpoints: {
            json: '/api/random',
            redirect: '/r'
          },
          configured: {
            total: imageUrls.length,
            source: configuredSource
          }
        },
        { headers: cacheHeaders('short') }
      ),
      allowOrigin
    );
    return method === 'HEAD' ? toHead(resp) : resp;
  }

  if (url.pathname === '/api/random') {
    const wantsJson = url.searchParams.has('json') || url.searchParams.get('format') === 'json';
    const idParam = url.searchParams.get('id');
    const isDeterministic = !!(idParam && idParam.trim());
    const cacheMode: 'short' | 'no-store' = isDeterministic ? 'short' : 'no-store';

    try {
      const picked = pickById(imageUrls, idParam, url);

      if (wantsJson) {
        const resp = withCors(
          json(
            {
              url: picked.url,
              id: picked.id,
              index: picked.index,
              total: picked.total,
              source: configuredSource
            },
            { headers: cacheHeaders(cacheMode) }
          ),
          allowOrigin
        );
        return method === 'HEAD' ? toHead(resp) : resp;
      }

      const absolute = resolveToAbsoluteUrl(url, picked.url);
      const headers = new Headers(cacheHeaders(cacheMode));
      headers.set('location', absolute.toString());
      return withCors(new Response(null, { status: 302, headers }), allowOrigin);
    } catch (e) {
      const isInvalidId = e instanceof Error && e.message === 'Invalid id';
      const isNotConfigured = e instanceof Error && e.message === 'No image URLs configured';
      const resp = withCors(
        json(
          isInvalidId
            ? {
                error: 'Invalid id',
                hint: 'Use /api/random?id=xxx where xxx matches a filename (without extension) or an index.'
              }
            : isNotConfigured
            ? {
                error: 'No image URLs configured',
                hint: 'Put .webp files into public/images and run `npm run build`, or set env var IMAGE_URLS to a comma-separated list of image URLs.'
              }
            : {
                error: 'IMAGE_URLS not configured',
                hint: 'Set env var IMAGE_URLS to a comma-separated list of image URLs, or use public/images + generated defaults.'
              },
          { status: isInvalidId ? 404 : 500, headers: cacheHeaders('no-store') }
        ),
        allowOrigin
      );
      return method === 'HEAD' ? toHead(resp) : resp;
    }
  }

  if (url.pathname === '/r') {
    try {
      const picked = pickById(imageUrls, null, url);
      const headers = new Headers(cacheHeaders('no-store'));
      headers.set('location', resolveToAbsoluteUrl(url, picked.url).toString());
      return withCors(new Response(null, { status: 302, headers }), allowOrigin);
    } catch (e) {
      const isNotConfigured = e instanceof Error && e.message === 'No image URLs configured';
      const resp = json(
        isNotConfigured
          ? {
              error: 'No image URLs configured',
              hint: 'Put .webp files into public/images and run `npm run build`, or set env var IMAGE_URLS to a comma-separated list of image URLs.'
            }
          : {
              error: 'IMAGE_URLS not configured',
              hint: 'Set env var IMAGE_URLS to a comma-separated list of image URLs, or use public/images + generated defaults.'
            },
        { status: 500, headers: cacheHeaders('no-store') }
      );
      return method === 'HEAD' ? toHead(resp) : resp;
    }
  }

  return withCors(json({ error: 'Not Found' }, { status: 404 }), allowOrigin);
}
