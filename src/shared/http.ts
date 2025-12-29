export function json(
  data: unknown,
  init: ResponseInit & { headers?: HeadersInit } = {}
): Response {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8');
  }
  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function withCors(resp: Response, allowOrigin: string): Response {
  const headers = new Headers(resp.headers);
  headers.set('access-control-allow-origin', allowOrigin);
  headers.set('access-control-allow-methods', 'GET,HEAD,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  const existingExpose = headers.get('access-control-expose-headers');
  if (existingExpose) {
    if (!existingExpose.toLowerCase().split(',').map((s) => s.trim()).includes('location')) {
      headers.set('access-control-expose-headers', `${existingExpose}, location`);
    }
  } else {
    headers.set('access-control-expose-headers', 'location');
  }
  headers.set('vary', 'Origin');
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers
  });
}

export function isPreflight(req: Request): boolean {
  return req.method.toUpperCase() === 'OPTIONS';
}

export function preflight(allowOrigin: string): Response {
  return withCors(new Response(null, { status: 204 }), allowOrigin);
}
