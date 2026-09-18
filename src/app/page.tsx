'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { WeeklyScheduleView } from '@/components/WeeklyScheduleView';
import { AssignmentList } from '@/components/AssignmentList';
import { Course, Assignment, Term } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getPersianDayOfWeek, getTehranDate, toPersianDigits, formatToJalaali } from '@/lib/time';
import { 
  Plus, 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [cancelledCourseIds, setCancelledCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const tehranNow = getTehranDate();
  const todayDateStr = tehranNow.toISOString().split('T')[0];
  const todayDayOfWeek = getPersianDayOfWeek(tehranNow);

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

    // 3. Fetch today's cancellations (Edge case 1)
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
      // Remove cancellation
      await supabase
        .from('course_cancellations')
        .delete()
        .eq('course_id', courseId)
        .eq('cancelled_date', todayDateStr);
      setCancelledCourseIds((prev) => prev.filter((id) => id !== courseId));
    } else {
      // Add cancellation
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

  // Stats calculation
  const todayClassesCount = courses.reduce((acc, course) => {
    const hasSessionToday = (course.sessions || []).some((s) => s.day_of_week === todayDayOfWeek);
    const isCancelled = cancelledCourseIds.includes(course.id);
    return hasSessionToday && !isCancelled ? acc + 1 : acc;
  }, 0);

  const pendingAssignments = assignments.filter((a) => !a.is_done);
  const urgentAssignmentsCount = pendingAssignments.filter((a) => {
    const diffHours = (new Date(a.due_at).getTime() - tehranNow.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-8 pb-16">
        
        {/* Hero & Quick Stats */}
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex flex-col gap-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeTerm ? activeTerm.name : 'ترم فعال مشخص نشده است'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              سلام، آماده شروع یک روز پربار هستی؟
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              نوتیفیکیشن‌های تلگرام ۹۰ دقیقه قبل از هر کلاس و ۲۴ ساعت قبل از ددلاین هر تکلیف به‌صورت خودکار ارسال می‌شوند.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
            <Link
              href="/assignments/new"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>تکلیف جدید</span>
            </Link>
            <Link
              href="/courses/new"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs sm:text-sm font-bold transition-all hover:scale-102"
            >
              <BookOpen className="w-4 h-4" />
              <span>درس جدید</span>
            </Link>
          </div>
        </section>

        {/* KPI Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">کلاس‌های امروز</span>
              <span className="text-2xl font-black text-white">
                {toPersianDigits(todayClassesCount)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">تکالیف در انتظار</span>
              <span className="text-2xl font-black text-white">
                {toPersianDigits(pendingAssignments.length)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">ددلاین‌های ۲۴ ساعت آینده</span>
              <span className="text-2xl font-black text-amber-400">
                {toPersianDigits(urgentAssignmentsCount)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Weekly Schedule Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                برنامه هفتگی کلاس‌ها
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>مشاهده و ویرایش دروس</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
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
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                تکالیف و پروژه‌ها
              </h2>
            </div>
            <Link
              href="/assignments"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>تمام تکالیف</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
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
