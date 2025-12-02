import React, { useState } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const AdminLogin: React.FC = () => {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const validateEmail = (value: string): string | null => {
        if (!value.trim()) return 'Email is required';
        if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
        return null;
    };

    const validatePassword = (value: string): string | null => {
        if (!value) return 'Password is required';
        if (value.length < MIN_PASSWORD_LENGTH) {
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
        }
        return null;
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (error) setError(null);
        if (emailError && value.trim()) {
            const validationError = validateEmail(value);
            if (!validationError) setEmailError(null);
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (error) setError(null);
        if (passwordError && value) {
            const validationError = validatePassword(value);
            if (!validationError) setPasswordError(null);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const emailValidationError = validateEmail(email);
        const passwordValidationError = validatePassword(password);

        setEmailError(emailValidationError);
        setPasswordError(passwordValidationError);

        if (emailValidationError || passwordValidationError) return;

        setLoading(true);
        try {
            await login(email, password);
            nav('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4">
                <h1 className="text-xl font-semibold">Admin Sign In</h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm" role="alert">
                        {error}
                    </div>
                )}

                <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <input
                        id="email"
                        className={`w-full border rounded px-3 py-2 ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="admin@example.com"
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? 'email-error' : undefined}
                    />
                    {emailError && (
                        <p id="email-error" className="text-sm text-red-600" role="alert">
                            {emailError}
                        </p>
                    )}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <input
                        id="password"
                        className={`w-full border rounded px-3 py-2 ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                        type="password"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        placeholder="Enter your password"
                        aria-invalid={!!passwordError}
                        aria-describedby={passwordError ? 'password-error' : undefined}
                    />
                    {passwordError && (
                        <p id="password-error" className="text-sm text-red-600" role="alert">
                            {passwordError}
                        </p>
                    )}
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-black text-white rounded py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                >
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <div className="text-sm text-center">
                    Need an admin account?{' '}
                    <Link className="text-blue-600 underline" to="/admin/register">
                        Register
                    </Link>
                </div>
            </form>
        </div>
    );
};
