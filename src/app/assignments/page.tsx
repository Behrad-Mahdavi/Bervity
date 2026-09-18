'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { AssignmentList } from '@/components/AssignmentList';
import { Assignment } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Plus } from 'lucide-react';

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
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_done: !currentStatus } : a))
    );

    const res = await fetch(`/api/assignments/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: !currentStatus }),
    });

    if (!res.ok) {
      fetchAssignments();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#12151C]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-8">
        
        {/* Top bar */}
        <div className="flex items-baseline justify-between border-b border-[rgba(237,234,227,0.08)] pb-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#EDEAE3]">
              تکالیف و پروژه‌ها
            </h1>
            <p className="text-xs font-light text-[#8C8F9B] mt-0.5">
              یادآوری ۲۴ ساعت قبل و در موعدهای فوری به تلگرام ارسال می‌شود.
            </p>
          </div>

          <Link
            href="/assignments/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#C08A4E] hover:bg-[#AA773F] text-[#12151C] text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تکلیف جدید</span>
          </Link>
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="text-center p-12 text-[#8C8F9B] text-xs font-light">
            در حال دریافت تکالیف...
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
