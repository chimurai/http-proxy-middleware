import type { ClientRequest } from 'node:http';
import * as querystring from 'node:querystring';
import * as zlib from 'node:zlib';

import { describe, expect, it } from 'vitest';

import type { BodyParserLikeRequest } from '../../src/handlers/fix-request-body.js';
import { fixRequestBody } from '../../src/handlers/fix-request-body.js';
import { createMockRequest, createMockResponse, createMockClientRequest } from '../test-utils.js';

const fakeProxyRequest = (): ClientRequest => {
  return createMockClientRequest('http://some-host');
};

const createRequestWithBody = (body: unknown): BodyParserLikeRequest => {
  return createMockRequest({
    url: '/test_path',
    body: body,
  } as BodyParserLikeRequest);
};

const handlerFormDataBodyData = (contentType: string, data: { [key: string]: any }) => {
  const boundary = contentType.replace(/^.*boundary=(.*)$/, '$1');
  let str = '';
  for (const [key, value] of Object.entries(data)) {
    str += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
  }
  return str;
};

describe('fixRequestBody', () => {
  it('should not write when body is undefined', () => {
    const proxyRequest = fakeProxyRequest();

    fixRequestBody(proxyRequest, createRequestWithBody(undefined));

    expect(proxyRequest.setHeader).not.toHaveBeenCalled();
    expect(proxyRequest.write).not.toHaveBeenCalled();
  });

  it('should write when body is an empty JSON object', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    fixRequestBody(proxyRequest, createRequestWithBody({}));

    expect(proxyRequest.setHeader).toHaveBeenCalled();
    expect(proxyRequest.write).toHaveBeenCalled();
  });

  it('should write when body is not empty and Content-Type is text/plain', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'text/plain; charset=utf-8');

    fixRequestBody(proxyRequest, createRequestWithBody('some string'));

    const expectedBody = 'some string';
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type is application/json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type is multipart/form-data', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'multipart/form-data');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = handlerFormDataBodyData('multipart/form-data', {
      someField: 'some value',
    });

    expect(expectedBody).toMatchInlineSnapshot(`
      "--multipart/form-data
      Content-Disposition: form-data; name="someField"

      some value
      "
    `);
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type includes multipart/form-data', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'multipart/form-data');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = handlerFormDataBodyData('multipart/form-data', {
      someField: 'some value',
    });

    expect(expectedBody).toMatchInlineSnapshot(`
      "--multipart/form-data
      Content-Disposition: form-data; name="someField"

      some value
      "
    `);

    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type ends with +json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/merge-patch+json; charset=utf-8');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));
    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type is application/x-www-form-urlencoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type includes application/x-www-form-urlencoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should parse json and call write() once with incorrect content-type application/x-www-form-urlencoded+json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded+json');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledTimes(1);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should not fixRequestBody() when there bodyParser fails', () => {
    const proxyRequest = fakeProxyRequest();
    const request = {
      get readableLength() {
        return 4444; // simulate bodyParser failure
      },
    } as BodyParserLikeRequest;

    const proxyResponse = createMockResponse();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    fixRequestBody(proxyRequest, request);

    expect(proxyResponse.end).toHaveBeenCalledTimes(0);
    expect(proxyRequest.write).toHaveBeenCalledTimes(0);
    expect(proxyRequest.destroy).toHaveBeenCalledTimes(0);
  });

  it('should re-encode body when the source was encoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');
    proxyRequest.setHeader('content-encoding', 'gzip');

    const data = { someField: 'some value' };
    fixRequestBody(proxyRequest, createRequestWithBody(data));

    const expectedBody = zlib.gzipSync(JSON.stringify(data));
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });
});
