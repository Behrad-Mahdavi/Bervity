'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { WeeklyScheduleView } from '@/components/WeeklyScheduleView';
import { AssignmentList } from '@/components/AssignmentList';
import { Course, Assignment, Term } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getPersianDayOfWeek, getTehranDate, toPersianDigits, formatTime } from '@/lib/time';
import { Plus, BookOpen, ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [cancelledCourseIds, setCancelledCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const tehranNow = getTehranDate();
  const todayDateStr = tehranNow.toISOString().split('T')[0];
  const todayDayOfWeek = getPersianDayOfWeek(tehranNow);
  const currentMinutes = tehranNow.getHours() * 60 + tehranNow.getMinutes();

  const fetchData = async () => {
    setLoading(true);

    // 1. Fetch active term
    const { data: termsData } = await supabase
      .from('terms')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', todayDateStr)
      .gte('end_date', todayDateStr)
      .maybeSingle();

    if (termsData) {
      setActiveTerm(termsData as Term);
    }

    // 2. Fetch courses with sessions
    const { data: coursesData } = await supabase
      .from('courses')
      .select(`
        *,
        sessions:course_sessions(*)
      `);

    if (coursesData) {
      setCourses(coursesData as Course[]);
    }

    // 3. Fetch cancellations
    const { data: cancellations } = await supabase
      .from('course_cancellations')
      .select('course_id')
      .eq('cancelled_date', todayDateStr);

    if (cancellations) {
      setCancelledCourseIds(cancellations.map((c) => c.course_id));
    }

    // 4. Fetch assignments
    const { data: assignData } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(*)
      `)
      .order('due_at', { ascending: true });

    if (assignData) {
      setAssignments(assignData as Assignment[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleCancelToday = async (courseId: string, isCurrentlyCancelled: boolean) => {
    if (isCurrentlyCancelled) {
      await supabase
        .from('course_cancellations')
        .delete()
        .eq('course_id', courseId)
        .eq('cancelled_date', todayDateStr);
      setCancelledCourseIds((prev) => prev.filter((id) => id !== courseId));
    } else {
      await supabase.from('course_cancellations').insert({
        course_id: courseId,
        cancelled_date: todayDateStr,
        reason: 'لغو دستی توسط کاربر',
      });
      setCancelledCourseIds((prev) => [...prev, courseId]);
    }
  };

  const handleToggleAssignment = async (id: string, currentStatus: boolean) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_done: !currentStatus } : a))
    );

    await fetch(`/api/assignments/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: !currentStatus }),
    });
  };

  // Find next class today (Single focal point)
  const todaySessions = courses.flatMap((course) => {
    return (course.sessions || [])
      .filter((s) => s.day_of_week === todayDayOfWeek)
      .map((session) => {
        const [h, m] = session.start_time.split(':').map(Number);
        return {
          session,
          course,
          startMinutes: h * 60 + m,
          isCancelled: cancelledCourseIds.includes(course.id),
        };
      });
  }).filter((item) => !item.isCancelled).sort((a, b) => a.startMinutes - b.startMinutes);

  const nextClass = todaySessions.find((s) => s.startMinutes >= currentMinutes) || todaySessions[0];

  const todayClassesCount = todaySessions.length;
  const pendingAssignments = assignments.filter((a) => !a.is_done);
  const urgentAssignmentsCount = pendingAssignments.filter((a) => {
    const diffHours = (new Date(a.due_at).getTime() - tehranNow.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#12151C]">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-10 pb-20">
        
        {/* ONE BOLD FOCAL POINT: Next Class / Today's State */}
        <section className="p-6 sm:p-8 rounded-lg bg-[#1B1F29] border border-[rgba(237,234,227,0.08)] flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#C08A4E] tracking-wider uppercase">
                {activeTerm ? activeTerm.name : 'ترم جاری'}
              </span>
              <span className="text-[rgba(237,234,227,0.2)]">|</span>
              <span className="text-[11px] font-light text-[#8C8F9B]">
                {nextClass ? 'رویداد بعدی امروز' : 'برنامه امروز'}
              </span>
            </div>

            {nextClass ? (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-baseline gap-3">
                  {/* Extreme bold contrast: large time */}
                  <span className="text-4xl sm:text-6xl font-black text-[#EDEAE3] tracking-tighter">
                    {toPersianDigits(formatTime(nextClass.session.start_time))}
                  </span>
                  <span className="text-sm font-light text-[#8C8F9B]">
                    {nextClass.course.name}
                  </span>
                </div>
                {nextClass.course.location && (
                  <span className="text-xs font-light text-[#8C8F9B]">
                    مکان: {nextClass.course.location}
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <h2 className="text-2xl sm:text-3xl font-black text-[#EDEAE3] tracking-tight">
                  امروز کلاسی باقی نمانده است
                </h2>
                <p className="text-xs font-light text-[#8C8F9B] mt-1">
                  می‌توانید تکالیف آینده را بررسی یا برنامه فردا را آماده کنید.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions (Quiet, flat buttons) */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/assignments/new"
              className="px-4 py-2.5 rounded text-xs font-bold bg-[#C08A4E] hover:bg-[#AA773F] text-[#12151C] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت تکلیف</span>
            </Link>
            <Link
              href="/courses/new"
              className="px-4 py-2.5 rounded text-xs font-medium border border-[rgba(237,234,227,0.12)] hover:border-[rgba(237,234,227,0.3)] text-[#EDEAE3] transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#8C8F9B]" />
              <span>درس جدید</span>
            </Link>
          </div>
        </section>

        {/* Quiet hairline stats grid */}
        <section className="grid grid-cols-3 border border-[rgba(237,234,227,0.08)] bg-[#1B1F29] rounded-lg divide-x divide-x-reverse divide-[rgba(237,234,227,0.08)]">
          <div className="p-4 sm:p-5 flex flex-col gap-1">
            <span className="text-[11px] font-light text-[#8C8F9B]">کلاس‌های امروز</span>
            <span className="text-xl sm:text-3xl font-black text-[#EDEAE3]">
              {toPersianDigits(todayClassesCount)}
            </span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col gap-1">
            <span className="text-[11px] font-light text-[#8C8F9B]">تکالیف در انتظار</span>
            <span className="text-xl sm:text-3xl font-black text-[#EDEAE3]">
              {toPersianDigits(pendingAssignments.length)}
            </span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col gap-1">
            <span className="text-[11px] font-light text-[#8C8F9B]">موعد ۲۴ ساعت</span>
            <span className={`text-xl sm:text-3xl font-black ${urgentAssignmentsCount > 0 ? 'text-[#C08A4E]' : 'text-[#EDEAE3]'}`}>
              {toPersianDigits(urgentAssignmentsCount)}
            </span>
          </div>
        </section>

        {/* Weekly Schedule Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between border-b border-[rgba(237,234,227,0.08)] pb-2">
            <h2 className="text-sm font-bold text-[#EDEAE3] tracking-wide uppercase">
              برنامه هفتگی
            </h2>
            <Link
              href="/courses"
              className="text-xs font-light text-[#8C8F9B] hover:text-[#C08A4E] transition-colors flex items-center gap-1"
            >
              <span>مشاهده و ویرایش دروس</span>
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>

          <WeeklyScheduleView
            courses={courses}
            todayDateStr={todayDateStr}
            cancelledCourseIds={cancelledCourseIds}
            onToggleCancelToday={handleToggleCancelToday}
          />
        </section>

        {/* Pending Assignments Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between border-b border-[rgba(237,234,227,0.08)] pb-2">
            <h2 className="text-sm font-bold text-[#EDEAE3] tracking-wide uppercase">
              تکالیف و پروژه‌ها
            </h2>
            <Link
              href="/assignments"
              className="text-xs font-light text-[#8C8F9B] hover:text-[#C08A4E] transition-colors flex items-center gap-1"
            >
              <span>تمام تکالیف</span>
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>

          <AssignmentList
            assignments={assignments}
            onToggleDone={handleToggleAssignment}
          />
        </section>
      </main>
    </div>
  );
}
