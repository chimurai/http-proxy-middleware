import { getPort, type Sockets } from '../../../src/utils/logger-plugin';

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
});
