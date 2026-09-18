-- ==============================================================================
-- Brevity Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. جدول ترم‌ها (Semesters / Terms)
create table if not exists terms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. جدول درس‌ها (Courses)
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  term_id uuid references terms(id) on delete cascade,
  name text not null,
  location text,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- 3. جلسات هفتگی درس‌ها (Weekly Course Sessions)
-- day_of_week: 0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنج‌شنبه, 6=جمعه
create table if not exists course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);

-- 4. جدول کنسلی کلاس‌ها در تاریخ‌های خاص (Course Cancellations - Edge Case)
create table if not exists course_cancellations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  cancelled_date date not null,
  reason text,
  created_at timestamptz default now(),
  unique(course_id, cancelled_date)
);

-- 5. جدول تکالیف (Assignments)
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  is_done boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- 6. جدول لاگ نوتیفیکیشن‌ها برای جلوگیری از ارسال تکراری (Notification Log)
create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  ref_type text not null check (ref_type in ('class_session', 'assignment', 'assignment_urgent')),
  ref_id uuid not null,
  trigger_date date not null,
  sent_at timestamptz default now(),
  unique (ref_type, ref_id, trigger_date)
);

-- Indices for rapid Cron querying
create index if not exists idx_course_sessions_day_time on course_sessions (day_of_week, start_time);
create index if not exists idx_assignments_due_done on assignments (due_at, is_done);
create index if not exists idx_notification_log_lookup on notification_log (ref_type, ref_id, trigger_date);
create index if not exists idx_cancellations_lookup on course_cancellations (course_id, cancelled_date);
