import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../conf/env.js";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    authorizedDevices: [
      {
        deviceFingerprint: String,
        deviceName: String,
        lastSeen: Date,
        authorizedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this._email,
    },
    env.accessTokenSecret,
    {
      expiresIn: `${parseInt(env.accessTokenExpiry)}m`,
    }
  );
};

const adminModel = mongoose.model("Admin", adminSchema);

export default adminModel;
