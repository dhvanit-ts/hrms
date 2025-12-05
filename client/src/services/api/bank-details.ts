import { employeeHttp } from "./employee-http";

export interface BankDetails {
    id: number;
    employeeId: number;
    accountNumber: string;
    bankName: string;
    branchName?: string | null;
    ifscCode: string;
    accountType: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBankDetailsInput {
    accountNumber: string;
    bankName: string;
    branchName?: string;
    ifscCode: string;
    accountType?: "savings" | "current";
}

export interface UpdateBankDetailsInput {
    accountNumber?: string;
    bankName?: string;
    branchName?: string;
    ifscCode?: string;
    accountType?: "savings" | "current";
}

export async function createBankDetails(accessToken: string, data: CreateBankDetailsInput) {
    const res = await employeeHttp.post("/bank-details", data, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data as { bankDetails: BankDetails };
}

export async function getBankDetails(accessToken: string) {
    const res = await employeeHttp.get("/bank-details", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data as { bankDetails: BankDetails | null };
}

export async function updateBankDetails(accessToken: string, data: UpdateBankDetailsInput) {
    const res = await employeeHttp.put("/bank-details", data, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data as { bankDetails: BankDetails };
}

export async function deleteBankDetails(accessToken: string) {
    const res = await employeeHttp.delete("/bank-details", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data as { success: boolean };
}
