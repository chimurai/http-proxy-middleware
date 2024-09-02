/* eslint-disable @typescript-eslint/no-unsafe-function-type */

export function getFunctionName(fn: Function): string {
  return fn.name || '[anonymous Function]';
}
