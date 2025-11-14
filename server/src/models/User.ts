import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AppRole } from '../config/constants.js';

export interface RefreshTokenSubdoc {
  jti: string;
  expiresAt: Date;
  revokedAt?: Date | null;
}

export interface UserDoc extends Document<Types.ObjectId> {
  email: string;
  passwordHash: string;
  roles: AppRole[];
  isActive: boolean;
  lastLogin?: Date | null;
  profileRef?: Types.ObjectId | null;
  refreshTokens: RefreshTokenSubdoc[];
}

const RefreshTokenSchema = new Schema<RefreshTokenSubdoc>(
  {
    jti: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, required: false }
  },
  { _id: false }
);

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['EMPLOYEE'] },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, required: false },
    profileRef: { type: Schema.Types.ObjectId, required: false },
    refreshTokens: { type: [RefreshTokenSchema], default: [] }
  },
  { timestamps: true, versionKey: false }
);

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.refreshTokens;
    return ret;
  }
});

export const User = mongoose.model<UserDoc>('User', UserSchema);


