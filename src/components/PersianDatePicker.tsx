'use client';

import React, { useState, useEffect } from 'react';
import { toJalaali, toGregorian, toPersianDigits } from '@/lib/time';

interface PersianDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export function PersianDatePicker({ value, onChange, label, required }: PersianDatePickerProps) {
  const [year, setYear] = useState<number>(1404);
  const [month, setMonth] = useState<number>(7);
  const [day, setDay] = useState<number>(1);

  useEffect(() => {
    if (value) {
      const parts = value.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        const { jy, jm, jd } = toJalaali(parts[0], parts[1], parts[2]);
        setYear(jy);
        setMonth(jm);
        setDay(jd);
      }
    } else {
      const now = new Date();
      const { jy, jm, jd } = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      setYear(jy);
      setMonth(jm);
      setDay(jd);
    }
  }, [value]);

  const updateDate = (newYear: number, newMonth: number, newDay: number) => {
    setYear(newYear);
    setMonth(newMonth);
    setDay(newDay);
    const { gy, gm, gd } = toGregorian(newYear, newMonth, newDay);
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const formattedIso = `${gy}-${pad(gm)}-${pad(gd)}`;
    onChange(formattedIso);
  };

  const years = [1403, 1404, 1405, 1406];
  const maxDays = month <= 6 ? 31 : month <= 11 ? 30 : 29;
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-1.5 text-right w-full">
      {label && (
        <label className="text-xs font-normal text-[#8C8F9B]">
          {label} {required && <span className="text-[#C08A4E]">*</span>}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        {/* روز */}
        <select
          value={day}
          onChange={(e) => updateDate(year, month, Number(e.target.value))}
          className="bg-[#12151C] border border-[rgba(237,234,227,0.1)] rounded px-3 py-2 text-xs text-[#EDEAE3] focus:outline-none focus:border-[#C08A4E] transition-colors"
        >
          {days.map((d) => (
            <option key={d} value={d} className="bg-[#1B1F29] text-[#EDEAE3]">
              {toPersianDigits(d)}
            </option>
          ))}
        </select>

        {/* ماه */}
        <select
          value={month}
          onChange={(e) => {
            const m = Number(e.target.value);
            const currentMaxDays = m <= 6 ? 31 : m <= 11 ? 30 : 29;
            const validDay = day > currentMaxDays ? currentMaxDays : day;
            updateDate(year, m, validDay);
          }}
          className="bg-[#12151C] border border-[rgba(237,234,227,0.1)] rounded px-2 py-2 text-xs text-[#EDEAE3] focus:outline-none focus:border-[#C08A4E] transition-colors"
        >
          {PERSIAN_MONTHS.map((mName, idx) => (
            <option key={idx + 1} value={idx + 1} className="bg-[#1B1F29] text-[#EDEAE3]">
              {mName}
            </option>
          ))}
        </select>

        {/* سال */}
        <select
          value={year}
          onChange={(e) => updateDate(Number(e.target.value), month, day)}
          className="bg-[#12151C] border border-[rgba(237,234,227,0.1)] rounded px-3 py-2 text-xs text-[#EDEAE3] focus:outline-none focus:border-[#C08A4E] transition-colors"
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-[#1B1F29] text-[#EDEAE3]">
              {toPersianDigits(y)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
