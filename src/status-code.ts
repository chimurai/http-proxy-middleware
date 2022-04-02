export function getStatusCode(errorCode: string): number {
  let statusCode: number;

  if (/HPE_INVALID/.test(errorCode)) {
    statusCode = 502;
  } else {
    switch (errorCode) {
      case 'ECONNRESET':
      case 'ENOTFOUND':
      case 'ECONNREFUSED':
      case 'ETIMEDOUT':
        statusCode = 504;
        break;
      default:
        statusCode = 500;
        break;
    }
  }

  return statusCode;
}
