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
        alert('پیام تستی با موفقیت به اکانت تلگرام شما ارسال شد.');
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
    <header className="sticky top-0 z-50 w-full bg-[#12151C] border-b border-[rgba(237,234,227,0.08)] pt-safe transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[rgba(237,234,227,0.12)] shrink-0">
              <img src="/icons/apple-touch-icon.png" alt="Brevity" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-[#EDEAE3]">
                Brevity
              </span>
              <span className="text-[11px] font-light text-[#8C8F9B] hidden sm:inline tracking-wider">
                دفترچه تحصیلی
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'text-[#C08A4E] font-bold bg-[#1B1F29] border border-[rgba(237,234,227,0.08)]'
                    : 'text-[#8C8F9B] font-normal hover:text-[#EDEAE3]'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Live Date, Time & Tools */}
        <div className="flex items-center gap-3">
          {shamsiDate && (
            <div className="hidden sm:flex items-baseline gap-2 text-xs text-[#8C8F9B]">
              <span className="font-light">{toPersianDigits(shamsiDate)}</span>
              <span className="text-[rgba(237,234,227,0.2)]">/</span>
              <span className="font-black text-[#EDEAE3]">{currentTime}</span>
            </div>
          )}

          {/* Test Telegram button */}
          <button
            onClick={handleTestTelegram}
            disabled={testingTelegram}
            title="تست ارسال پیام به تلگرام"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[rgba(237,234,227,0.08)] bg-[#1B1F29] hover:border-[#C08A4E]/40 text-[#8C8F9B] hover:text-[#EDEAE3] text-xs font-normal transition-colors disabled:opacity-50"
          >
            <Send className={`w-3 h-3 text-[#C08A4E] ${testingTelegram ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تست تلگرام</span>
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title="خروج از حساب"
            className="p-1.5 rounded-lg text-[#8C8F9B] hover:text-[#EDEAE3] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#8C8F9B] hover:text-[#EDEAE3] border border-[rgba(237,234,227,0.08)] bg-[#1B1F29]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(237,234,227,0.08)] bg-[#12151C] p-3 flex flex-col gap-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  isActive
                    ? 'text-[#C08A4E] font-bold bg-[#1B1F29]'
                    : 'text-[#8C8F9B] font-normal hover:text-[#EDEAE3]'
                }`}
              >
                <span>{item.name}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#C08A4E]"></span>}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
