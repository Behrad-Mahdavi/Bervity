'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { PersianDatePicker } from '@/components/PersianDatePicker';
import { Course } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Clock } from 'lucide-react';

export default function NewAssignmentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string>('none');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [dueTime, setDueTime] = useState('23:59');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourses() {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .order('name', { ascending: true });

      if (data && data.length > 0) {
        setCourses(data as Course[]);
        setCourseId(data[0].id);
      }
    }
    loadCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('لطفاً عنوان تکلیف را وارد کنید.');
      return;
    }
    setLoading(true);
    setError('');

    const dueIsoString = new Date(`${dueDate}T${dueTime}:00`).toISOString();

    const { error: insertError } = await supabase.from('assignments').insert({
      course_id: courseId === 'none' ? null : courseId,
      title: title.trim(),
      due_at: dueIsoString,
      is_done: false,
      notes: notes.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push('/assignments');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#12151C]">
      <Header />
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[rgba(237,234,227,0.08)] pb-3">
          <Link
            href="/assignments"
            className="p-1.5 rounded text-[#8C8F9B] hover:text-[#EDEAE3] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[#EDEAE3]">
              ثبت تکلیف جدید
            </h1>
            <p className="text-xs font-light text-[#8C8F9B]">
              مشخصات و زمان تحویل تکلیف را وارد کنید.
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
          {/* Course Selector */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-normal text-[#8C8F9B]">
              درس مربوطه
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="px-3 py-2.5 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] text-xs focus:outline-none focus:border-[#C08A4E]"
            >
              <option value="none">بدون درس / کار عمومی و شخصی</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-normal text-[#8C8F9B]">
              عنوان تکلیف <span className="text-[#C08A4E]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: حل تمرین فصل سوم"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2.5 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] placeholder-[#8C8F9B]/50 text-xs focus:outline-none focus:border-[#C08A4E] transition-colors"
            />
          </div>

          {/* Date & Time */}
          <div className="flex flex-col gap-4">
            <PersianDatePicker
              label="تاریخ موعد تحویل (ددلاین)"
              value={dueDate}
              onChange={setDueDate}
              required
            />

            <div className="flex flex-col gap-1.5 text-right">
              <label className="text-xs font-normal text-[#8C8F9B] flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#C08A4E]" />
                ساعت دقیق تحویل
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="px-3 py-2 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] text-xs focus:outline-none focus:border-[#C08A4E]"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-normal text-[#8C8F9B]">
              توضیحات تکمیلی (اختیاری)
            </label>
            <textarea
              rows={3}
              placeholder="یادداشت‌های اضافی..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="px-3 py-2 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] placeholder-[#8C8F9B]/50 text-xs focus:outline-none focus:border-[#C08A4E] transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded bg-[#C08A4E] hover:bg-[#AA773F] text-[#12151C] font-bold text-xs transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'در حال ثبت...' : 'ذخیره تکلیف'}
          </button>
        </form>
      </main>
    </div>
  );
}
