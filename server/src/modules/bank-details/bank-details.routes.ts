import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { validate } from "@/core/middlewares/validate.js";
import {
    createBankDetailsHandler,
    getBankDetailsHandler,
    updateBankDetailsHandler,
    deleteBankDetailsHandler,
    createBankDetailsSchema,
    updateBankDetailsSchema,
} from "./bank-details.controller.js";

const router = Router();
router.use(authenticate);

router.post("/", validate(createBankDetailsSchema), createBankDetailsHandler);
router.get("/", getBankDetailsHandler);
router.put("/", validate(updateBankDetailsSchema), updateBankDetailsHandler);
router.delete("/", deleteBankDetailsHandler);

export default router;
