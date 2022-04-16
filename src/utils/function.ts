/* eslint-disable @typescript-eslint/ban-types */

export function getFunctionName(fn: Function): string {
  return fn.name || '[anonymous Function]';
}
