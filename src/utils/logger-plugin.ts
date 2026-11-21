import type { ClientRequest } from 'node:http';

export type RequestWithSocketRemotePort = {
  socket?: Pick<NonNullable<ClientRequest['socket']>, 'remotePort'> | null;
};

/**
 * Returns the remote port of the request socket as a string.
 * If an agent connects through a proxy, this can be the proxy port, not the target port.
 * Returns undefined if the request, socket, or remote port is missing.
 */
export function getPort(request?: RequestWithSocketRemotePort): string | undefined {
  return request?.socket?.remotePort?.toString();
}
