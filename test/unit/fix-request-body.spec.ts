import { Socket } from 'net';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http';
import * as querystring from 'querystring';
import { fixRequestBody, BodyParserLikeRequest } from '../../src/handlers/fix-request-body';

const fakeProxyRequest = (): ClientRequest => {
  const proxyRequest = new ClientRequest('http://some-host');
  proxyRequest.emit = jest.fn();

  return proxyRequest;
};

const fakeProxyResponse = (): ServerResponse<IncomingMessage> => {
  const res = new ServerResponse(new IncomingMessage(new Socket()));
  return res;
};

const createRequestWithBody = (body: unknown): BodyParserLikeRequest => {
  const req = new IncomingMessage(new Socket()) as BodyParserLikeRequest;
  req.url = '/test_path';
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

    fixRequestBody(proxyRequest, createRequestWithBody(undefined), fakeProxyResponse(), {});

    expect(proxyRequest.setHeader).not.toHaveBeenCalled();
    expect(proxyRequest.write).not.toHaveBeenCalled();
  });

  it('should write when body is an empty JSON object', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/json; charset=utf-8');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(proxyRequest, createRequestWithBody({}), fakeProxyResponse(), {});

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
      createRequestWithBody({ someField: 'some value' }),
      fakeProxyResponse(),
      {},
    );

    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should write when body is not empty and Content-Type is multipart/form-data', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'multipart/form-data');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(
      proxyRequest,
      createRequestWithBody({ someField: 'some value' }),
      fakeProxyResponse(),
      {},
    );

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

    fixRequestBody(
      proxyRequest,
      createRequestWithBody({ someField: 'some value' }),
      fakeProxyResponse(),
      {},
    );

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

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(
      proxyRequest,
      createRequestWithBody({ someField: 'some value' }),
      fakeProxyResponse(),
      {},
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
      createRequestWithBody({ someField: 'some value' }),
      fakeProxyResponse(),
      {},
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
      createRequestWithBody({ someField: 'some value' }),
      fakeProxyResponse(),
      {},
    );

    const expectedBody = querystring.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should parse json and call write() once with incorrect content-type application/x-www-form-urlencoded+json', () => {
    const proxyRequest = fakeProxyRequest();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded+json');

    jest.spyOn(proxyRequest, 'setHeader');
    jest.spyOn(proxyRequest, 'write');

    fixRequestBody(
      proxyRequest,
      createRequestWithBody({ someField: 'some value' }),
      fakeProxyResponse(),
      {},
    );

    const expectedBody = JSON.stringify({ someField: 'some value' });
    expect(proxyRequest.setHeader).toHaveBeenCalledWith('Content-Length', expectedBody.length);
    expect(proxyRequest.write).toHaveBeenCalledTimes(1);
    expect(proxyRequest.write).toHaveBeenCalledWith(expectedBody);
  });

  it('should return 400 and abort request on "Connection: Upgrade" header', () => {
    const proxyRequest = fakeProxyRequest();
    const request = createRequestWithBody({ someField: 'some value' });
    const proxyResponse = fakeProxyResponse();
    proxyRequest.setHeader('connection', 'upgrade');
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    jest.spyOn(proxyRequest, 'destroy');
    jest.spyOn(request, 'destroy');
    jest.spyOn(proxyResponse, 'writeHead');
    jest.spyOn(proxyResponse, 'end');

    const logger = {
      error: jest.fn(),
    };

    fixRequestBody(proxyRequest, request, proxyResponse, { logger });

    expect(proxyResponse.writeHead).toHaveBeenCalledWith(400);
    expect(proxyResponse.end).toHaveBeenCalledTimes(1);
    expect(proxyRequest.destroy).toHaveBeenCalledTimes(1);
    expect(request.destroy).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      `[HPM] HPM_UNEXPECTED_CONNECTION_UPGRADE_HEADER. Aborted request: /test_path`,
    );
  });

  it('should return 400 and abort request on invalid request data', () => {
    const proxyRequest = fakeProxyRequest();
    const request = createRequestWithBody({ 'INVALID \n\r DATA': '' });
    const proxyResponse = fakeProxyResponse();
    proxyRequest.setHeader('content-type', 'application/x-www-form-urlencoded');

    jest.spyOn(proxyRequest, 'destroy');
    jest.spyOn(request, 'destroy');
    jest.spyOn(proxyResponse, 'writeHead');
    jest.spyOn(proxyResponse, 'end');

    const logger = {
      error: jest.fn(),
    };

    fixRequestBody(proxyRequest, request, proxyResponse, { logger });

    expect(proxyResponse.writeHead).toHaveBeenCalledWith(400);
    expect(proxyResponse.end).toHaveBeenCalledTimes(1);
    expect(proxyRequest.destroy).toHaveBeenCalledTimes(1);
    expect(request.destroy).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      `[HPM] HPM_INVALID_REQUEST_DATA. Aborted request: /test_path`,
    );
  });
});
