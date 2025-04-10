import { Socket } from 'net';
import { ClientRequest, ServerResponse, IncomingMessage } from 'http';
import * as querystring from 'querystring';

import { fixRequestBody } from '../../src/handlers/fix-request-body';
import type { Request } from '../../src/types';

const fakeProxyRequest = () => {
  const proxyRequest = new ClientRequest('http://some-host');
  proxyRequest.emit = jest.fn();

  return proxyRequest;
};

const fakeProxyResponse = (): ServerResponse => {
  const res = new ServerResponse(new IncomingMessage(new Socket()));
  return res;
};

const createRequestWithBody = (body: unknown): Request => {
  const req = new IncomingMessage(new Socket()) as Request;
  req.url = '/test_path';
  req.body = body;
  return req;
};

describe('fixRequestBody', () => {
  it('should not write when body is undefined', () => {
    const proxyRequest = fakeProxyRequest();

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, createRequestWithBody(undefined));

    expect(proxyRequest.setHeader).not.toHaveBeenCalled();
    expect(proxyRequest.write).not.toHaveBeenCalled();
  });

  it('should write when body is an empty JSON object', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, createRequestWithBody({}));

    expect(proxyRequest.setHeader).toHaveBeenCalled();
    expect(proxyRequest.write).toHaveBeenCalled();
  });

  it('should write when body is not empty and Content-Type is application/json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type is application/x-www-form-urlencoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type includes application/x-www-form-urlencoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, createRequestWithBody({ someField: 'some value' }));

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should parse json and call write() once with incorrect content-type application/x-www-form-urlencoded+application/json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded+application/json');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

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
    } as Request;

    const proxyResponse = fakeProxyResponse();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    jest.spyOn(proxyRequest, 'write');
    jest.spyOn(proxyRequest, 'destroy');
    jest.spyOn(proxyResponse, 'writeHead');
    jest.spyOn(proxyResponse, 'end');

    fixRequestBody(proxyRequest, request);

    expect(proxyResponse.end).toHaveBeenCalledTimes(0);
    expect(proxyRequest.write).toHaveBeenCalledTimes(0);
    expect(proxyRequest.destroy).toHaveBeenCalledTimes(0);
  });
});
