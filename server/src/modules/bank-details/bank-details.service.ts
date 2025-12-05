import prisma from "@/config/db.js";
import ApiError from "@/core/http/ApiError.js";
import { writeAuditLog } from "@/infra/services/audit.service.js";

export interface CreateBankDetailsInput {
    accountNumber: string;
    bankName: string;
    branchName?: string;
    ifscCode: string;
    accountType?: string;
}

export interface UpdateBankDetailsInput {
    accountNumber?: string;
    bankName?: string;
    branchName?: string;
    ifscCode?: string;
    accountType?: string;
}

export async function createBankDetails(employeeId: number, data: CreateBankDetailsInput) {
    const existing = await prisma.bankDetails.findUnique({
        where: { employeeId },
    });

    if (existing) {
        throw new ApiError({
            statusCode: 409,
            code: "BANK_DETAILS_EXISTS",
            message: "Bank details already exist for this employee. Use update instead.",
        });
    }

    const bankDetails = await prisma.bankDetails.create({
        data: {
            employeeId,
            accountNumber: data.accountNumber,
            bankName: data.bankName,
            branchName: data.branchName,
            ifscCode: data.ifscCode,
            accountType: data.accountType || "savings",
        },
    });

    await writeAuditLog({
        action: "CREATE_BANK_DETAILS",
        entity: "BankDetails",
        entityId: bankDetails.id.toString(),
        performedBy: employeeId.toString(),
    });

    return bankDetails;
}

export async function getBankDetails(employeeId: number) {
    const bankDetails = await prisma.bankDetails.findUnique({
        where: { employeeId },
    });

    return bankDetails;
}

export async function updateBankDetails(employeeId: number, data: UpdateBankDetailsInput) {
    const existing = await prisma.bankDetails.findUnique({
        where: { employeeId },
    });

    if (!existing) {
        throw new ApiError({
            statusCode: 404,
            code: "BANK_DETAILS_NOT_FOUND",
            message: "Bank details not found for this employee.",
        });
    }

    const bankDetails = await prisma.bankDetails.update({
        where: { employeeId },
        data: {
            ...(data.accountNumber && { accountNumber: data.accountNumber }),
            ...(data.bankName && { bankName: data.bankName }),
            ...(data.branchName !== undefined && { branchName: data.branchName }),
            ...(data.ifscCode && { ifscCode: data.ifscCode }),
            ...(data.accountType && { accountType: data.accountType }),
        },
    });

    await writeAuditLog({
        action: "UPDATE_BANK_DETAILS",
        entity: "BankDetails",
        entityId: bankDetails.id.toString(),
        performedBy: employeeId.toString(),
    });

    return bankDetails;
}

export async function deleteBankDetails(employeeId: number) {
    const existing = await prisma.bankDetails.findUnique({
        where: { employeeId },
    });

    if (!existing) {
        throw new ApiError({
            statusCode: 404,
            code: "BANK_DETAILS_NOT_FOUND",
            message: "Bank details not found for this employee.",
        });
    }

    await prisma.bankDetails.delete({
        where: { employeeId },
    });

    await writeAuditLog({
        action: "DELETE_BANK_DETAILS",
        entity: "BankDetails",
        entityId: existing.id.toString(),
        performedBy: employeeId.toString(),
    });

    return { success: true };
}
