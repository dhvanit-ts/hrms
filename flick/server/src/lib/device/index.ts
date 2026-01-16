import { generateDeviceFingerprint } from "./fingerprint";
import { getDeviceName } from "./info";
import { getLocationFromIP } from "./location";
import { parseUserAgent } from "./user-agent";

export const device = {
  fingerprint: generateDeviceFingerprint,
  location: getLocationFromIP,
  deviceName: getDeviceName,
  parseUserAgent
};
