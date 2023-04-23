import type * as http from 'http';
import { createSession } from 'better-sse';
import * as EventSource from 'eventsource';
import * as express from 'express';
import * as getPort from 'get-port';
import { createAppWithPath, createProxyMiddleware } from './test-kit';
import { RequestHandler } from '../../src';

describe('E2E SSE proxy', () => {
  let proxyServer: http.Server;
  let targetSSEServer: http.Server;

  const targetSSEApp = express();

  targetSSEApp.get('/sse', async (req, res) => {
    const session = await createSession(req, res);

    // push 4x messages to client (stop character: Ø)
    '123Ø'.split('').forEach((val, index) => {
      setTimeout(() => {
        session.push(`Hello world! (sse message #${val})`);
      }, index * 100);
    });
  });

  let sseProxyMiddleware: RequestHandler;

  beforeEach(async () => {
    const targetSSEServerPort = await getPort();

    return new Promise((resolve: any) => {
      sseProxyMiddleware = createProxyMiddleware({
        target: `http://localhost:${targetSSEServerPort}/sse`,
      });

      targetSSEServer = targetSSEApp.listen(targetSSEServerPort, resolve);
    });
  });

  afterEach(() => {
    return Promise.all([
      new Promise((resolve) => targetSSEServer.close(resolve)),
      new Promise((resolve) => proxyServer.close(resolve)),
    ]);
  });

  it('should proxy SSE request', async () => {
    const freePort = await getPort();
    proxyServer = createAppWithPath('/sse', sseProxyMiddleware).listen(freePort);

    const sse = new EventSource(`http://localhost:${freePort}/sse`);

    async function* receiveSseMessages() {
      while (true) {
        const message: string = await new Promise((resolve, reject) => {
          sse.addEventListener('message', ({ data }) => resolve(data));
          sse.addEventListener('error', (err) => reject(err));
        });

        yield message;

        // stop generator
        if (message.includes('#Ø')) {
          return;
        }
      }
    }

    const receivedMessages: string[] = [];

    for await (const message of receiveSseMessages()) {
      receivedMessages.push(message);
    }

    expect(receivedMessages).toMatchInlineSnapshot(`
      [
        ""Hello world! (sse message #1)"",
        ""Hello world! (sse message #2)"",
        ""Hello world! (sse message #3)"",
        ""Hello world! (sse message #Ø)"",
      ]
    `);

    sse.close();
  });
});
