/**
 * Cloudflare Worker for Shrutdhara PDF Streaming Proxy
 * Routes https://shrutdhara.com/pdf-proxy/:filename -> GitHub Release asset
 * Adds Access-Control-Allow-Origin: * and Content-Disposition: inline
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const prefix = '/pdf-proxy/';
    if (!url.pathname.startsWith(prefix)) {
      return new Response('Not Found', { status: 404 });
    }

    const filename = url.pathname.slice(prefix.length);
    if (!filename) {
      return new Response('Missing filename', { status: 400 });
    }

    const targetUrl = `https://github.com/alphanout/shrutdhara/releases/download/v1.0-shastras/${encodeURIComponent(filename)}`;

    // Follow redirects to GitHub Azure Blob CDN
    const response = await fetch(targetUrl, {
      headers: request.headers,
      redirect: 'follow',
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    newHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    newHeaders.set('Content-Disposition', `inline; filename="${filename}"`);
    newHeaders.set('Content-Type', 'application/pdf');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
