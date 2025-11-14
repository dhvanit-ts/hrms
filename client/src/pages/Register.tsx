import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords must match');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
      nav('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Create your account</h1>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Use a strong password"
            required
            minLength={12}
          />
          <p className="text-xs text-gray-500">
            Must be at least 12 characters and include uppercase, lowercase, number, and special character.
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-sm">Confirm password</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
          type="submit"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
        <div className="text-sm text-center">
          Already have an account?{' '}
          <Link className="text-blue-600 underline" to="/login">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
};


