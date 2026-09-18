'use client';

import React, { useState } from 'react';
import { Course, CourseSession, PERSIAN_DAYS } from '@/lib/types';
import { toPersianDigits, formatTime, getPersianDayOfWeek, getTehranDate } from '@/lib/time';
import { MapPin, Ban, RotateCcw } from 'lucide-react';

interface WeeklyScheduleViewProps {
  courses: Course[];
  todayDateStr: string;
  cancelledCourseIds: string[];
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
    <div className="flex flex-col gap-4">
      {/* Day Selector — Editorial Horizontal Row */}
      <div className="flex items-center justify-between border-b border-[rgba(237,234,227,0.08)] pb-1 overflow-x-auto">
        {PERSIAN_DAYS.map((day) => {
          const isSelected = selectedDay === day.id;
          const isToday = currentPersianDay === day.id;

          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`flex flex-col items-center py-2 px-3 sm:px-4 rounded-none transition-colors relative ${
                isSelected
                  ? 'text-[#C08A4E]'
                  : 'text-[#8C8F9B] hover:text-[#EDEAE3]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm ${isSelected ? 'font-black' : 'font-medium'}`}>
                  {day.name}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C08A4E]"></span>
                )}
              </div>
              {isSelected && (
                <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#C08A4E]"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Class Sessions List */}
      <div className="flex flex-col gap-2.5">
        {daySessions.length === 0 ? (
          <div className="p-10 border border-[rgba(237,234,227,0.06)] bg-[#1B1F29] rounded-lg text-center">
            <p className="text-xs font-light text-[#8C8F9B]">
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
                className={`p-4 sm:p-5 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCancelledToday
                    ? 'bg-[#1B1F29]/40 border-[rgba(237,234,227,0.04)] opacity-50'
                    : 'bg-[#1B1F29] border-[rgba(237,234,227,0.08)]'
                }`}
              >
                {/* Left: Time contrast (Extreme Weight Contrast: 900 vs 300) */}
                <div className="flex items-baseline gap-4 sm:gap-6">
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="text-xl sm:text-2xl font-black text-[#EDEAE3] tracking-tight">
                      {toPersianDigits(formatTime(session.start_time))}
                    </span>
                    <span className="text-xs font-light text-[#8C8F9B] px-1">تا</span>
                    <span className="text-sm sm:text-base font-normal text-[#8C8F9B]">
                      {toPersianDigits(formatTime(session.end_time))}
                    </span>
                  </div>

                  <div className="h-4 w-[1px] bg-[rgba(237,234,227,0.1)] hidden sm:block"></div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-semibold text-[#EDEAE3]">
                        {course.name}
                      </span>
                      {isCancelledToday && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded border border-[rgba(237,234,227,0.15)] text-[#8C8F9B]">
                          لغو شده
                        </span>
                      )}
                    </div>
                    {course.location && (
                      <div className="flex items-center gap-1 text-xs font-light text-[#8C8F9B]">
                        <MapPin className="w-3 h-3 text-[#8C8F9B]" />
                        <span>{course.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                {isToday && onToggleCancelToday && (
                  <button
                    onClick={() => handleCancelClick(course.id, isCancelledToday)}
                    disabled={isProcessing}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors self-end sm:self-auto flex items-center gap-1.5 font-light ${
                      isCancelledToday
                        ? 'border-[rgba(237,234,227,0.15)] text-[#EDEAE3] hover:border-[#EDEAE3]'
                        : 'border-[rgba(237,234,227,0.08)] text-[#8C8F9B] hover:text-[#EDEAE3]'
                    }`}
                  >
                    {isCancelledToday ? (
                      <>
                        <RotateCcw className="w-3 h-3 text-[#C08A4E]" />
                        <span>برقراری مجدد</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3 h-3" />
                        <span>لغو امروز</span>
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
