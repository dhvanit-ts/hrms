import { loadEnv } from '../../config/env';

/**
 * IP Validation Service
 * Determines if an IP address is from the office network or external (WFH)
 */
export class IPValidationService {
    private officeIPRanges: string[];

    constructor() {
        const env = loadEnv();
        // Parse comma-separated IP ranges from environment variable
        this.officeIPRanges = env.OFFICE_IP_RANGES
            ? env.OFFICE_IP_RANGES.split(',').map(range => range.trim()).filter(Boolean)
            : [];
    }

    /**
     * Check if an IP address is within office IP ranges
     * @param ipAddress - The IP address to check
     * @returns true if the IP is from office network, false otherwise
     */
    isOfficeIP(ipAddress: string): boolean {
        if (!ipAddress || this.officeIPRanges.length === 0) {
            return false;
        }

        // Normalize IPv6 localhost to IPv4
        const normalizedIP = ipAddress === '::1' ? '127.0.0.1' : ipAddress;

        for (const range of this.officeIPRanges) {
            if (this.isIPInRange(normalizedIP, range)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get attendance type based on IP address
     * @param ipAddress - The IP address to check
     * @returns 'Office' if from office network, 'WFH' otherwise
     */
    getAttendanceType(ipAddress: string): 'Office' | 'WFH' {
        return this.isOfficeIP(ipAddress) ? 'Office' : 'WFH';
    }

    /**
     * Check if an IP address is within a given range
     * Supports both single IPs and CIDR notation
     * @param ip - The IP address to check
     * @param range - The IP range (single IP or CIDR notation)
     * @returns true if IP is in range, false otherwise
     */
    private isIPInRange(ip: string, range: string): boolean {
        // Check if it's a single IP match
        if (!range.includes('/')) {
            return ip === range;
        }

        // Parse CIDR notation
        const [rangeIP, prefixLengthStr] = range.split('/');
        const prefixLength = Number.parseInt(prefixLengthStr, 10);

        if (Number.isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
            return false;
        }

        const ipNum = this.ipToNumber(ip);
        const rangeIPNum = this.ipToNumber(rangeIP);

        if (ipNum === null || rangeIPNum === null) {
            return false;
        }

        // Create subnet mask
        const mask = prefixLength === 0 ? 0 : (0xFFFFFFFF << (32 - prefixLength)) >>> 0;

        // Check if IP is in the subnet
        return (ipNum & mask) === (rangeIPNum & mask);
    }

    /**
     * Convert IPv4 address to a 32-bit number
     * @param ip - The IPv4 address
     * @returns The numeric representation or null if invalid
     */
    private ipToNumber(ip: string): number | null {
        const parts = ip.split('.');

        if (parts.length !== 4) {
            return null;
        }

        let num = 0;
        for (let i = 0; i < 4; i++) {
            const part = Number.parseInt(parts[i], 10);
            if (Number.isNaN(part) || part < 0 || part > 255) {
                return null;
            }
            num = (num << 8) | part;
        }

        return num >>> 0; // Convert to unsigned 32-bit integer
    }
}

// Export singleton instance
export const ipValidationService = new IPValidationService();
