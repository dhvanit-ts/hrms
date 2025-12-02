import React, { useState } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';

const MIN_PASSWORD_LENGTH = 8;

export const Login: React.FC = () => {
  const { employeeLogin } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateIdentifier = (value: string): string | null => {
    if (!value.trim()) return 'Employee ID or Email is required';
    return null;
  };

  const validatePassword = (value: string): string | null => {
    if (!value) return 'Password is required';
    if (value.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return null;
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    if (error) setError(null);
    if (identifierError && value.trim()) {
      const validationError = validateIdentifier(value);
      if (!validationError) setIdentifierError(null);
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

    const identifierValidationError = validateIdentifier(identifier);
    const passwordValidationError = validatePassword(password);

    setIdentifierError(identifierValidationError);
    setPasswordError(passwordValidationError);

    if (identifierValidationError || passwordValidationError) return;

    setLoading(true);
    try {
      await employeeLogin(identifier, password);
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
        <h1 className="text-xl font-semibold">Employee Sign In</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="identifier">Employee ID or Email</Label>
          <input
            id="identifier"
            className={`w-full border rounded px-3 py-2 ${identifierError ? 'border-red-500' : 'border-gray-300'}`}
            type="text"
            value={identifier}
            onChange={(e) => handleIdentifierChange(e.target.value)}
            placeholder="EMP001 or you@example.com"
            aria-invalid={!!identifierError}
            aria-describedby={identifierError ? 'identifier-error' : undefined}
          />
          {identifierError && (
            <p id="identifier-error" className="text-sm text-red-600" role="alert">
              {identifierError}
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

        <div className="text-sm text-center text-gray-600">
          Admin?{' '}
          <Link className="text-blue-600 underline" to="/admin/login">
            Sign in here
          </Link>
        </div>
      </form>
    </div>
  );
};


