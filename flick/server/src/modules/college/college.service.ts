import { HttpError } from "@/core/http";
import CollegeRepo from "./college.repo";
import recordAudit from "@/lib/record-audit";
import { CollegeUpdates } from "./college.types";

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

    await recordAudit({
      action: "admin:created:college",
      entityType: "college",
      entityId: newCollege.id,
      after: { id: newCollege.id },
      metadata: { emailDomain: newCollege.emailDomain }
    })

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

  async updateCollege(id: string, updates: CollegeUpdates) {
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
    const before: CollegeUpdates = {}

    if (updates.city) before.city = existing.city
    if (updates.emailDomain) before.emailDomain = existing.emailDomain
    if (updates.name) before.emailDomain = existing.emailDomain
    if (updates.profile) before.profile = existing.profile
    if (updates.state) before.state = existing.state

    await recordAudit({
      action: "admin:updated:college",
      entityType: "college",
      entityId: updatedCollege.id,
      before: before,
      after: updates,
      metadata: { emailDomain: updatedCollege.emailDomain }
    })

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

    await recordAudit({
      action: "admin:deleted:college",
      entityType: "college",
      entityId: deletedCollege.id,
      before: { id: deletedCollege.id },
      metadata: { emailDomain: deletedCollege.emailDomain }
    })

    return deletedCollege;
  }
}

export default new CollegeService();