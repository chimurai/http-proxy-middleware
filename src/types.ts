import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as net from 'net';

export interface Request extends http.IncomingMessage {
  originalUrl?: string; // in case express, connect
  hostname?: string; // in case express
  host?: string; // in case express
}
export interface Response extends http.ServerResponse {}

export interface RequestHandler<
  Request extends http.IncomingMessage = http.IncomingMessage,
  Response extends http.ServerResponse = http.ServerResponse
> {
  (request: Request, response: Response, next?: (err: any) => void): void;
  upgrade?: (req: Request, socket: net.Socket, head: any) => void;
}

export type Filter<Request extends http.IncomingMessage = http.IncomingMessage> =
  | string
  | string[]
  | ((pathname: string, req: Request) => boolean);

export interface Options<
  Request extends http.IncomingMessage = http.IncomingMessage,
  Response extends http.ServerResponse = http.ServerResponse
> extends httpProxy.ServerOptions {
  pathRewrite?:
    | { [regexp: string]: string }
    | ((path: string, req: Request) => string)
    | ((path: string, req: Request) => Promise<string>);
  router?:
    | { [hostOrPath: string]: httpProxy.ServerOptions['target'] }
    | ((req: Request) => httpProxy.ServerOptions['target'])
    | ((req: Request) => Promise<httpProxy.ServerOptions['target']>);
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  logProvider?(provider: LogProvider): LogProvider;

  onError?(err: Error, req: Request, res: Response): void;
  onProxyRes?(proxyRes: http.IncomingMessage, req: Request, res: Response): void;
  onProxyReq?(proxyReq: http.ClientRequest, req: Request, res: Response): void;
  onProxyReqWs?(
    proxyReq: http.ClientRequest,
    req: Request,
    socket: net.Socket,
    options: httpProxy.ServerOptions,
    head: any
  ): void;
  onOpen?(proxySocket: net.Socket): void;
  onClose?(res: Response, socket: net.Socket, head: any): void;
}

interface LogProvider {
  log: Logger;
  debug?: Logger;
  info?: Logger;
  warn?: Logger;
  error?: Logger;
}

type Logger = (...args: any[]) => void;
