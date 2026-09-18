'use client';

import React, { useState } from 'react';
import { Assignment } from '@/lib/types';
import { formatToJalaali, toPersianDigits, getTehranDate } from '@/lib/time';
import { CheckCircle, Circle, Clock, BookOpen, AlertTriangle } from 'lucide-react';

interface AssignmentListProps {
  assignments: Assignment[];
  onToggleDone: (id: string, currentStatus: boolean) => Promise<void>;
}

export function AssignmentList({ assignments, onToggleDone }: AssignmentListProps) {
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const tehranNow = getTehranDate().getTime();

  const filtered = assignments.filter((a) => (filter === 'pending' ? !a.is_done : a.is_done));

  const sorted = [...filtered].sort((a, b) => {
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      await onToggleDone(id, currentStatus);
    } finally {
      setTogglingId(null);
    }
  };

  const getDeadlineBadge = (dueIso: string) => {
    const dueTime = new Date(dueIso).getTime();
    const diffHours = (dueTime - tehranNow) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3" />
          مهلت گذشته
        </span>
      );
    }
    if (diffHours <= 24) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
          <Clock className="w-3 h-3" />
          کمتر از ۲۴ ساعت
        </span>
      );
    }
    if (diffHours <= 48) {
      return (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
          فردا
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/70 border border-white/5 rounded-xl w-fit">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'pending'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          در انتظار انجام ({toPersianDigits(assignments.filter((a) => !a.is_done).length)})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'completed'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          انجام‌شده ({toPersianDigits(assignments.filter((a) => a.is_done).length)})
        </button>
      </div>

      {/* Assignments List */}
      <div className="flex flex-col gap-2.5">
        {sorted.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-white/5 rounded-2xl">
            <p className="text-sm text-slate-400">
              {filter === 'pending'
                ? 'آفرین! هیچ تکلیف انجام‌نشده‌ای نداری 👏'
                : 'هنوز تکلیفی در لیست انجام‌شده‌ها نیست.'}
            </p>
          </div>
        ) : (
          sorted.map((assignment) => {
            const dueDate = new Date(assignment.due_at);
            const shamsiDue = formatToJalaali(dueDate);
            const dueClock = dueDate.toLocaleTimeString('fa-IR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const isProcessing = togglingId === assignment.id;

            return (
              <div
                key={assignment.id}
                className={`flex items-start sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                  assignment.is_done
                    ? 'bg-slate-900/30 border-white/5 opacity-60'
                    : 'bg-slate-900/60 border-white/5 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(assignment.id, assignment.is_done)}
                    disabled={isProcessing}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {assignment.is_done ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm sm:text-base font-bold text-white ${
                          assignment.is_done ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {assignment.title}
                      </h4>
                      {!assignment.is_done && getDeadlineBadge(assignment.due_at)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {assignment.course ? (
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: assignment.course.color || '#6366f1' }}
                          />
                          {assignment.course.name}
                        </span>
                      ) : (
                        <span className="text-slate-500">عمومی / آزاد</span>
                      )}

                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {toPersianDigits(shamsiDue)} — {dueClock}
                      </span>
                    </div>

                    {assignment.notes && (
                      <p className="text-xs text-slate-400 mt-1 bg-white/5 p-2 rounded-lg">
                        {assignment.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
