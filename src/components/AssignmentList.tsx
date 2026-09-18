'use client';

import React, { useState } from 'react';
import { Assignment } from '@/lib/types';
import { formatToJalaali, toPersianDigits, getTehranDate } from '@/lib/time';
import { Check, Clock } from 'lucide-react';

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
        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded border border-[rgba(237,234,227,0.15)] text-[#8C8F9B]">
          مهلت گذشته
        </span>
      );
    }
    if (diffHours <= 24) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#C08A4E]/30 text-[#C08A4E]">
          کمتر از ۲۴ ساعت
        </span>
      );
    }
    if (diffHours <= 48) {
      return (
        <span className="text-[10px] font-light px-1.5 py-0.5 rounded border border-[rgba(237,234,227,0.08)] text-[#8C8F9B]">
          فردا
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter Tabs — Editorial Subtle Switch */}
      <div className="flex items-center gap-4 border-b border-[rgba(237,234,227,0.08)] pb-1">
        <button
          onClick={() => setFilter('pending')}
          className={`pb-1 text-xs transition-colors flex items-center gap-1.5 ${
            filter === 'pending'
              ? 'text-[#C08A4E] font-black border-b-2 border-[#C08A4E] -mb-[2px]'
              : 'text-[#8C8F9B] font-light hover:text-[#EDEAE3]'
          }`}
        >
          <span>در انتظار انجام</span>
          <span className="text-[10px] font-normal opacity-70">
            ({toPersianDigits(assignments.filter((a) => !a.is_done).length)})
          </span>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`pb-1 text-xs transition-colors flex items-center gap-1.5 ${
            filter === 'completed'
              ? 'text-[#6B8F71] font-black border-b-2 border-[#6B8F71] -mb-[2px]'
              : 'text-[#8C8F9B] font-light hover:text-[#EDEAE3]'
          }`}
        >
          <span>انجام‌شده</span>
          <span className="text-[10px] font-normal opacity-70">
            ({toPersianDigits(assignments.filter((a) => a.is_done).length)})
          </span>
        </button>
      </div>

      {/* Assignments List */}
      <div className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div className="p-8 border border-[rgba(237,234,227,0.06)] bg-[#1B1F29] rounded-lg text-center">
            <p className="text-xs font-light text-[#8C8F9B]">
              {filter === 'pending'
                ? 'تکلیفی در انتظار انجام وجود ندارد.'
                : 'هنوز تکلیفی به پایان نرسیده است.'}
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
                className={`p-3.5 sm:p-4 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                  assignment.is_done
                    ? 'bg-[#1B1F29]/40 border-[rgba(237,234,227,0.04)] opacity-60'
                    : 'bg-[#1B1F29] border-[rgba(237,234,227,0.08)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Flat geometric checkbox */}
                  <button
                    onClick={() => handleToggle(assignment.id, assignment.is_done)}
                    disabled={isProcessing}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      assignment.is_done
                        ? 'bg-[#6B8F71] border-[#6B8F71] text-[#12151C]'
                        : 'border-[rgba(237,234,227,0.2)] hover:border-[#C08A4E]'
                    }`}
                  >
                    {assignment.is_done && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm font-semibold tracking-tight ${
                          assignment.is_done ? 'line-through text-[#8C8F9B]' : 'text-[#EDEAE3]'
                        }`}
                      >
                        {assignment.title}
                      </h4>
                      {!assignment.is_done && getDeadlineBadge(assignment.due_at)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C8F9B]">
                      {assignment.course && (
                        <span className="font-normal text-[#EDEAE3]">
                          {assignment.course.name}
                        </span>
                      )}

                      <span className="font-light text-[#8C8F9B] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8C8F9B]" />
                        {toPersianDigits(shamsiDue)} — {dueClock}
                      </span>
                    </div>

                    {assignment.notes && (
                      <p className="text-xs font-light text-[#8C8F9B] mt-1 border-r border-[rgba(237,234,227,0.15)] pr-2">
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
