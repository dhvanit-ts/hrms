import { IncomingHttpHeaders } from "node:http";

function parseHeaders(headers: IncomingHttpHeaders) {
  const parsed = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      parsed.set(key, value);
    } else if (Array.isArray(value)) {
      parsed.set(key, value.join(', '));
    }
  });
  return parsed
}

export default parseHeaders