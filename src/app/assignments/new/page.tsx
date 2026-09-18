'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { PersianDatePicker } from '@/components/PersianDatePicker';
import { Course } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Save, Clock, BookOpen } from 'lucide-react';

export default function NewAssignmentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string>('none');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    // Default tomorrow
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

    // Combine date and time in ISO format
    // Note: dueDate is YYYY-MM-DD, dueTime is HH:mm
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
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/assignments"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              ثبت تکلیف جدید
            </h1>
            <p className="text-xs text-slate-400">
              عنوان و موعد تحویل تکلیف را جهت ارسال نوتیفیکیشن ثبت کنید.
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
          {/* Course Selector */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300">
              درس مربوطه
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="none">بدون درس / تکلیف شخصی یا عمومی</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Title */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300">
              عنوان تکلیف <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: تمرین سری سوم - طراحی الگوریتم"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Persian Date Picker & Time */}
          <div className="flex flex-col gap-4">
            <PersianDatePicker
              label="تاریخ موعد تحویل (ددلاین)"
              value={dueDate}
              onChange={setDueDate}
              required
            />

            <div className="flex flex-col gap-1.5 text-right">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                ساعت دقیق موعد تحویل
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300">
              توضیحات تکمیلی (اختیاری)
            </label>
            <textarea
              rows={3}
              placeholder="مثلاً: فایل زیپ به ایمیل استاد ارسال شود..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'در حال ثبت...' : 'ذخیره تکلیف'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
