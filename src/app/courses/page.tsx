'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Course, Term, PERSIAN_DAYS } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toPersianDigits, formatTime } from '@/lib/time';
import { Plus, BookOpen, Clock, MapPin, Trash2, Calendar } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const { data: termsData } = await supabase
      .from('terms')
      .select('*')
      .order('created_at', { ascending: false });

    if (termsData) {
      setTerms(termsData as Term[]);
    }

    let query = supabase
      .from('courses')
      .select(`
        *,
        sessions:course_sessions(*)
      `)
      .order('created_at', { ascending: false });

    if (selectedTermId !== 'all') {
      query = query.eq('term_id', selectedTermId);
    }

    const { data: coursesData } = await query;
    if (coursesData) {
      setCourses(coursesData as Course[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedTermId]);

  const deleteCourse = async (id: string) => {
    if (!confirm('آیا از حذف این درس مطمئن هستید؟ تمام جلسات و تکالیف مربوط به آن حذف خواهند شد.')) {
      return;
    }
    await supabase.from('courses').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              درس‌ها و برنامه‌های هفتگی
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              لیست دروس ثبت‌شده و جلسات هفتگی مربوط به هر درس.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Term Filter */}
            {terms.length > 0 && (
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">همه ترم‌ها</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_active ? '(فعال)' : ''}
                  </option>
                ))}
              </select>
            )}

            <Link
              href="/courses/new"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>درس جدید</span>
            </Link>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center p-12 text-slate-400 text-sm">
            در حال بارگذاری درس‌ها...
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-white/5 rounded-3xl text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">هیچ درسی ثبت نشده است</h3>
            <p className="text-xs text-slate-400 mb-6">
              اولین درس و زمان برگزاری جلسات هفتگی آن را اضافه کنید.
            </p>
            <Link
              href="/courses/new"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              افزودن اولین درس
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-10 rounded-full"
                      style={{ backgroundColor: course.color || '#6366f1' }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {course.name}
                      </h3>
                      {course.location && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {course.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sessions list */}
                <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    جلسات هفتگی:
                  </span>
                  {course.sessions && course.sessions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {course.sessions.map((sess) => {
                        const dayName = PERSIAN_DAYS.find((d) => d.id === sess.day_of_week)?.name || 'نامشخص';
                        return (
                          <div
                            key={sess.id}
                            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300 flex items-center gap-1.5 font-medium"
                          >
                            <span className="text-indigo-400 font-bold">{dayName}:</span>
                            <span>{toPersianDigits(formatTime(sess.start_time))} تا {toPersianDigits(formatTime(sess.end_time))}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400/80">
                      هیچ جلسه‌ای برای این درس تعریف نشده است.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
