import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/shared/components/ui/card';
import { ErrorAlert } from '@/shared/components/ui/error-alert';
import { extractErrorMessage } from '@/lib/utils';
import * as bankDetailsApi from '@/services/api/bank-details';
import type { BankDetails, CreateBankDetailsInput } from '@/services/api/bank-details';

export const BankDetailsPage: React.FC = () => {
    const { employeeAccessToken: accessToken } = useAuth();
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateBankDetailsInput>({
        accountNumber: '',
        bankName: '',
        branchName: '',
        ifscCode: '',
        accountType: 'savings',
    });

    useEffect(() => {
        if (accessToken) {
            loadBankDetails();
        }
    }, [accessToken]);

    const loadBankDetails = async () => {
        if (!accessToken) return;

        setLoading(true);
        setError(null);

        try {
            const result = await bankDetailsApi.getBankDetails(accessToken);
            setBankDetails(result.bankDetails);
            if (result.bankDetails) {
                setFormData({
                    accountNumber: result.bankDetails.accountNumber,
                    bankName: result.bankDetails.bankName,
                    branchName: result.bankDetails.branchName || '',
                    ifscCode: result.bankDetails.ifscCode,
                    accountType: result.bankDetails.accountType as 'savings' | 'current',
                });
            }
        } catch (err: any) {
            const errorMessage = extractErrorMessage(err);
            console.error('Failed to load bank details:', err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;

        setLoading(true);
        setError(null);

        try {
            const result = await bankDetailsApi.createBankDetails(accessToken, formData);
            setBankDetails(result.bankDetails);
            setIsCreating(false);
            setSuccessMessage('Bank details created successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            const errorMessage = extractErrorMessage(err);
            console.error('Failed to create bank details:', err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;

        setLoading(true);
        setError(null);

        try {
            const result = await bankDetailsApi.updateBankDetails(accessToken, formData);
            setBankDetails(result.bankDetails);
            setIsEditing(false);
            setSuccessMessage('Bank details updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            const errorMessage = extractErrorMessage(err);
            console.error('Failed to update bank details:', err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!accessToken || !window.confirm('Are you sure you want to delete your bank details?')) return;

        setLoading(true);
        setError(null);

        try {
            await bankDetailsApi.deleteBankDetails(accessToken);
            setBankDetails(null);
            setFormData({
                accountNumber: '',
                bankName: '',
                branchName: '',
                ifscCode: '',
                accountType: 'savings',
            });
            setSuccessMessage('Bank details deleted successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            const errorMessage = extractErrorMessage(err);
            console.error('Failed to delete bank details:', err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (bankDetails) {
            setFormData({
                accountNumber: bankDetails.accountNumber,
                bankName: bankDetails.bankName,
                branchName: bankDetails.branchName || '',
                ifscCode: bankDetails.ifscCode,
                accountType: bankDetails.accountType as 'savings' | 'current',
            });
        } else {
            setFormData({
                accountNumber: '',
                bankName: '',
                branchName: '',
                ifscCode: '',
                accountType: 'savings',
            });
        }
        setIsEditing(false);
        setIsCreating(false);
    };

    if (loading && !bankDetails && !isCreating) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading bank details...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-semibold text-zinc-900">Bank Details</h2>
                    <p className="text-sm text-zinc-500">
                        Manage your bank account information for salary payments
                    </p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-md">
                    {successMessage}
                </div>
            )}
            {error && (
                <ErrorAlert
                    message={error}
                    onDismiss={() => setError(null)}
                    autoDismiss={true}
                    dismissAfter={5000}
                />
            )}

            {/* Bank Details Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Bank Account Information
                            </CardTitle>
                            <CardDescription>
                                {bankDetails ? 'Your registered bank account details' : 'No bank details registered'}
                            </CardDescription>
                        </div>
                        {bankDetails && !isEditing && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    disabled={loading}
                                >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {!bankDetails && !isCreating ? (
                        <div className="text-center py-8">
                            <CreditCard className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
                            <p className="text-zinc-500 mb-4">No bank details found</p>
                            <Button onClick={() => setIsCreating(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Bank Details
                            </Button>
                        </div>
                    ) : (isEditing || isCreating) ? (
                        <form onSubmit={isCreating ? handleCreate : handleUpdate} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Account Number</label>
                                    <Input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                        placeholder="Enter account number"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">IFSC Code</label>
                                    <Input
                                        type="text"
                                        value={formData.ifscCode}
                                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                                        placeholder="e.g. SBIN0001234"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Bank Name</label>
                                    <Input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        placeholder="e.g. State Bank of India"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Branch Name</label>
                                    <Input
                                        type="text"
                                        value={formData.branchName}
                                        onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                                        placeholder="e.g. Main Branch"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Account Type</label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                                    value={formData.accountType}
                                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'savings' | 'current' })}
                                >
                                    <option value="savings">Savings Account</option>
                                    <option value="current">Current Account</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={loading}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Saving...' : isCreating ? 'Create' : 'Update'}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm text-zinc-500">Account Number</p>
                                    <p className="text-base font-medium text-zinc-900">
                                        {bankDetails?.accountNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500">IFSC Code</p>
                                    <p className="text-base font-medium text-zinc-900">
                                        {bankDetails?.ifscCode}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm text-zinc-500">Bank Name</p>
                                    <p className="text-base font-medium text-zinc-900">
                                        {bankDetails?.bankName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500">Branch Name</p>
                                    <p className="text-base font-medium text-zinc-900">
                                        {bankDetails?.branchName || '-'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-zinc-500">Account Type</p>
                                <p className="text-base font-medium text-zinc-900 capitalize">
                                    {bankDetails?.accountType} Account
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Your bank details are used for salary payments and other financial transactions.
                        Please ensure all information is accurate and up to date.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default BankDetailsPage;
