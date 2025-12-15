import { colleges } from "@/infra/db/tables";
import * as collegeRepo from "./college.repo"
import { ApiError } from "@/core/http";

class CollegeService {
    createCollege = async (values: typeof colleges.$inferInsert) => {
        const existing = await collegeRepo.getByEmail(values.emailDomain);
        if (existing) throw new ApiError({ statusCode: 409, message: "College with this domain already exists." });
        const college = await collegeRepo.createCollege(values);
        // if (!college) throw new ApiError({ statusCode:})
        return college
    }
}

export default new CollegeService()