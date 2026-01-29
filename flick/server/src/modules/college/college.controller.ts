import { Request } from "express";
import { Controller, HttpResponse } from "@/core/http";
import collegeService from "./college.service";
import * as collegeSchemas from "./college.schema";
import { validateRequest } from "@/core/middlewares";

@Controller()
class CollegeController {
 static async createCollege(req: Request) {
    const { name, emailDomain, city, state, profile } = collegeSchemas.CreateCollegeSchema.parse(req.body);

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

 static async getColleges(req: Request) {
    const { city, state } = collegeSchemas.CollegeFiltersSchema.parse(req.query);

    const colleges = await collegeService.getColleges({ city, state });

    return HttpResponse.ok("Colleges retrieved successfully", {
      colleges,
      count: colleges.length,
    });
  }

 static async getCollegeById(req: Request) {
    const { id } = collegeSchemas.CollegeIdSchema.parse(req.params);

    const college = await collegeService.getCollegeById(id);

    return HttpResponse.ok("College retrieved successfully", {
      college,
    });
  }

 static async updateCollege(req: Request) {
    const { id } = collegeSchemas.CollegeIdSchema.parse(req.params);
    const updates = collegeSchemas.UpdateCollegeSchema.parse(req.body);

    const updatedCollege = await collegeService.updateCollege(id, updates);

    return HttpResponse.ok("College updated successfully", {
      college: updatedCollege,
    });
  }

 static async deleteCollege(req: Request) {
    const { id } = collegeSchemas.CollegeIdSchema.parse(req.params);

    await collegeService.deleteCollege(id);

    return HttpResponse.ok("College deleted successfully");
  }
}

export default CollegeController;
