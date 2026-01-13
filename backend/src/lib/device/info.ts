import { UAParser } from "ua-parser-js";

export const getDeviceName = (userAgent: string): string => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const os = result.os.name || "Unknown OS";

  return `${os} - ${browser}`;
};
