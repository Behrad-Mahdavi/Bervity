'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { formatToJalaali, toPersianDigits, getTehranDate } from '@/lib/time';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  CheckSquare, 
  Send, 
  LogOut, 
  Bell, 
  PlusCircle,
  Menu,
  X
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [shamsiDate, setShamsiDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [testingTelegram, setTestingTelegram] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const tehranNow = getTehranDate();
      setShamsiDate(formatToJalaali(tehranNow));
      setCurrentTime(
        tehranNow.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const res = await fetch('/api/telegram/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('پیام تستی با موفقیت به اکانت تلگرام شما ارسال شد! 🎉');
      } else {
        alert(`خطا در ارسال پیام تلگرام: ${data.error || 'بررسی کنید توکن و چت‌آیدی ست شده باشند.'}`);
      }
    } catch (e: any) {
      alert(`خطا در اتصال: ${e.message}`);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { name: 'داشبورد', href: '/', icon: CalendarIcon },
    { name: 'ترم‌ها', href: '/terms', icon: CalendarIcon },
    { name: 'درس‌ها و برنامه', href: '/courses', icon: BookOpen },
    { name: 'تکالیف', href: '/assignments', icon: CheckSquare },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090d16]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl tracking-tight">B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-wide flex items-center gap-1.5">
                Brevity
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Study
                </span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                یادآور هوشمند کلاس و تکالیف
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Date Badge & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {shamsiDate && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{toPersianDigits(shamsiDate)}</span>
              <span className="text-slate-500">|</span>
              <span className="font-semibold text-indigo-300">{currentTime}</span>
            </div>
          )}

          {/* Test Telegram button */}
          <button
            onClick={handleTestTelegram}
            disabled={testingTelegram}
            title="تست ارسال پیام به تلگرام"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-medium transition-all disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تست تلگرام</span>
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title="خروج از حساب"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 bg-white/5 border border-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#090d16]/95 backdrop-blur-2xl p-4 flex flex-col gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
