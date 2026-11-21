import type { ClientRequest } from 'node:http';

export type TargetRequest = {
  socket?: Pick<NonNullable<ClientRequest['socket']>, 'remotePort'> | null;
};

export function getPort(request?: TargetRequest): string | undefined {
  return request?.socket?.remotePort?.toString();
}
