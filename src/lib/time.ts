/**
 * Jalali (Shamsi) Date and Time Utilities for Brevity
 * Based on the Jalaali algorithm with zero external dependencies
 */

export function toJalaali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

export function toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  jy = jy - 979;
  jm = jm - 1;
  jd = jd - 1;

  let j_day_no = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
  for (let i = 0; i < jm; ++i) {
    j_day_no += i < 6 ? 31 : 30;
  }
  j_day_no += jd;

  let g_day_no = j_day_no + 79;

  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no = g_day_no % 146097;

  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no = g_day_no % 36524;

    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = false;
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }

  const g_days_in_month = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (g_day_no >= g_days_in_month[gm]) {
    g_day_no -= g_days_in_month[gm];
    gm++;
  }
  return { gy, gm: gm + 1, gd: g_day_no + 1 };
}

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(str: string | number): string {
  const persianNums = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (w) => persianNums[+w]);
}

/**
 * Converts Persian/Arabic digits to English digits
 */
export function toEnglishDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Formats a Date or ISO string into Shamsi string (YYYY/MM/DD)
 */
export function formatToJalaali(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

/**
 * Maps JS getDay() (0=Sunday..6=Saturday) to Persian week (0=شنبه..6=جمعه)
 */
export function getPersianDayOfWeek(date: Date): number {
  return (date.getDay() + 1) % 7;
}

/**
 * Get current time in Tehran timezone
 */
export function getTehranDate(date: Date = new Date()): Date {
  const tehranString = date.toLocaleString('en-US', { timeZone: 'Asia/Tehran' });
  return new Date(tehranString);
}

/**
 * Formats HH:mm
 */
export function formatTime(timeStr: string): string {
  // if timeStr is HH:mm:ss, return HH:mm
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}
