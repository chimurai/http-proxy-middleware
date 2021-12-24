import { IncomingMessage, ServerResponse } from 'http';

import { responseInterceptor } from '../../src/handlers/response-interceptor';

const fakeProxyResponse = () => {
  const httpIncomingMessage = new IncomingMessage(null);
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
    const httpIncomingMessage = fakeProxyResponse();
    const response = fakeResponse();

    responseInterceptor(async () => JSON.stringify({ someField: '' }))(
      httpIncomingMessage,
      null,
      response
    );

    httpIncomingMessage.emit('end');
    await waitInterceptorHandler();

    const expectedBody = JSON.stringify({ someField: '' });
    expect(response.setHeader).toHaveBeenCalledWith('content-length', expectedBody.length);
    expect(response.write).toHaveBeenCalledWith(Buffer.from(expectedBody));
    expect(response.end).toHaveBeenCalledWith();
  });

  it('should end with error when receive a proxy error event', async () => {
    const httpIncomingMessage = fakeProxyResponse();
    const response = fakeResponse();

    responseInterceptor(async () => JSON.stringify({ someField: '' }))(
      httpIncomingMessage,
      null,
      response
    );

    httpIncomingMessage.emit('error', new Error('some error message'));

    expect(response.setHeader).not.toHaveBeenCalled();
    expect(response.write).not.toHaveBeenCalled();
    expect(response.end).toHaveBeenCalledWith('Error fetching proxied request: some error message');
  });
});
