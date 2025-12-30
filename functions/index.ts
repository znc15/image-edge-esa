export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  url.pathname = '/index.html';
  return Response.redirect(url.toString(), 302);
};

export const onRequestOptions: PagesFunction = async ({ request, env }) => {
  return new Response(null, { status: 204 });
};
