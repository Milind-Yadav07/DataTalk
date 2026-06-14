'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    errorParam === 'CredentialsSignin'
      ? 'Invalid email or password.'
      : errorParam
        ? 'An error occurred during sign in.'
        : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-none p-8 shadow-xl transition-all duration-300 w-full relative">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 group select-none justify-center mb-4">
          <span className="font-black text-3xl text-slate-900 tracking-tight">
            Data<span className="text-[#86BC25]">Talk</span>
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-[#86BC25] mt-2"></span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight text-center">
          Welcome back
        </h1>

      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-5 p-3 rounded-none bg-red-50 border border-red-200 text-red-700 text-xs text-center animate-fade-in font-medium">
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-white border border-slate-200 focus:border-[#86BC25] focus:ring-1 focus:ring-[#86BC25] rounded-none py-3 px-4 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 focus:border-[#86BC25] focus:ring-1 focus:ring-[#86BC25] rounded-none py-3 pl-4 pr-16 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[11px] font-bold text-[#86BC25] hover:text-[#75a61e] transition-colors focus:outline-none cursor-pointer uppercase tracking-wider select-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#86BC25] hover:bg-slate-950 disabled:opacity-50 disabled:pointer-events-none text-slate-950 hover:text-white text-sm font-bold py-3 rounded-none shadow-lg shadow-[#86BC25]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-ping" />
              <span>Signing in...</span>
            </span>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="text-[#86BC25] hover:text-[#75a61e] hover:underline font-semibold transition-all"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <span className="h-2 w-2 rounded-full bg-[#86BC25] animate-ping mb-3" />
          <span className="text-slate-500 text-sm">Loading secure sign-in...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

