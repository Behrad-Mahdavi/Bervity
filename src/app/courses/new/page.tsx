'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Term, PERSIAN_DAYS } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Save, Plus, Trash2, Clock } from 'lucide-react';

interface SessionInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const COLOR_PRESETS = [
  { name: 'نیلی', hex: '#6366f1' },
  { name: 'بنفش', hex: '#a855f7' },
  { name: 'زمردی', hex: '#10b981' },
  { name: 'آبی آسمانی', hex: '#0ea5e9' },
  { name: 'کهربایی', hex: '#f59e0b' },
  { name: 'رز', hex: '#f43f5e' },
  { name: 'فیروزه‌ای', hex: '#14b8a6' },
];

export default function NewCoursePage() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#6366f1');
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
      setError('لطفاً یک ترم انتخاب کنید (در صورت نبود، ابتدا ترم بسازید).');
      return;
    }
    setLoading(true);
    setError('');

    // 1. Insert course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        term_id: selectedTermId,
        name: name.trim(),
        location: location.trim() || null,
        color: color,
      })
      .select()
      .single();

    if (courseError || !courseData) {
      setError(courseError?.message || 'خطا در ثبت درس');
      setLoading(false);
      return;
    }

    // 2. Insert sessions
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
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              ثبت درس و جلسات هفتگی
            </h1>
            <p className="text-xs text-slate-400">
              مشخصات درس، مکان و زمان‌بندی روزهای برگزاری را وارد کنید.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col gap-5 backdrop-blur-xl"
        >
          {/* Term selector */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300">
              ترم مربوطه <span className="text-rose-400">*</span>
            </label>
            {terms.length === 0 ? (
              <p className="text-xs text-amber-400">
                ترمی یافت نشد. ابتدا از منوی ترم‌ها، یک ترم ایجاد کنید.
              </p>
            ) : (
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_active ? '(ترم فعال)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Course Name */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300">
              نام درس <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: هوش مصنوعی"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300">
              مکان یا کلاس (اختیاری)
            </label>
            <input
              type="text"
              placeholder="مثلاً: دانشکده کامپیوتر، کلاس ۲۰۴"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Color tag presets */}
          <div className="flex flex-col gap-2 text-right">
            <label className="text-xs font-semibold text-slate-300">
              رنگ شناسه درس
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                    color === c.hex ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Weekly Sessions Builder */}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                جلسات هفتگی کلاس
              </label>
              <button
                type="button"
                onClick={addSession}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن جلسه دیگر</span>
              </button>
            </div>

            {sessions.map((sess, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col sm:flex-row items-center gap-3"
              >
                {/* Day selector */}
                <div className="w-full sm:w-1/3">
                  <select
                    value={sess.day_of_week}
                    onChange={(e) => updateSession(idx, 'day_of_week', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                  >
                    {PERSIAN_DAYS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time pickers */}
                <div className="w-full sm:w-2/3 flex items-center gap-2">
                  <input
                    type="time"
                    value={sess.start_time}
                    onChange={(e) => updateSession(idx, 'start_time', e.target.value)}
                    className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                  />
                  <span className="text-slate-500 text-xs">تا</span>
                  <input
                    type="time"
                    value={sess.end_time}
                    onChange={(e) => updateSession(idx, 'end_time', e.target.value)}
                    className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                  />

                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSession(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || terms.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-3"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'در حال ذخیره...' : 'ثبت درس و برنامه'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
