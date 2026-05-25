import { describe, expect, it, vi } from 'vitest';

import { responseInterceptor } from '../../src/handlers/response-interceptor.js';
import { createMockRequest, createMockResponse } from '../test-utils.js';

const waitInterceptorHandler = (ms = 1): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('responseInterceptor', () => {
  it('should write body on end proxy event', async () => {
    const proxyRes = createMockRequest();
    const req = createMockRequest();
    const res = createMockResponse();

    responseInterceptor(async () => JSON.stringify({ someField: '' }))(proxyRes, req, res);

    proxyRes.emit('end');
    await waitInterceptorHandler();

    const expectedBody = JSON.stringify({ someField: '' });
    expect(res.setHeader).toHaveBeenCalledWith('content-length', expectedBody.length);
    expect(res.write).toHaveBeenCalledWith(Buffer.from(expectedBody));
    expect(res.end).toHaveBeenCalledWith();
  });

  it('should combine proxy response chunks before calling interceptor', async () => {
    const proxyRes = createMockRequest();
    const req = createMockRequest();
    const res = createMockResponse();

    responseInterceptor(async (buffer) => {
      expect(buffer).toEqual(Buffer.from('HPM'));
      return buffer;
    })(proxyRes, req, res);

    proxyRes.emit('data', Buffer.from('H'));
    proxyRes.emit('data', Buffer.from('P'));
    proxyRes.emit('data', Buffer.from('M'));
    proxyRes.emit('end');
    await waitInterceptorHandler();

    expect(res.setHeader).toHaveBeenCalledWith('content-length', 'HPM'.length);
    expect(res.write).toHaveBeenCalledWith(Buffer.from('HPM'));
    expect(res.end).toHaveBeenCalledWith();
  });

  it('should combine string proxy response chunks before calling interceptor', async () => {
    const proxyRes = createMockRequest();
    const req = createMockRequest();
    const res = createMockResponse();

    responseInterceptor(async (buffer) => {
      expect(buffer).toEqual(Buffer.from('HPM'));
      return buffer;
    })(proxyRes, req, res);

    proxyRes.emit('data', 'H');
    proxyRes.emit('data', 'P');
    proxyRes.emit('data', 'M');
    proxyRes.emit('end');
    await waitInterceptorHandler();

    expect(res.setHeader).toHaveBeenCalledWith('content-length', 'HPM'.length);
    expect(res.write).toHaveBeenCalledWith(Buffer.from('HPM'));
    expect(res.end).toHaveBeenCalledWith();
  });

  it('should end with error when receive a proxy error event', async () => {
    const proxyRes = createMockRequest();
    const req = createMockRequest();
    const res = createMockResponse();

    responseInterceptor(async () => JSON.stringify({ someField: '' }))(proxyRes, req, res);

    proxyRes.emit('error', new Error('some error message'));

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith('Error fetching proxied request: some error message');
  });

  it('should not write response body for HEAD requests', async () => {
    const proxyRes = createMockRequest({
      statusCode: 200,
      headers: {
        'content-encoding': 'gzip',
      },
    });
    const req = createMockRequest({ method: 'HEAD' });
    const res = createMockResponse();
    const interceptor = vi.fn(async (buffer: Buffer) => buffer);

    responseInterceptor(interceptor)(proxyRes, req, res);

    proxyRes.emit('data', Buffer.from('HPM'));
    proxyRes.emit('end');
    await waitInterceptorHandler();

    expect(interceptor).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith();
  });

  it('should not write response body for informational responses', async () => {
    const proxyRes = createMockRequest({
      statusCode: 103,
      headers: {
        'content-encoding': 'gzip',
      },
    });
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    const interceptor = vi.fn(async (buffer: Buffer) => buffer);

    responseInterceptor(interceptor)(proxyRes, req, res);

    proxyRes.emit('data', Buffer.from('HPM'));
    proxyRes.emit('end');
    await waitInterceptorHandler();

    expect(interceptor).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith();
  });
});
