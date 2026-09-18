'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { AssignmentList } from '@/components/AssignmentList';
import { Assignment } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Plus, CheckSquare } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(*)
      `)
      .order('due_at', { ascending: true });

    if (!error && data) {
      setAssignments(data as Assignment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleToggleDone = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_done: !currentStatus } : a))
    );

    const res = await fetch(`/api/assignments/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: !currentStatus }),
    });

    if (!res.ok) {
      // Revert if error
      fetchAssignments();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Page Title & Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              مدیریت تکالیف و پروژه‌ها
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              تکالیف با موعد تحویل — ۲۴ ساعت قبل و در ددلاین‌های فوری یادآوری تلگرام ارسال می‌شود.
            </p>
          </div>

          <Link
            href="/assignments/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تکلیف جدید</span>
          </Link>
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="text-center p-12 text-slate-400 text-sm">
            در حال بارگذاری تکالیف...
          </div>
        ) : (
          <AssignmentList
            assignments={assignments}
            onToggleDone={handleToggleDone}
          />
        )}
      </main>
    </div>
  );
}
