import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import asyncHandler from "@/core/http/asyncHandler.js";
import * as bankDetailsService from "./bank-details.service.js";

export const createBankDetailsSchema = z.object({
    body: z.object({
        accountNumber: z.string().min(1, "Account number is required"),
        bankName: z.string().min(1, "Bank name is required"),
        branchName: z.string().optional(),
        ifscCode: z.string().min(1, "IFSC code is required"),
        accountType: z.enum(["savings", "current"]).optional(),
    }),
});

export const updateBankDetailsSchema = z.object({
    body: z.object({
        accountNumber: z.string().optional(),
        bankName: z.string().optional(),
        branchName: z.string().optional(),
        ifscCode: z.string().optional(),
        accountType: z.enum(["savings", "current"]).optional(),
    }),
});

export const createBankDetailsHandler = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const employeeId = parseInt(req.user!.id);
        const bankDetails = await bankDetailsService.createBankDetails(employeeId, req.body);
        res.status(201).json({ bankDetails });
    }
);

export const getBankDetailsHandler = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const employeeId = parseInt(req.user!.id);
        const bankDetails = await bankDetailsService.getBankDetails(employeeId);
        res.status(200).json({ bankDetails });
    }
);

export const updateBankDetailsHandler = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const employeeId = parseInt(req.user!.id);
        const bankDetails = await bankDetailsService.updateBankDetails(employeeId, req.body);
        res.status(200).json({ bankDetails });
    }
);

export const deleteBankDetailsHandler = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const employeeId = parseInt(req.user!.id);
        const result = await bankDetailsService.deleteBankDetails(employeeId);
        res.status(200).json(result);
    }
);
