import { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';

import { vi } from 'vitest';

export function createMockRequest(options: Partial<IncomingMessage> = {}): IncomingMessage {
  const req = new IncomingMessage(new Socket());
  Object.assign(req, options);

  return req;
}

export function createMockResponse(request = createMockRequest()): ServerResponse {
  const response = new ServerResponse(request);

  vi.spyOn(response, 'setHeader');
  vi.spyOn(response, 'writeHead');
  vi.spyOn(response, 'write');
  vi.spyOn(response, 'end');

  return response;
}

export function createMockClientRequest(
  ...args: ConstructorParameters<typeof ClientRequest>
): ClientRequest {
  const clientRequest = new ClientRequest(...args);

  clientRequest.emit = vi.fn();

  vi.spyOn(clientRequest, 'setHeader');
  vi.spyOn(clientRequest, 'write');
  vi.spyOn(clientRequest, 'destroy');

  return clientRequest;
}
