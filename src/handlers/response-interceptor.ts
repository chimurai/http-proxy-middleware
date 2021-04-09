import type * as http from 'http';
import * as zlib from 'zlib';

type Interceptor = (
  buffer: Buffer,
  proxyRes: http.IncomingMessage,
  req: http.IncomingMessage,
  res: http.ServerResponse
) => Promise<Buffer | string>;

/**
 * Intercept responses from upstream.
 * Automatically decompress (deflate, gzip, brotli).
 * Give developer the opportunity to modify intercepted Buffer and http.ServerResponse
 *
 * NOTE: must set options.selfHandleResponse=true (prevent automatic call of res.end())
 */
export function responseInterceptor(interceptor: Interceptor) {
  return async function proxyRes(
    proxyRes: http.IncomingMessage,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const originalProxyRes = proxyRes;
    let buffer = Buffer.from('', 'utf8');

    // decompress proxy response
    const _proxyRes = decompress(proxyRes, proxyRes.headers['content-encoding']);

    // concat data stream
    _proxyRes.on('data', (chunk) => (buffer = Buffer.concat([buffer, chunk])));

    _proxyRes.on('end', async () => {
      // set original content type from upstream
      res.setHeader('content-type', originalProxyRes.headers['content-type'] || '');

      // call interceptor with intercepted response (buffer)
      const interceptedBuffer = Buffer.from(await interceptor(buffer, originalProxyRes, req, res));

      // set correct content-length (with double byte character support)
      res.setHeader('content-length', Buffer.byteLength(interceptedBuffer, 'utf8'));

      res.write(interceptedBuffer);
      res.end();
    });

    _proxyRes.on('error', (error) => {
      res.end(`Error fetching proxied request: ${error.message}`);
    });
  };
}

/**
 * Streaming decompression of proxy response
 * source: https://github.com/apache/superset/blob/9773aba522e957ed9423045ca153219638a85d2f/superset-frontend/webpack.proxy-config.js#L116
 */
function decompress(proxyRes: http.IncomingMessage, contentEncoding: string) {
  let _proxyRes = proxyRes;
  let decompress;

  switch (contentEncoding) {
    case 'gzip':
      decompress = zlib.createGunzip();
      break;
    case 'br':
      decompress = zlib.createBrotliDecompress();
      break;
    case 'deflate':
      decompress = zlib.createInflate();
      break;
    default:
      break;
  }

  if (decompress) {
    _proxyRes.pipe(decompress);
    _proxyRes = decompress;
  }

  return _proxyRes;
}
