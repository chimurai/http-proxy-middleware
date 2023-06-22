import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

import { responseInterceptor } from '../../src/handlers/response-interceptor';

const fakeProxyResponse = () => {
  const httpIncomingMessage = new IncomingMessage(new Socket());
  httpIncomingMessage._read = () => ({});
  return httpIncomingMessage;
};

const fakeResponse = () => {
  const httpIncomingMessage = fakeProxyResponse();

  const response = new ServerResponse(httpIncomingMessage);
  response.setHeader = jest.fn();
  response.write = jest.fn();
  response.end = jest.fn();

  return response;
};

const waitInterceptorHandler = (ms = 1): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('responseInterceptor', () => {
  it('should write body on end proxy event', async () => {
    const proxyRes = fakeProxyResponse();
    const req = fakeProxyResponse();
    const res = fakeResponse();

    responseInterceptor(async () => JSON.stringify({ someField: '' }))(proxyRes, req, res);

    proxyRes.emit('end');
    await waitInterceptorHandler();

    const expectedBody = JSON.stringify({ someField: '' });
    expect(res.setHeader).toHaveBeenCalledWith('content-length', expectedBody.length);
    expect(res.write).toHaveBeenCalledWith(Buffer.from(expectedBody));
    expect(res.end).toHaveBeenCalledWith();
  });

  it('should end with error when receive a proxy error event', async () => {
    const proxyRes = fakeProxyResponse();
    const req = fakeProxyResponse();
    const res = fakeResponse();

    responseInterceptor(async () => JSON.stringify({ someField: '' }))(proxyRes, req, res);

    proxyRes.emit('error', new Error('some error message'));

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith('Error fetching proxied request: some error message');
  });
});
