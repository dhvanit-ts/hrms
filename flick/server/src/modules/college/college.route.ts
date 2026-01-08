import { Router } from "express";
import collegeController from "./college.controller";
import { ensureRatelimit } from "@/core/middlewares";
import { adminOnly } from "@/core/middlewares/pipelines";

const router = Router();

router.use(ensureRatelimit.api);

router.route("/").post(adminOnly, collegeController.createCollege);
router.route("/").get(collegeController.getColleges);
router.route("/:id").get(collegeController.getCollegeById);
router.route("/:id").patch(adminOnly, collegeController.updateCollege);
router.route("/:id").delete(adminOnly, collegeController.deleteCollege);

export default router;