import { Request, Response } from "express";
import CollegeModel from "../models/college.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import handleError from "../utils/HandleError.js";
import { logEvent } from "../services/log.service.js";

interface CollegeFilter {
  city?: string;
  state?: string;
}

// CREATE College
export const createCollege = async (req: Request, res: Response) => {
  try {
    if (!req.admin) throw new ApiError(401, "Unauthorized");

    const { name, emailDomain, city, state, profile } = req.body;

    // Basic payload validation
    if (!name || !emailDomain || !city || !state) {
      throw new ApiError(400, "Missing required fields.");
    }

    const existing = await CollegeModel.findOne({ emailDomain });
    if (existing) {
      throw new ApiError(409, "College with this domain already exists.");
    }

    const college = await CollegeModel.create({
      name,
      emailDomain,
      city,
      state,
      profile,
    });

    logEvent({
      action: "admin_created_college",
      platform: "web",
      metadata: {
        name,
        emailDomain,
      },
      sessionId: req.sessionId,
      userId: req.admin._id.toString(),
    });

    res
      .status(201)
      .json({ message: "College created successfully.", data: college });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error creating college",
      "CREATE_COLLEGE_ERROR"
    );
  }
};

export const getColleges = async (req: Request, res: Response) => {
  try {
    const { city, state } = req.query as { city?: string; state?: string };

    const filter: CollegeFilter = {};
    if (city) filter.city = city;
    if (state) filter.state = state;

    const colleges = await CollegeModel.find(filter).sort({ name: 1 });
    res.status(200).json({ colleges });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error fetching colleges",
      "GET_COLLEGES_ERROR"
    );
  }
};

export const getCollegeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid college ID.");
    }

    const college = await CollegeModel.findById(id);
    if (!college) {
      throw new ApiError(404, "College not found.");
    }

    res.status(200).json({ data: college });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error fetching college",
      "GET_COLLEGE_ERROR"
    );
  }
};

export const updateCollege = async (req: Request, res: Response) => {
  try {
    if (!req.admin) throw new ApiError(404, "Unauthorized");

    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid college ID.");
    }

    const college = await CollegeModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!college) {
      throw new ApiError(404, "College not found.");
    }

    logEvent({
      action: "admin_updated_college",
      platform: "web",
      metadata: {
        updatedFields: {
          name: updates.name ? 1 : 0,
          emailDomain: updates.emailDomain ? 1 : 0,
          city: updates.city ? 1 : 0,
          state: updates.state ? 1 : 0,
          profile: updates.profile ? 1 : 0,
        },
        name: college.name,
        emailDomain: college.emailDomain,
      },
      sessionId: req.sessionId,
      userId: req.admin._id.toString(),
    });

    res
      .status(200)
      .json({ message: "College updated successfully.", data: college });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error updating college",
      "UPDATE_COLLEGE_ERROR"
    );
  }
};

export const deleteCollege = async (req: Request, res: Response) => {
  try {
    if (!req.admin) throw new ApiError(404, "Unauthorized");
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid college ID.");
    }

    const college = await CollegeModel.findByIdAndDelete(id);
    if (!college) {
      throw new ApiError(404, "College not found.");
    }

    logEvent({
      action: "admin_deleted_admin_account",
      platform: "web",
      metadata: {
        name: college.name,
      },
      sessionId: req.sessionId,
      userId: req.admin._id.toString(),
    });

    res.status(200).json({ message: "College deleted successfully." });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error deleting college",
      "DELETE_COLLEGE_ERROR"
    );
  }
};
