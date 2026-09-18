'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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
        setError(data.error || 'رمز عبور وارد شده نادرست است.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#12151C]">
      <div className="w-full max-w-sm p-6 sm:p-8 rounded-lg bg-[#1B1F29] border border-[rgba(237,234,227,0.08)] flex flex-col items-center text-center">
        
        {/* Brand logo with hairline border */}
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-[rgba(237,234,227,0.12)] mb-5">
          <img src="/icons/apple-touch-icon.png" alt="Brevity" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-xl font-bold text-[#EDEAE3] mb-1">
          ورود به Brevity
        </h1>
        <p className="text-xs font-light text-[#8C8F9B] mb-6">
          دفترچه شخصی برنامه کلاسی و تکالیف
        </p>

        {error && (
          <div className="w-full p-2.5 mb-4 rounded border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-light text-right">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-normal text-[#8C8F9B]">
              رمز عبور اختصاصی
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور..."
              className="w-full px-3 py-2.5 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] placeholder-[#8C8F9B]/50 text-xs focus:outline-none focus:border-[#C08A4E] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded bg-[#C08A4E] hover:bg-[#AA773F] text-[#12151C] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-1"
          >
            <span>{loading ? 'در حال بررسی...' : 'ورود'}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </main>
  );
}
