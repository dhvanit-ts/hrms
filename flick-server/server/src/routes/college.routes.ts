import { Router } from "express";
import {
    createCollege,
    deleteCollege,
    getCollegeById,
    getColleges,
    updateCollege,
} from "../controllers/college.controller.js";

const router = Router()

router.route('/').post(createCollege).delete(deleteCollege)
router.route('/update/:id').patch(updateCollege)
router.route('/get/single/:id').get(getCollegeById)
router.route('/get/all').get(getColleges)

export default router;