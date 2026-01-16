export function parseUserAgent(userAgent: string) {
  return {
    raw: userAgent,
    browser: guessBrowser(userAgent),
    os: guessOS(userAgent),
    deviceType: guessDeviceType(userAgent),
  };
}

function guessBrowser(ua: string) {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Unknown";
}

function guessOS(ua: string) {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "MacOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone")) return "iOS";
  return "Unknown";
}

function guessDeviceType(ua: string) {
  if (/Mobi|Android/i.test(ua)) return "mobile";
  return "desktop";
}
