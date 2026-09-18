'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Term, PERSIAN_DAYS } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';

interface SessionInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export default function NewCoursePage() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [sessions, setSessions] = useState<SessionInput[]>([
    { day_of_week: 0, start_time: '08:00', end_time: '09:30' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTerms() {
      const { data } = await supabase
        .from('terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setTerms(data as Term[]);
        const activeTerm = data.find((t) => t.is_active) || data[0];
        setSelectedTermId(activeTerm.id);
      }
    }
    loadTerms();
  }, []);

  const addSession = () => {
    setSessions([
      ...sessions,
      { day_of_week: 2, start_time: '08:00', end_time: '09:30' },
    ]);
  };

  const removeSession = (index: number) => {
    if (sessions.length <= 1) return;
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const updateSession = (index: number, field: keyof SessionInput, val: any) => {
    const updated = [...sessions];
    updated[index] = { ...updated[index], [field]: val };
    setSessions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('لطفاً نام درس را وارد کنید.');
      return;
    }
    if (!selectedTermId) {
      setError('لطفاً یک ترم انتخاب کنید.');
      return;
    }
    setLoading(true);
    setError('');

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        term_id: selectedTermId,
        name: name.trim(),
        location: location.trim() || null,
        color: '#C08A4E',
      })
      .select()
      .single();

    if (courseError || !courseData) {
      setError(courseError?.message || 'خطا در ثبت درس');
      setLoading(false);
      return;
    }

    const sessionsPayload = sessions.map((s) => ({
      course_id: courseData.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
    }));

    const { error: sessionError } = await supabase
      .from('course_sessions')
      .insert(sessionsPayload);

    if (sessionError) {
      setError(sessionError.message);
      setLoading(false);
    } else {
      router.push('/courses');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#12151C]">
      <Header />
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[rgba(237,234,227,0.08)] pb-3">
          <Link
            href="/courses"
            className="p-1.5 rounded text-[#8C8F9B] hover:text-[#EDEAE3] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[#EDEAE3]">
              ثبت درس جدید
            </h1>
            <p className="text-xs font-light text-[#8C8F9B]">
              نام درس، مکان و جلسات هفتگی را وارد کنید.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-light">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-lg bg-[#1B1F29] border border-[rgba(237,234,227,0.08)] flex flex-col gap-5"
        >
          {/* Term selector */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-normal text-[#8C8F9B]">
              ترم تحصیلی <span className="text-[#C08A4E]">*</span>
            </label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="px-3 py-2.5 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] text-xs focus:outline-none focus:border-[#C08A4E]"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_active ? '(فعال)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Course Name */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-normal text-[#8C8F9B]">
              نام درس <span className="text-[#C08A4E]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: طراحی الگوریتم"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2.5 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] placeholder-[#8C8F9B]/50 text-xs focus:outline-none focus:border-[#C08A4E] transition-colors"
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-normal text-[#8C8F9B]">
              مکان کلاس (اختیاری)
            </label>
            <input
              type="text"
              placeholder="مثلاً: کلاس ۱۰۲"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3 py-2.5 rounded bg-[#12151C] border border-[rgba(237,234,227,0.1)] text-[#EDEAE3] placeholder-[#8C8F9B]/50 text-xs focus:outline-none focus:border-[#C08A4E] transition-colors"
            />
          </div>

          {/* Weekly Sessions */}
          <div className="pt-3 border-t border-[rgba(237,234,227,0.08)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#EDEAE3]">
                جلسات هفتگی کلاس
              </label>
              <button
                type="button"
                onClick={addSession}
                className="text-xs text-[#C08A4E] hover:underline font-normal flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن جلسه دیگر</span>
              </button>
            </div>

            {sessions.map((sess, idx) => (
              <div
                key={idx}
                className="p-3 rounded border border-[rgba(237,234,227,0.08)] bg-[#12151C] flex flex-col sm:flex-row items-center gap-2.5"
              >
                <div className="w-full sm:w-1/3">
                  <select
                    value={sess.day_of_week}
                    onChange={(e) => updateSession(idx, 'day_of_week', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-[#1B1F29] border border-[rgba(237,234,227,0.1)] text-xs text-[#EDEAE3]"
                  >
                    {PERSIAN_DAYS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-2/3 flex items-center gap-2">
                  <input
                    type="time"
                    value={sess.start_time}
                    onChange={(e) => updateSession(idx, 'start_time', e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 rounded bg-[#1B1F29] border border-[rgba(237,234,227,0.1)] text-xs text-[#EDEAE3]"
                  />
                  <span className="text-[#8C8F9B] text-xs font-light">تا</span>
                  <input
                    type="time"
                    value={sess.end_time}
                    onChange={(e) => updateSession(idx, 'end_time', e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 rounded bg-[#1B1F29] border border-[rgba(237,234,227,0.1)] text-xs text-[#EDEAE3]"
                  />

                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSession(idx)}
                      className="p-1 text-[#8C8F9B] hover:text-[#EDEAE3] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || terms.length === 0}
            className="w-full py-2.5 px-4 rounded bg-[#C08A4E] hover:bg-[#AA773F] text-[#12151C] font-bold text-xs transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره درس و برنامه'}
          </button>
        </form>
      </main>
    </div>
  );
}
