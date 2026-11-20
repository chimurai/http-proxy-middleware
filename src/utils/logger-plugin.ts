import type { Agent } from 'node:http';

export type Sockets = Pick<Agent, 'sockets'>;

/**
 * Get port from target
 * Using proxyRes.req.agent.sockets to determine the target port
 *
 * Node's http.Agent names a connection `<host>:<port>:...` and leaves an IPv6 host
 * unbracketed (`::1:9000:`), so when the host is known, read the port right after it.
 */
export function getPort(sockets?: Sockets, host?: string): string | undefined {
  const key = Object.keys(sockets || {})?.[0];
  if (host && key?.startsWith(`${host}:`)) {
    return key.slice(host.length + 1).split(':')[0];
  }
  return key?.split(':')[1];
}
