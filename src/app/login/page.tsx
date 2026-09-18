'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'رمز عبور وارد شده اشتباه است.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError('خطا در اتصال به سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#090d16]">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        {/* Monogram Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 border border-indigo-400/30 mb-6">
          <span className="text-white font-black text-3xl">B</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
          ورود به Brevity
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          سیستم مدیریت شخصی برنامه کلاسی و تکالیف
        </p>

        {error && (
          <div className="w-full p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-right">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              رمز عبور اختصاصی
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور خود را وارد کنید..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'در حال ورود...' : 'ورود به برنامه'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>سشن شما برای ۹۰ روز روی این مرورگر فعال می‌ماند.</span>
        </div>
      </div>
    </main>
  );
}
