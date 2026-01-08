import { Request } from "express";
import { AsyncHandler, HttpResponse } from "@/core/http";
import collegeService from "./college.service";
import { withBodyValidation, withParamsValidation, withQueryValidation } from "@/lib/validation";
import * as collegeSchemas from "./college.schema";
import { validateRequest } from "@/core/middlewares";

class CollegeController {
  static createCollege = withBodyValidation(collegeSchemas.createCollegeSchema, this.createCollegeHandler)

  @AsyncHandler()
  private static async createCollegeHandler(req: Request) {
    const { name, emailDomain, city, state, profile } = req.body;

    const newCollege = await collegeService.createCollege({
      name,
      emailDomain,
      city,
      state,
      profile,
    });

    return HttpResponse.created("College created successfully", {
      college: newCollege,
    });
  }

  static getColleges = withQueryValidation(collegeSchemas.collegeFiltersSchema, this.getCollegesHandler)

  @AsyncHandler()
  private static async getCollegesHandler(req: Request) {
    const { city, state } = req.query as { city?: string; state?: string };

    const colleges = await collegeService.getColleges({ city, state });

    return HttpResponse.ok("Colleges retrieved successfully", {
      colleges,
      count: colleges.length,
    });
  }

  static getCollegeById = withParamsValidation(collegeSchemas.collegeIdSchema, this.getCollegeByIdHandler)

  @AsyncHandler()
  private static async getCollegeByIdHandler(req: Request) {
    const { id } = req.params;

    const college = await collegeService.getCollegeById(id);

    return HttpResponse.ok("College retrieved successfully", {
      college,
    });
  }

  static updateCollege = [
    validateRequest(collegeSchemas.collegeIdSchema, "params"),
    validateRequest(collegeSchemas.updateCollegeSchema),
    this.updateCollegeHandler
  ]

  @AsyncHandler()
  private static async updateCollegeHandler(req: Request) {
    const { id } = req.params;
    const updates = req.body;

    const updatedCollege = await collegeService.updateCollege(id, updates);

    return HttpResponse.ok("College updated successfully", {
      college: updatedCollege,
    });
  }

  static deleteCollege = withParamsValidation(collegeSchemas.collegeIdSchema, this.deleteCollegeHandler)

  @AsyncHandler()
  private static async deleteCollegeHandler(req: Request) {
    const { id } = req.params;

    await collegeService.deleteCollege(id);

    return HttpResponse.ok("College deleted successfully");
  }
}

export default CollegeController;
