import { ClientRequest } from 'http';
import * as querystring from 'querystring';
import * as FormData from 'form-data';
import { fixRequestBody, handlerFormDataBodyData } from '../../src/handlers/fix-request-body';
import type * as express from 'express';
import type { Request } from '../../src/types';

const fakeProxyRequest = () => {
  const proxyRequest = new ClientRequest('http://some-host');
  proxyRequest.emit = jest.fn();

  return proxyRequest;
};

describe('fixRequestBody', () => {
  it('should not write when body is undefined', () => {
    const proxyRequest = fakeProxyRequest();

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, { body: undefined } as Request<express.Request>);

    expect(proxyRequest.setHeader).not.toHaveBeenCalled();
    expect(proxyRequest.write).not.toHaveBeenCalled();
  });

  it('should write when body is an empty JSON object', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, { body: {} } as Request<express.Request>);

    expect(proxyRequest.setHeader).toHaveBeenCalled();
    expect(proxyRequest.write).toHaveBeenCalled();
  });

  it('should write when body is not empty and Content-Type is application/json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, { body: { someField: 'some value' } } as Request<express.Request>);

    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type is multipart/form-data', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'multipart/form-data');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    const body = new FormData();
    body.append('someField', 'some value');

    fixRequestBody(proxyRequest, { body } as Request<express.Request>);

    const expectedBody = handlerFormDataBodyData('multipart/form-data', body);
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type includes multipart/form-data', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'multipart/form-data');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    const body = new FormData();
    body.append('someField', 'some value');

    fixRequestBody(proxyRequest, { body } as Request<express.Request>);

    const expectedBody = handlerFormDataBodyData('multipart/form-data', body);
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type is application/x-www-form-urlencoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, { body: { someField: 'some value' } } as Request<express.Request>);

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type includes application/x-www-form-urlencoded', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, { body: { someField: 'some value' } } as Request<express.Request>);

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });
});
