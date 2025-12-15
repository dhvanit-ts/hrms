import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/core/middlewares/index.js";
import { AsyncHandler } from "@/core/http/asyncHandler.js";
import { ApiResponse } from "@/core/http";
import collegeService from "./college.service";

interface CollegeFilter {
  city?: string;
  state?: string;
}

class CollegeController {

  @AsyncHandler()
  async createCollege(req: AuthenticatedRequest, res: Response) {
    const { name, emailDomain, city, state, profile } = req.body;

    // if (!name || !emailDomain || !city || !state) {
    //   throw new ApiError(400, "Missing required fields.");
    // }

    const college = await collegeService.createCollege({
      name,
      emailDomain,
      city,
      state,
      profile
    })

    // logEvent({
    //   action: "admin_created_college",
    //   platform: "web",
    //   metadata: {
    //     name,
    //     emailDomain,
    //   },
    //   sessionId: req.sessionId,
    //   userId: req.admin._id.toString(),
    // });

    return ApiResponse.created({ message: "College created successfully.", data: college });
  };

  @AsyncHandler()
  async getColleges(req: Request, res: Response) {
    const { city, state } = req.query as { city?: string; state?: string };

    const filter: CollegeFilter = {};
    if (city) filter.city = city;
    if (state) filter.state = state;

    const colleges = await CollegeModel.find(filter).sort({ name: 1 });
    res.status(200).json({ colleges });
  };

  @AsyncHandler()
  async getCollegeById(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid college ID.");
    }

    const college = await CollegeModel.findById(id);
    if (!college) {
      throw new ApiError(404, "College not found.");
    }

    res.status(200).json({ data: college });
  };

  @AsyncHandler()
  async updateCollege(req: Request, res: Response) {
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

  };

  @AsyncHandler()
  async deleteCollege(req: Request, res: Response) {
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
  };

}

export default new CollegeController();