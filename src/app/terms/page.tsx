'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Term } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { formatToJalaali, toPersianDigits } from '@/lib/time';
import { Plus, Trash2 } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-[#12151C]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-8">
        
        {/* Header bar */}
        <div className="flex items-baseline justify-between border-b border-[rgba(237,234,227,0.08)] pb-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#EDEAE3]">
              ترم‌های تحصیلی
            </h1>
            <p className="text-xs font-light text-[#8C8F9B] mt-0.5">
              تنها برای جلسات کلاسی ترم‌های فعال نوتیفیکیشن ارسال خواهد شد.
            </p>
          </div>

          <Link
            href="/terms/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#C08A4E] hover:bg-[#AA773F] text-[#12151C] text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ترم جدید</span>
          </Link>
        </div>

        {/* Terms Grid */}
        {loading ? (
          <div className="text-center p-12 text-[#8C8F9B] text-xs font-light">
            در حال دریافت اطلاعات...
          </div>
        ) : terms.length === 0 ? (
          <div className="p-12 border border-[rgba(237,234,227,0.06)] bg-[#1B1F29] rounded-lg text-center">
            <p className="text-xs font-light text-[#8C8F9B] mb-4">
              هنوز ترمی ثبت نشده است.
            </p>
            <Link
              href="/terms/new"
              className="px-4 py-2 rounded bg-[#C08A4E] text-[#12151C] text-xs font-bold"
            >
              افزودن اولین ترم
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {terms.map((term) => (
              <div
                key={term.id}
                className="p-5 rounded-lg bg-[#1B1F29] border border-[rgba(237,234,227,0.08)] flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#EDEAE3]">
                        {term.name}
                      </h3>
                      {term.is_active ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded border border-[#C08A4E]/30 text-[#C08A4E]">
                          فعال
                        </span>
                      ) : (
                        <span className="text-[10px] font-light px-1.5 py-0.2 rounded border border-[rgba(237,234,227,0.1)] text-[#8C8F9B]">
                          غیرفعال
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-light text-[#8C8F9B] mt-1">
                      {toPersianDigits(formatToJalaali(term.start_date))} تا {toPersianDigits(formatToJalaali(term.end_date))}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTerm(term.id)}
                    className="p-1 text-[#8C8F9B] hover:text-[#EDEAE3] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[rgba(237,234,227,0.08)]">
                  <span className="text-[11px] font-light text-[#8C8F9B]">
                    وضعیت ارسال نوتیفیکیشن
                  </span>
                  <button
                    onClick={() => toggleTermActive(term.id, term.is_active)}
                    className="text-xs font-normal text-[#8C8F9B] hover:text-[#EDEAE3] transition-colors"
                  >
                    {term.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
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
