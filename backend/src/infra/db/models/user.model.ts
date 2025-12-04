import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: [
    {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: ["user"],
    },
  ],
  authType: {
    type: String,
    enum: ["oauth", "manual"],
    default: "manual",
  },
  refreshToken: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);
export default User;
