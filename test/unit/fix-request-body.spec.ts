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

describe('fixRequestBody', () => {
  it('should not write when body is undefined', () => {
    const proxyRequest = fakeProxyRequest();

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, { body: undefined } as Request, fakeProxyResponse());

    expect(proxyRequest.setHeader).not.toHaveBeenCalled();
    expect(proxyRequest.write).not.toHaveBeenCalled();
  });

  it('should write when body is an empty JSON object', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, { body: {} } as Request, fakeProxyResponse());

    expect(proxyRequest.setHeader).toHaveBeenCalled();
    expect(proxyRequest.write).toHaveBeenCalled();
  });

  it('should write when body is not empty and Content-Type is application/json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(
      proxyRequest,
      { body: { someField: 'some value' } } as Request,
      fakeProxyResponse()
    );

    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type is application/x-www-form-urlencoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(
      proxyRequest,
      { body: { someField: 'some value' } } as Request,
      fakeProxyResponse()
    );

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type includes application/x-www-form-urlencoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(
      proxyRequest,
      { body: { someField: 'some value' } } as Request,
      fakeProxyResponse()
    );

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should parse json and call write() once with incorrect content-type application/x-www-form-urlencoded+application/json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded+application/json');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(
      proxyRequest,
      { body: { someField: 'some value' } } as Request,
      fakeProxyResponse()
    );

    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledTimes(1);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should return 400 and abort request on "Connection: Upgrade" header', () => {
    const proxyRequest = fakeProxyRequest();
    const request = { body: { someField: 'some value' } } as Request;

    proxyRequest.destroy = jest.fn();
    request.destroy = jest.fn();

    const proxyResponse = fakeProxyResponse();
    proxyRequest.setHeader('connection', 'upgrade');
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    jest.spyOn(proxyRequest, 'destroy');
    jest.spyOn(request, 'destroy');
    jest.spyOn(proxyResponse, 'writeHead');
    jest.spyOn(proxyResponse, 'end');

    fixRequestBody(proxyRequest, request, proxyResponse);

    expect(proxyResponse.writeHead).toHaveBeenCalledWith(400);
    expect(proxyResponse.end).toHaveBeenCalledTimes(1);
    expect(proxyRequest.destroy).toHaveBeenCalledTimes(1);
    expect(request.destroy).toHaveBeenCalledTimes(1);
  });

  it('should return 400 and abort request on invalid request data', () => {
    const proxyRequest = fakeProxyRequest();
    const request = { body: { 'INVALID \n\r DATA': '' } } as Request;

    proxyRequest.destroy = jest.fn();
    request.destroy = jest.fn();

    const proxyResponse = fakeProxyResponse();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    jest.spyOn(proxyRequest, 'destroy');
    jest.spyOn(request, 'destroy');
    jest.spyOn(proxyResponse, 'writeHead');
    jest.spyOn(proxyResponse, 'end');

    fixRequestBody(proxyRequest, request, proxyResponse);

    expect(proxyResponse.writeHead).toHaveBeenCalledWith(400);
    expect(proxyResponse.end).toHaveBeenCalledTimes(1);
    expect(proxyRequest.destroy).toHaveBeenCalledTimes(1);
    expect(request.destroy).toHaveBeenCalledTimes(1);
  });
});
