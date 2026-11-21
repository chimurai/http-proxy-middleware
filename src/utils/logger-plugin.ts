import type { Agent, ClientRequest } from 'node:http';

export type RequestWithPortInfo = {
  agent?: Pick<Agent, 'sockets'> | null;
  socket?: Pick<NonNullable<ClientRequest['socket']>, 'remotePort'> | null;
};

export function getPorts(request?: RequestWithPortInfo): {
  remotePort: string | undefined;
  targetPort: string | undefined;
} {
  const sockets = request?.agent?.sockets;
  const remotePort = request?.socket?.remotePort?.toString();
  const targetPort = Object.keys(sockets || {})?.[0]
    ?.split(':')
    ?.at(-2);

  return { remotePort, targetPort };
}
