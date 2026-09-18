'use client';

import React, { useState } from 'react';
import { Course, CourseSession, PERSIAN_DAYS } from '@/lib/types';
import { toPersianDigits, formatTime, getPersianDayOfWeek, getTehranDate } from '@/lib/time';
import { Clock, MapPin, AlertCircle, CheckCircle2, Ban } from 'lucide-react';

interface WeeklyScheduleViewProps {
  courses: Course[];
  todayDateStr: string; // YYYY-MM-DD
  cancelledCourseIds: string[]; // IDs of courses cancelled for today
  onToggleCancelToday?: (courseId: string, isCurrentlyCancelled: boolean) => Promise<void>;
}

export function WeeklyScheduleView({
  courses,
  todayDateStr,
  cancelledCourseIds,
  onToggleCancelToday,
}: WeeklyScheduleViewProps) {
  const currentPersianDay = getPersianDayOfWeek(getTehranDate());
  const [selectedDay, setSelectedDay] = useState<number>(currentPersianDay);
  const [togglingCourseId, setTogglingCourseId] = useState<string | null>(null);

  // Flatten sessions with their parent course info
  const daySessions = courses.flatMap((course) => {
    return (course.sessions || [])
      .filter((s) => s.day_of_week === selectedDay)
      .map((session) => ({
        session,
        course,
        isCancelledToday: cancelledCourseIds.includes(course.id) && selectedDay === currentPersianDay,
      }));
  }).sort((a, b) => a.session.start_time.localeCompare(b.session.start_time));

  const handleCancelClick = async (courseId: string, isCancelled: boolean) => {
    if (!onToggleCancelToday) return;
    setTogglingCourseId(courseId);
    try {
      await onToggleCancelToday(courseId, isCancelled);
    } finally {
      setTogglingCourseId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Day Selector Tabs */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-1.5 bg-slate-900/70 border border-white/5 rounded-2xl">
        {PERSIAN_DAYS.map((day) => {
          const isSelected = selectedDay === day.id;
          const isToday = currentPersianDay === day.id;

          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`flex flex-col items-center justify-center py-2 sm:py-3 px-1 rounded-xl transition-all relative ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {isToday && (
                <span className="absolute -top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <span className="text-xs sm:text-sm font-bold">{day.name}</span>
              <span className="text-[10px] opacity-70 mt-0.5">
                {isToday ? 'امروز' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Class Sessions List for Selected Day */}
      <div className="flex flex-col gap-3">
        {daySessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-slate-900/40 border border-white/5 rounded-2xl text-center">
            <Clock className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">
              هیچ کلاسی برای {PERSIAN_DAYS[selectedDay].name} ثبت نشده است.
            </p>
          </div>
        ) : (
          daySessions.map(({ session, course, isCancelledToday }) => {
            const isToday = selectedDay === currentPersianDay;
            const isProcessing = togglingCourseId === course.id;

            return (
              <div
                key={session.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCancelledToday
                    ? 'bg-rose-950/20 border-rose-500/30 opacity-70'
                    : 'bg-slate-900/60 border-white/5 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-center gap-3.5 mb-3 sm:mb-0">
                  <div
                    className="w-3.5 h-12 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: course.color || '#6366f1' }}
                  />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">
                        {course.name}
                      </h4>
                      {isCancelledToday && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          کنسل شده
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {toPersianDigits(formatTime(session.start_time))} تا{' '}
                        {toPersianDigits(formatTime(session.end_time))}
                      </span>
                      {course.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {course.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cancel/Uncancel Action for today's classes */}
                {isToday && onToggleCancelToday && (
                  <button
                    onClick={() => handleCancelClick(course.id, isCancelledToday)}
                    disabled={isProcessing}
                    className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 self-end sm:self-center ${
                      isCancelledToday
                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {isCancelledToday ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>برقراری مجدد کلاس</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>لغو کلاس امروز</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
