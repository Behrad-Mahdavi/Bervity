# بریف تکنیکال — اپ مدیریت برنامه کلاسی و تکالیف (Study Reminder)

## ۱. خلاصه پروژه

ابزار شخصی برای یک نفر (بدون نیاز به multi-tenant یا سیستم کاربری پیچیده) که:
- برنامه هفتگی کلاس‌ها رو به‌صورت ترمی نگه می‌داره
- تکالیف هر درس با تاریخ تحویل رو ثبت می‌کنه
- ۹۰ دقیقه قبل از هر کلاس، نوتیف تلگرام می‌فرسته
- یک روز قبل از deadline هر تکلیف، نوتیف تلگرام می‌فرسته

**Stack نهایی:**
| لایه | ابزار |
|---|---|
| Frontend + API | Next.js روی Vercel |
| Database | Supabase (Postgres) |
| Auth | ساده — یک پسورد ثابت (چون تک‌کاربره) یا Supabase Auth با یک یوزر |
| Scheduler | Vercel Cron Jobs |
| کانال نوتیف | Telegram Bot API |

---

## ۲. معماری کلی (High-level Flow)

```
[Next.js App روی Vercel]
        |
        |-- فرم ورود اطلاعات (ترم/درس/تکلیف) --> [Supabase Postgres]
        |
[Vercel Cron Job] -- هر ۵ دقیقه اجرا می‌شه --> [API Route: /api/cron/check-reminders]
                                                        |
                                                        |-- Query از Supabase
                                                        |-- تشخیص کلاس/تکلیف نزدیک
                                                        |-- ارسال پیام --> [Telegram Bot API] --> [گوشی کاربر]
                                                        |-- ثبت لاگ ارسال --> [Supabase: notification_log]
```

نکته مهم: چون Vercel Cron خودش سرور همیشه-روشن نداره (Serverless)، منطق باید هر بار که Cron صدا می‌زنه، **از صفر چک کنه** چه چیزی الان باید نوتیف بشه — نه اینکه یک process همیشه در حال شمارش معکوس باشه.

---

## ۳. مدل داده (Database Schema — Supabase/Postgres)

```sql
-- جدول ترم‌ها
create table terms (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- مثلاً "ترم پاییز ۱۴۰۴"
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- جدول درس‌ها
create table courses (
  id uuid primary key default gen_random_uuid(),
  term_id uuid references terms(id) on delete cascade,
  name text not null,
  location text,                   -- اختیاری
  color text,                      -- برای نمایش تو UI (اختیاری)
  created_at timestamptz default now()
);

-- جلسات هفتگی هر درس (چون یک درس می‌تونه چند جلسه در هفته داشته باشه)
create table course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=شنبه ... 6=جمعه (یا استاندارد خودت رو تعریف کن)
  start_time time not null,
  end_time time not null
);

-- جدول تکالیف
create table assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,     -- تاریخ+ساعت دقیق تحویل
  is_done boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- جدول لاگ نوتیف‌ها (برای جلوگیری از ارسال تکراری)
create table notification_log (
  id uuid primary key default gen_random_uuid(),
  ref_type text not null check (ref_type in ('class_session', 'assignment')),
  ref_id uuid not null,            -- id جلسه یا تکلیف
  trigger_date date not null,      -- تاریخ روزی که نوتیف مربوط به اون رخداد بود (برای جلوگیری از دوباره‌کاری در تکرار هفتگی)
  sent_at timestamptz default now(),
  unique (ref_type, ref_id, trigger_date)
);
```

**چرا `notification_log` لازمه؟**
چون Cron هر ۵ دقیقه اجرا می‌شه، بدون این جدول ممکنه یک کلاس چند بار نوتیف بفرسته (مثلاً هم در دقیقه ۸۹ و هم ۹۰ قبل از کلاس). این جدول تضمین می‌کنه هر رخداد فقط یک‌بار در روز نوتیف بگیره.

---

## ۴. فلوهای اصلی کاربر (User Flows)

### فلو ۱: ساخت ترم جدید
1. کاربر وارد فرم "ترم جدید" می‌شه
2. نام ترم + تاریخ شروع/پایان رو وارد می‌کنه
3. ترم ذخیره می‌شه و به‌صورت پیش‌فرض `is_active = true`
4. (اختیاری) ترم‌های قبلی می‌تونن آرشیو بشن

### فلو ۲: اضافه کردن درس + جلسات هفتگی
1. کاربر یک ترم فعال رو انتخاب می‌کنه
2. نام درس، مکان (اختیاری) رو وارد می‌کنه
3. یک یا چند جلسه هفتگی اضافه می‌کنه (روز هفته + ساعت شروع/پایان) — می‌تونه چند بار دکمه "+ جلسه دیگه" بزنه (مثلاً یک درس، شنبه و دوشنبه)
4. ذخیره می‌شه

### فلو ۳: اضافه کردن تکلیف
1. کاربر یک درس رو از لیست درس‌های ترم فعال انتخاب می‌کنه
2. عنوان تکلیف + تاریخ و ساعت دقیق تحویل رو وارد می‌کنه
3. ذخیره می‌شه با `is_done = false`

### فلو ۴: مشاهده و مدیریت
1. صفحه اصلی: نمای هفتگی برنامه کلاسی + لیست تکالیف نزده‌شده مرتب‌شده بر اساس نزدیک‌ترین deadline
2. کاربر می‌تونه تکلیف رو "انجام‌شده" علامت بزنه (`is_done = true`) — بعد از این دیگه نوتیف نمی‌گیره
3. امکان ویرایش/حذف درس، جلسه، یا تکلیف

### فلو ۵: چرخه نوتیف (پس‌زمینه، بدون دخالت کاربر)
این فلو، قلب اصلی سیستمه — جزئیاتش در بخش ۵.

---

## ۵. منطق دقیق نوتیف (مهم‌ترین بخش)

### تنظیم Cron
در `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```
هر ۵ دقیقه یک‌بار اجرا می‌شه (توجه: در پلن رایگان Vercel محدودیت روی تعداد و دقت زمان‌بندی Cron وجود داره — این رو حتماً موقع اجرا چک کن).

### منطق چک کلاس‌ها
1. زمان فعلی رو بگیر (`now`)
2. یک بازه هدف بساز: `target = now + 90 minutes`
3. روز هفته و ساعت `target` رو استخراج کن
4. تمام `course_sessions` رو پیدا کن که `day_of_week` و `start_time`شون داخل یک پنجره‌ی کوچیک (مثلاً ±۲.۵ دقیقه) حول `target` باشه — این پنجره باید هم‌اندازه فاصله اجرای Cron باشه تا هیچ کلاسی از قلم نیفته
5. برای هر نتیجه: چک کن آیا قبلاً تو `notification_log` برای این `(ref_type='class_session', ref_id, trigger_date=امروز)` رکورد ثبت شده؟ اگه نه:
   - پیام تلگرام بفرست: `"⏰ کلاس {نام درس} ساعت {ساعت شروع} شروع می‌شه (۹۰ دقیقه دیگه)"`
   - رکورد در `notification_log` ثبت کن

### منطق چک تکالیف
1. بازه هدف: `target = now + 24 hours`
2. تمام `assignments` که `is_done = false` و `due_at` داخل یک پنجره کوچیک حول `target` باشه رو پیدا کن
3. چک `notification_log` برای جلوگیری از تکرار (`ref_type='assignment'`)
4. پیام بفرست: `"📌 یادآوری: تکلیف {عنوان} فردا ساعت {ساعت تحویل} باید تحویل داده بشه"`
5. رکورد لاگ ثبت کن

> **نکته درباره تایم‌زون:** همه تاریخ/ساعت‌ها رو با UTC تو دیتابیس ذخیره کن و فقط موقع نمایش و مقایسه با "الان" تبدیل به تایم‌زون تهران (`Asia/Tehran`) بکن. برای این کار از کتابخونه `date-fns-tz` یا `luxon` استفاده کن.

### ارسال پیام به تلگرام
```ts
// lib/telegram.ts
export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
```

### راه‌اندازی بات تلگرام (یک‌باره)
1. توی تلگرام به `@BotFather` پیام بده، دستور `/newbot` رو بزن، اسم و username انتخاب کن
2. `BOT_TOKEN` رو بگیر و ذخیره کن
3. یک پیام به بات خودت بفرست (هر چیزی)
4. به این آدرس برو تا `chat_id` خودت رو پیدا کنی: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. مقدار `chat.id` رو از پاسخ JSON کپی کن → این `TELEGRAM_CHAT_ID` توئه

---

## ۶. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # فقط سمت سرور، برای API route های cron
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
APP_PASSWORD=                    # برای محافظت ساده از فرم ورود اطلاعات
CRON_SECRET=                     # برای اینکه فقط خود Vercel Cron بتونه /api/cron رو صدا بزنه
```

**امنیت `/api/cron/check-reminders`:** چون این route عمومیه (Vercel Cron باید بتونه بهش دسترسی داشته باشه)، باید چک کنی که هدر `Authorization: Bearer ${CRON_SECRET}` درست باشه، وگرنه هرکسی می‌تونه spam کنه.

---

## ۷. ساختار پیشنهادی پوشه‌ها (Next.js App Router)

```
/app
  /page.tsx                       -> صفحه اصلی (نمای هفتگی + تکالیف)
  /terms/new/page.tsx              -> فرم ترم جدید
  /courses/new/page.tsx            -> فرم درس جدید
  /assignments/new/page.tsx        -> فرم تکلیف جدید
  /api
    /cron/check-reminders/route.ts -> منطق اصلی نوتیف
    /assignments/[id]/route.ts     -> PATCH برای mark as done
/lib
  /supabase.ts                     -> کلاینت Supabase
  /telegram.ts                     -> تابع ارسال پیام
  /time.ts                         -> توابع کمکی تایم‌زون
```

---

## ۸. سناریوهای لبه‌ای (Edge Cases) که باید حتماً هندل بشن

| سناریو | راه‌حل |
|---|---|
| کلاسی که تعطیل شده (روز خاص) | یک جدول `course_cancellations` اضافه کن (course_id + date) و قبل از فرستادن نوتیف چک کن |
| تکلیفی که deadline‌ش خیلی نزدیکه (کمتر از ۲۴ ساعت مونده وقتی ثبتش می‌کنی) | نوتیف "روز قبل" رد می‌شه — یا باید منطق اضافه کنی که اگه کمتر از ۲۴ ساعت مونده، بلافاصله یا با فاصله کوتاه‌تر (مثلاً ۳ ساعت قبل) نوتیف بفرسته |
| Vercel Cron miss کردن یک اجرا (به دلیل مشکل شبکه یا محدودیت پلن رایگان) | پنجره چک (۲.۵ دقیقه ±) رو کمی بزرگ‌تر از فاصله واقعی cron بگیر تا margin داشته باشی |
| ترم تموم شده ولی هنوز `is_active = true` مونده | یک چک روزانه (یا دستی) برای غیرفعال کردن ترم‌های گذشته |
| تکلیف بدون درس (کار شخصی/غیر درسی) | `course_id` رو nullable کن اگه می‌خوای این حالت رو هم پوشش بدی |

---

## ۹. مراحل Deploy

1. پروژه Supabase بساز، جدول‌های بالا رو با SQL Editor اجرا کن
2. ریپو رو به Vercel وصل کن، Environment Variables رو ست کن
3. `vercel.json` با تنظیمات Cron رو اضافه کن
4. بات تلگرام رو طبق بخش ۵ بساز و توکن/چت‌آیدی رو بگیر
5. یک بار `curl` دستی به `/api/cron/check-reminders` بزن تا مطمئن بشی پیام درست می‌رسه
6. صبر کن یک چرخه واقعی Cron اجرا بشه و چک کن نوتیف درست میاد

---

## ۱۰. پیشنهادهای توسعه آینده (اختیاری، نه برای MVP)

- دکمه Inline تو پیام تلگرام برای "✅ انجام دادم" (با Telegram Callback Query)
- نمایش تقویم ماهانه علاوه بر نمای هفتگی
- Import برنامه کلاسی از فایل CSV/Excel
- یادآوری دوم و نزدیک‌تر برای تکالیف حساس (مثلاً ۳ ساعت قبل)
- گزارش هفتگی خلاصه (چند تا تکلیف انجام دادی، چند تا کلاس رفتی)

---
