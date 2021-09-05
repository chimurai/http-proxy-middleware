import { Request } from '../types';

export async function cacheRequestBody(req: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers = [];
    req.on('data', (chunk) => buffers.push(chunk));
    req.on('end', () => resolve(Buffer.concat(buffers)));
    req.on('aborted', () => reject('request aborted'));
  });
}
