import "express";

declare global {
  namespace Express {
    interface Request {
      id?: uuid
      user?: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string;
        twoFactorEnabled: boolean;
        banned: boolean;
        role?: string;
        banReason?: string;
        banExpires?: Date;
      } | null;
    }
  }
}
