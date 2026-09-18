'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { PersianDatePicker } from '@/components/PersianDatePicker';
import { supabase } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-[#12151C]">
      <Header />
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[rgba(237,234,227,0.08)] pb-3">
          <Link
            href="/terms"
            className="p-1.5 rounded text-[#8C8F9B] hover:text-[#EDEAE3] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[#EDEAE3]">
              ثبت ترم جدید
            </h1>
            <p className="text-xs font-light text-[#8C8F9B]">
              نام و بازه زمانی ترم را مشخص کنید.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-light">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-lg bg-[#1B1F29] border border-[rgba(237,234,227,0.08)] flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-normal text-[#8C8F9B]">
              نام ترم <span className="text-[#C08A4E]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: ترم پاییز ۱۴۰۴"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2.5 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] placeholder-[#8C8F9B]/50 text-xs focus:outline-none focus:border-[#C08A4E] transition-colors"
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

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#12151C] border-[rgba(237,234,227,0.2)] accent-[#C08A4E]"
            />
            <label htmlFor="isActive" className="text-xs font-light text-[#8C8F9B]">
              این ترم به عنوان ترم فعال تنظیم شود
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded bg-[#C08A4E] hover:bg-[#AA773F] text-[#12151C] font-bold text-xs transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره ترم'}
          </button>
        </form>
      </main>
    </div>
  );
}
