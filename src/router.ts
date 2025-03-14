import { isPlainObject } from 'is-plain-object';
import { Debug } from './debug';

const debug = Debug.extend('router');

/**
 * Get the target for a request based on router configuration
 * @param req - The incoming request object containing the URL
 * @param config - Configuration object containing router rules
 * @returns Promise<string | undefined> - The target URL or undefined if no match
 */
export async function getTarget(req, config) {
  let newTarget;
  const router = config.router;

  if (isPlainObject(router)) {
    // Handle table-based routing
    newTarget = getTargetFromProxyTable(req, router);
  } else if (typeof router === 'function') {
    // Handle function-based routing (supports both sync and async functions)
    newTarget = await router(req);
  }

  return newTarget;
}

/**
 * Match request URL against a table of routing rules
 * @param req - The incoming request object
 * @param table - Table of path patterns and their corresponding targets
 * @returns The matching target or undefined
 */
function getTargetFromProxyTable(req, table) {
  let result;
  const path = req.url;

  // Remove query string and hash fragment, then decode URI components
  // This handles cases like: /api/users?id=123#section -> /api/users
  const pathWithoutQuery = decodeURIComponent(path.split('?')[0].split('#')[0]);

  // Sort routes by length (descending) to ensure most specific routes match first
  // Example: '/api/users' should match before '/api'
  const sortedEntries = Object.entries(table).sort(([a], [b]) => {
    return b.length - a.length;
  });

  for (const [key, value] of sortedEntries) {
    // Decode the route pattern to handle encoded characters in the configuration
    const decodedKey = decodeURIComponent(key);

    // Only process routes that start with '/'
    if (decodedKey.startsWith('/')) {
      // Split paths into segments and remove empty segments
      // Example: '/api/users/' -> ['api', 'users']
      const keySegments = decodedKey.split('/').filter(Boolean);
      const pathSegments = pathWithoutQuery.split('/').filter(Boolean);

      // Check if route segments exactly match the beginning of path segments
      // This prevents partial segment matches (e.g., '/api' matching '/api-v2')
      const isMatch = keySegments.every((segment, index) => pathSegments[index] === segment);

      // A route matches if:
      // 1. Segments match exactly AND
      // 2. Either:
      //    - It's the root path ('/')
      //    - The paths are exactly equal
      //    - The request path starts with the route pattern followed by a slash
      if (
        isMatch &&
        (decodedKey === '/' ||
          pathWithoutQuery === decodedKey ||
          pathWithoutQuery.startsWith(`${decodedKey}/`))
      ) {
        result = value;
        debug('path match: "%s" -> "%s"', decodedKey, result);
        break;
      }
    }
  }

  return result;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function containsPath(v) {
  return v.indexOf('/') > -1;
}
/* eslint-enable @typescript-eslint/no-unused-vars */
