import { IncomingMessage } from 'http';

/**
 * {@link https://github.com/expressjs/express/issues/4854}
 */
interface ExpressLikeRequest extends IncomingMessage {
  originalUrl: string;
}

export const getUrl = (req: IncomingMessage | ExpressLikeRequest) =>
  'originalUrl' in req ? req.originalUrl : req.url;
