import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('superadmin@vector.gov.in');
  const [password, setPassword] = useState('Vector@2026');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your government email and password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Vector@2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#F1F5F9] flex flex-col justify-center items-center px-4 py-8 select-none">
      {/* Container Box */}
      <div className="w-full max-w-[420px] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-slate-900 px-6 py-6 text-white text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-widest uppercase">
            VECTOR
          </h1>
          <p className="text-xs text-slate-300 font-medium tracking-wide mt-0.5">
            Govt Logistics & Ops
          </p>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-blue-300 border border-slate-700">
            North Eastern Region Command Portal
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@vector.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Authenticating terminal...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Command Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Roles 1-Click Fast Fill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <KeyRound className="h-3 w-3 text-slate-400" />
                Quick Role Credentials
              </span>
              <span className="text-[10px] text-blue-600 font-mono">1-Click Test</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-left">
              <button
                type="button"
                onClick={() => setDemoCredentials('superadmin@vector.gov.in')}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-900 text-xs flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs">👑</span>
                  <div>
                    <div className="font-semibold leading-tight text-[11px]">Super Admin</div>
                    <div className="text-[10px] text-slate-500">superadmin@vector.gov.in</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1 py-0.5 rounded font-bold">L5</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('assam.admin@vector.gov.in')}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-900 text-xs flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs">🏛️</span>
                  <div>
                    <div className="font-semibold leading-tight text-[11px]">State Admin (Assam)</div>
                    <div className="text-[10px] text-slate-500">assam.admin@vector.gov.in</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-bold">L4</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('kamrup.admin@vector.gov.in')}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-900 text-xs flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs">🏢</span>
                  <div>
                    <div className="font-semibold leading-tight text-[11px]">District Admin (Kamrup)</div>
                    <div className="text-[10px] text-slate-500">kamrup.admin@vector.gov.in</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-bold">L3</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('field.officer@vector.gov.in')}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-900 text-xs flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs">🦺</span>
                  <div>
                    <div className="font-semibold leading-tight text-[11px]">Field Officer</div>
                    <div className="text-[10px] text-slate-500">field.officer@vector.gov.in</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-bold">L2</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('rescue.team@vector.gov.in')}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-900 text-xs flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs">⛑️</span>
                  <div>
                    <div className="font-semibold leading-tight text-[11px]">Rescue Team Member</div>
                    <div className="text-[10px] text-slate-500">rescue.team@vector.gov.in</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-bold">L1</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-center">
          <p className="text-[10px] text-slate-500">
            Authorized Personnel Only • Ministry of Road Transport & Highways / NEC
          </p>
        </div>
      </div>
    </div>
  );
};
