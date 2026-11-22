import { parseAgentName } from './parse-agent-name.js';

export type RequestWithPortInfo = {
  agent?: { sockets?: unknown } | null;
  socket?: object | null;
};

export function getPorts(request?: RequestWithPortInfo): {
  targetPort: string | undefined;
} {
  let targetPort: string | undefined;
  const sockets = request?.agent?.sockets;

  if (request?.socket && sockets && typeof sockets === 'object') {
    for (const [name, agentSockets] of Object.entries(sockets)) {
      if (Array.isArray(agentSockets) && agentSockets.includes(request.socket)) {
        targetPort = parseAgentName(name).port;
        break;
      }
    }
  }

  return { targetPort };
}
