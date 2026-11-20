import { describe, expect, it } from 'vitest';

import { type Sockets, getPort } from '../../../src/utils/logger-plugin.js';

describe('getPort()', () => {
  it('should return port from proxyRes.req.agent.sockets', () => {
    const sockets = {
      'jsonplaceholder.typicode.com:80:': [],
    } as unknown as Sockets;

    expect(getPort(sockets)).toBe('80');
  });

  it('should handle missing "sockets" from proxyRes?.req?.agent?.sockets', () => {
    const sockets = undefined;

    expect(getPort(sockets)).toBe(undefined);
  });

  it('should handle empty "sockets" from proxyRes?.req?.agent?.sockets', () => {
    const sockets = {} as unknown as Sockets;

    expect(getPort(sockets)).toBe(undefined);
  });

  it('should return port for an IPv6 host', () => {
    // Node's http.Agent leaves the IPv6 host unbracketed in its sockets key
    const sockets = {
      '::1:9000:': [],
    } as unknown as Sockets;

    expect(getPort(sockets, '::1')).toBe('9000');
  });

  it('should return port for an IPv6 host with more fields after the port', () => {
    // https.Agent adds its TLS options to the key
    const sockets = {
      '::1:8443:::::::::example.com::::::::::::': [],
    } as unknown as Sockets;

    expect(getPort(sockets, '::1')).toBe('8443');
  });

  it('should return port for a host with more fields after the port', () => {
    const sockets = {
      'localhost:9000:127.0.0.1': [],
    } as unknown as Sockets;

    expect(getPort(sockets, 'localhost')).toBe('9000');
  });
});
