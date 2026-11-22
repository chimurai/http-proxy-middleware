import { isIPv6 } from 'node:net';

/**
 * Parses the agent key to extract the port.
 *
 * @param name The agent key string to parse.
 * @returns An object containing the extracted port, or undefined if it cannot be determined.
 *
 * How the agent key is structured:
 * ```text
 * Get a unique name for a set of request options, to determine whether a connection can be reused.
 * For an HTTP agent, this returns host:port:localAddress or host:port:localAddress:family.
 * For an HTTPS agent, the name includes the CA, cert, ciphers, and
 * other HTTPS/TLS-specific options that determine socket reusability.
 * ```
 * @see https://beta.docs.nodejs.org/http/Agent#agentgetnameoptions
 */
export function parseAgentName(name: string): { port: string | undefined } {
  let port: string | undefined;

  // Agent keys are host:port:localAddress..., but IPv6 hosts and TLS options can contain colons.
  for (const match of name.matchAll(/(?=:(\d{1,5}):)/g)) {
    const host = name.slice(0, match.index);
    const candidate = match[1];
    if (!host || (host.includes(':') && !isIPv6(host)) || Number(candidate) > 65535) {
      continue;
    }
    if (port !== undefined && port !== candidate) {
      return { port: undefined };
    }
    port = candidate;
  }

  return { port };
}
