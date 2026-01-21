// src/types/express/index.d.ts

import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        username: string;
        isVerified: boolean;
        isBlocked: boolean;
        suspension: {
          ends: Date | null;
          reason: string | null;
          howManyTimes: number;
        };
        termsAccepted: boolean;
        refreshTokens: {
          token: string;
          ip: string;
          issuedAt: Date;
          userAgent: string;
        }[];
        branch: string;
        college: Types.ObjectId | null;
      };
      admin?: {
        _id: Types.ObjectId;
      };
      sessionId?: string;
    }
  }
}
