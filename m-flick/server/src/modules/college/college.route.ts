import { Router } from "express";
import {
  createCollege,
  deleteCollege,
  getCollegeById,
  getColleges,
  updateCollege,
} from "./college.controller";
import { requireRole } from "@/core/middlewares";

const router = Router()

router.route('/').post(requireRole('admin'), createCollege).delete(deleteCollege)
router.route('/update/:id').patch(updateCollege)
router.route('/get/single/:id').get(getCollegeById)
router.route('/get/all').get(getColleges)

export default router;