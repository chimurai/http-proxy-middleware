import { Socket } from 'net';
import { ClientRequest, IncomingMessage } from 'http';
import * as querystring from 'querystring';
import { fixRequestBody, BodyParserLikeRequest } from '../../src/handlers/fix-request-body';

const fakeProxyRequest = (): ClientRequest => {
  const proxyRequest = new ClientRequest('http://some-host');
  proxyRequest.emit = jest.fn();

  return proxyRequest;
};

const createRequestWithBody = (body: unknown): BodyParserLikeRequest => {
  const req = new IncomingMessage(new Socket()) as BodyParserLikeRequest;
  req.body = body;
  return req;
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

  it('should write when body is not empty and Content-Type is multipart/form-data', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'multipart/form-data');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

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

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

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
});
