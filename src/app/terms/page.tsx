'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Term } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { formatToJalaali, toPersianDigits } from '@/lib/time';
import { Plus, Calendar, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTerms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTerms(data as Term[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const toggleTermActive = async (id: string, current: boolean) => {
    await supabase.from('terms').update({ is_active: !current }).eq('id', id);
    fetchTerms();
  };

  const deleteTerm = async (id: string) => {
    if (!confirm('آیا از حذف این ترم مطمئن هستید؟ با حذف ترم تمام درس‌ها و تکالیف مربوط به آن حذف خواهند شد.')) {
      return;
    }
    await supabase.from('terms').delete().eq('id', id);
    fetchTerms();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Page Title & Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              مدیریت ترم‌های تحصیلی
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              ترم‌های فعال به سیستم مشخص می‌کنند کدام برنامه‌های کلاسی نوتیف دریافت کنند.
            </p>
          </div>

          <Link
            href="/terms/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ترم جدید</span>
          </Link>
        </div>

        {/* Terms List */}
        {loading ? (
          <div className="text-center p-12 text-slate-400 text-sm">
            در حال بارگذاری ترم‌ها...
          </div>
        ) : terms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-white/5 rounded-3xl text-center">
            <Calendar className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">هنوز هیچ ترمی ثبت نشده است</h3>
            <p className="text-xs text-slate-400 mb-6">
              برای شروع، اولین ترم خود را ایجاد کنید.
            </p>
            <Link
              href="/terms/new"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              افزودن اولین ترم
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {terms.map((term) => (
              <div
                key={term.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {term.name}
                      </h3>
                      {term.is_active ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          فعال
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
                          غیرفعال
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                      <span>بازه زمانی:</span>
                      <span className="text-slate-200 font-medium">
                        {toPersianDigits(formatToJalaali(term.start_date))} تا {toPersianDigits(formatToJalaali(term.end_date))}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTerm(term.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[11px] text-slate-500">
                    وضعیت نوتیفیکیشن
                  </span>
                  <button
                    onClick={() => toggleTermActive(term.id, term.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
                      term.is_active
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {term.is_active ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>غیرفعال کردن</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>فعال کردن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
