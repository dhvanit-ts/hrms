// utils/betterAuthHttpHelpers.ts
export function forwardSetCookieHeaders(fetchHeaders: Headers, res: import("express").Response) {
  const setCookie = fetchHeaders.get("set-cookie");
  if (!setCookie) return;
  // If there are multiple cookies the header may be a single string with comma separated cookies,
  // express supports setting an array too.
  // Split conservatively on `, ` only when it's not part of cookie values - but simplest practical approach:
  const cookies = setCookie.split(", ").filter(Boolean);
  res.setHeader("Set-Cookie", cookies);
}
