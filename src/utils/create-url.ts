import { URL } from 'url';

type CreateUrlParams = {
  protocol?: string;
  host?: string;
  port?: string;
  path?: string;
};

export function createUrl({ protocol, host, port, path }: CreateUrlParams): URL {
  // wrap IPv6 host in brackets
  const ipv6Host = host?.includes(':') ? `[${host}]` : host;

  // use fallback values to create a valid URL (protocol: 'undefined:', host: '[::]')
  // nock v13 issue: protocol and host are undefined (https://github.com/chimurai/http-proxy-middleware/issues/1035)
  // nock v14+ seems to return protocol and host correctly
  const base = `${protocol || 'undefined:'}//${ipv6Host || '[::]'}`;
  const url = new URL(base);

  if (port) {
    url.port = port;
  }

  if (path) {
    url.pathname = path;
  }
  return url;
}
