'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { PersianDatePicker } from '@/components/PersianDatePicker';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Save, Calendar } from 'lucide-react';

export default function NewTermPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('2025-09-23');
  const [endDate, setEndDate] = useState('2026-01-20');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('لطفاً نام ترم را وارد کنید.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('terms').insert({
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push('/terms');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/terms"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              ثبت ترم جدید
            </h1>
            <p className="text-xs text-slate-400">
              مشخصات و بازه زمانی ترم تحصیلی را وارد کنید.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col gap-5 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300">
              نام ترم <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: ترم پاییز ۱۴۰۴"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-4">
            <PersianDatePicker
              label="تاریخ شروع ترم"
              value={startDate}
              onChange={setStartDate}
              required
            />

            <PersianDatePicker
              label="تاریخ پایان ترم"
              value={endDate}
              onChange={setEndDate}
              required
            />
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-xs font-medium text-slate-300">
              این ترم به عنوان ترم فعال در نظر گرفته شود
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'در حال ثبت...' : 'ذخیره ترم'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
