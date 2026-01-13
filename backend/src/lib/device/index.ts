import { generateDeviceFingerprint } from "./fingerprint";
import { getDeviceName } from "./info";
import { getLocationFromIP } from "./location";

export const device = {
  fingerprint: generateDeviceFingerprint,
  location: getLocationFromIP,
  deviceName: getDeviceName,
};
