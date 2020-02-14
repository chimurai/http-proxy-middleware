import express from 'express';
import http from 'http';
import httpProxy from 'http-proxy';
import net from 'net';

export interface IRequest extends express.Request {}
export interface IResponse extends express.Response {}

export interface IRequestHandler extends express.RequestHandler {
  upgrade?: (req: IRequest, socket: net.Socket, head: any) => void;
}

export type Filter =
  | string
  | string[]
  | ((pathname: string, req: IRequest) => boolean);

export interface Options extends httpProxy.ServerOptions {
  pathRewrite?:
    | { [regexp: string]: string }
    | ((path: string, req: IRequest) => string)
    | ((path: string, req: IRequest) => Promise<string>);
  router?:
    | { [hostOrPath: string]: string }
    | ((req: IRequest) => string)
    | ((req: IRequest) => Promise<string>);
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  logProvider?(provider: LogProvider): LogProvider;

  onError?(err: Error, req: IRequest, res: IResponse): void;
  onProxyRes?(
    proxyRes: http.ServerResponse,
    req: IRequest,
    res: IResponse
  ): void;
  onProxyReq?(
    proxyReq: http.ClientRequest,
    req: IRequest,
    res: IResponse
  ): void;
  onProxyReqWs?(
    proxyReq: http.ClientRequest,
    req: IRequest,
    socket: net.Socket,
    options: httpProxy.ServerOptions,
    head: any
  ): void;
  onOpen?(proxySocket: net.Socket): void;
  onClose?(res: IResponse, socket: net.Socket, head: any): void;
}

interface LogProvider {
  log: Logger;
  debug?: Logger;
  info?: Logger;
  warn?: Logger;
  error?: Logger;
}

type Logger = (...args: any[]) => void;
