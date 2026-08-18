/**
 * Escritura autenticada a R2. La lectura pública va por r2.dev / CDN.
 */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    const key = new URL(request.url).pathname.replace(/^\/+/, '');
    if (!key || key.includes('..')) {
      return json(400, { error: 'invalid key' });
    }

    const auth = request.headers.get('Authorization') || '';
    if (!env.UPLOAD_SECRET || auth !== `Bearer ${env.UPLOAD_SECRET}`) {
      return json(401, { error: 'unauthorized' });
    }

    if (request.method === 'PUT') {
      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
      const cacheControl = request.headers.get('Cache-Control') || 'public, max-age=31536000, immutable';
      await env.BUCKET.put(key, request.body, {
        httpMetadata: { contentType, cacheControl },
      });
      return json(200, { ok: true, key });
    }

    if (request.method === 'DELETE') {
      await env.BUCKET.delete(key);
      return json(200, { ok: true, key });
    }

    return json(405, { error: 'method not allowed' });
  },
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Cache-Control',
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}
