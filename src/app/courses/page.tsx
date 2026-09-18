'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Course, Term, PERSIAN_DAYS } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toPersianDigits, formatTime } from '@/lib/time';
import { Plus, MapPin, Trash2 } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-[#12151C]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-8">
        
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[rgba(237,234,227,0.08)] pb-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#EDEAE3]">
              دروس و برنامه جلسات
            </h1>
            <p className="text-xs font-light text-[#8C8F9B] mt-0.5">
              لیست دروس هفتگی و زمان برگزاری هر جلسه.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {terms.length > 0 && (
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="px-2.5 py-1.5 rounded bg-[#1B1F29] border border-[rgba(237,234,227,0.1)] text-xs text-[#EDEAE3] focus:outline-none"
              >
                <option value="all">همه ترم‌ها</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <Link
              href="/courses/new"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#C08A4E] hover:bg-[#AA773F] text-[#12151C] text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>درس جدید</span>
            </Link>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center p-12 text-[#8C8F9B] text-xs font-light">
            در حال دریافت دروس...
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 border border-[rgba(237,234,227,0.06)] bg-[#1B1F29] rounded-lg text-center">
            <p className="text-xs font-light text-[#8C8F9B] mb-4">
              هنوز درسی ثبت نشده است.
            </p>
            <Link
              href="/courses/new"
              className="px-4 py-2 rounded bg-[#C08A4E] text-[#12151C] text-xs font-bold"
            >
              ثبت اولین درس
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-5 rounded-lg bg-[#1B1F29] border border-[rgba(237,234,227,0.08)] flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-[#EDEAE3]">
                      {course.name}
                    </h3>
                    {course.location && (
                      <p className="text-xs font-light text-[#8C8F9B] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#8C8F9B]" />
                        <span>{course.location}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="p-1 text-[#8C8F9B] hover:text-[#EDEAE3] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sessions */}
                <div className="pt-3 border-t border-[rgba(237,234,227,0.08)] flex flex-col gap-1.5">
                  <span className="text-[11px] font-normal text-[#8C8F9B]">
                    جلسات هفتگی:
                  </span>
                  {course.sessions && course.sessions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {course.sessions.map((sess) => {
                        const dayName = PERSIAN_DAYS.find((d) => d.id === sess.day_of_week)?.name || 'نامشخص';
                        return (
                          <div
                            key={sess.id}
                            className="px-2 py-1 rounded border border-[rgba(237,234,227,0.08)] bg-[#12151C] text-xs text-[#EDEAE3] flex items-baseline gap-1"
                          >
                            <span className="text-[#C08A4E] font-medium">{dayName}:</span>
                            <span className="font-bold">{toPersianDigits(formatTime(sess.start_time))}</span>
                            <span className="text-[10px] font-light text-[#8C8F9B]">تا</span>
                            <span className="font-normal text-[#8C8F9B]">{toPersianDigits(formatTime(sess.end_time))}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs font-light text-[#8C8F9B]">
                      جلسه‌ای ثبت نشده است.
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
