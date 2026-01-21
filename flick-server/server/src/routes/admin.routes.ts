import { Router } from "express";
import {
  getAdmin,
  getAllAdmins,
  initializeAdmin,
  logoutAdmin,
  removeAuthorizedDevice,
  verifyAdminOtp,
  resendAdminOtp,
} from "../controllers/admin.controller.js";
import { verifyAdminJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").get(verifyAdminJWT, getAdmin);
// .post(verifyAdminJWT, createAdmin)
// .delete(verifyAdminJWT, deleteAdmin)
// .patch(verifyAdminJWT, updateAdmin);
router.route("/login/init").post(initializeAdmin);
router.route("/login/verify").post(verifyAdminOtp);
router.route("/login/resend").post(resendAdminOtp);
router.route("/logout").post(verifyAdminJWT, logoutAdmin);
router.route("/device/remove").post(verifyAdminJWT, removeAuthorizedDevice);
router.route("/all").get(verifyAdminJWT, getAllAdmins);

export default router;
