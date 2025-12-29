import { handle } from '../../src/app';

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  url.pathname = '/api/random';
  const req = new Request(url.toString(), request);
  return handle(req, env as any);
};

export const onRequestOptions: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  url.pathname = '/api/random';
  const req = new Request(url.toString(), request);
  return handle(req, env as any);
};
