import { HttpError } from "@/core/http";
import CollegeRepo from "./college.repo";

class CollegeService {
  async createCollege(collegeData: {
    name: string;
    emailDomain: string;
    city: string;
    state: string;
    profile?: string;
  }) {
    // Check if college with this email domain already exists
    const existing = await CollegeRepo.CachedRead.findByEmailDomain(collegeData.emailDomain);
    if (existing) {
      throw new HttpError({
        statusCode: 409,
        message: "College with this email domain already exists",
        code: "COLLEGE_ALREADY_EXISTS",
        meta: { source: "CollegeService.createCollege" },
        errors: [
          {
            field: "emailDomain",
            message: "College with this email domain already exists",
          },
        ],
      });
    }

    const newCollege = await CollegeRepo.Write.create(collegeData);
    return newCollege;
  }

  async getColleges(filters?: { city?: string; state?: string }) {
    const colleges = await CollegeRepo.CachedRead.findAll(filters);
    return colleges;
  }

  async getCollegeById(id: string) {
    const college = await CollegeRepo.CachedRead.findById(id);
    if (!college) {
      throw HttpError.notFound("College not found", {
        code: "COLLEGE_NOT_FOUND",
        meta: { source: "CollegeService.getCollegeById" },
        errors: [{ field: "id", message: "College not found" }],
      });
    }
    return college;
  }

  async updateCollege(id: string, updates: {
    name?: string;
    emailDomain?: string;
    city?: string;
    state?: string;
    profile?: string;
  }) {
    // Check if college exists
    const existing = await CollegeRepo.CachedRead.findById(id);
    if (!existing) {
      throw HttpError.notFound("College not found", {
        code: "COLLEGE_NOT_FOUND",
        meta: { source: "CollegeService.updateCollege" },
        errors: [{ field: "id", message: "College not found" }],
      });
    }

    // If updating email domain, check for conflicts
    if (updates.emailDomain && updates.emailDomain !== existing.emailDomain) {
      const emailConflict = await CollegeRepo.CachedRead.findByEmailDomain(updates.emailDomain);
      if (emailConflict) {
        throw new HttpError({
          statusCode: 409,
          message: "College with this email domain already exists",
          code: "COLLEGE_ALREADY_EXISTS",
          meta: { source: "CollegeService.updateCollege" },
          errors: [
            {
              field: "emailDomain",
              message: "College with this email domain already exists",
            },
          ],
        });
      }
    }

    const updatedCollege = await CollegeRepo.Write.updateById(id, updates);
    return updatedCollege;
  }

  async deleteCollege(id: string) {
    const existing = await CollegeRepo.CachedRead.findById(id);
    if (!existing) {
      throw HttpError.notFound("College not found", {
        code: "COLLEGE_NOT_FOUND",
        meta: { source: "CollegeService.deleteCollege" },
        errors: [{ field: "id", message: "College not found" }],
      });
    }

    const deletedCollege = await CollegeRepo.Write.deleteById(id);
    return deletedCollege;
  }
}

export default new CollegeService();