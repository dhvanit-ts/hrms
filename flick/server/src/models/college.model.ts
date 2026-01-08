import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    emailDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(v),
        message: "Invalid domain format",
      }
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    profile: {
      type: String,
      trim: true,
      default: "https://yourcdn.com/default-college-profile.png",
    },
  },
  { timestamps: true }
);

// indexing for faster search
collegeSchema.index({ name: 1 });
collegeSchema.index({ city: 1, state: 1 });

const CollegeModel = mongoose.model("College", collegeSchema);

export default CollegeModel;
