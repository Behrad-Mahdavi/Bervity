export interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface CourseSession {
  id: string;
  course_id: string;
  day_of_week: number; // 0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنج‌شنبه, 6=جمعه
  start_time: string; // "08:00"
  end_time: string;   // "09:30"
}

export interface CourseCancellation {
  id: string;
  course_id: string;
  cancelled_date: string; // "YYYY-MM-DD"
  reason?: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  term_id: string;
  name: string;
  location?: string | null;
  color?: string | null;
  created_at: string;
  sessions?: CourseSession[];
  cancellations?: CourseCancellation[];
}

export interface Assignment {
  id: string;
  course_id?: string | null;
  title: string;
  due_at: string; // ISO timestamp
  is_done: boolean;
  notes?: string | null;
  created_at: string;
  course?: Course | null;
}

export interface NotificationLog {
  id: string;
  ref_type: 'class_session' | 'assignment' | 'assignment_urgent';
  ref_id: string;
  trigger_date: string;
  sent_at: string;
}

export const PERSIAN_DAYS = [
  { id: 0, name: 'شنبه', short: 'ش' },
  { id: 1, name: 'یکشنبه', short: 'ی' },
  { id: 2, name: 'دوشنبه', short: 'د' },
  { id: 3, name: 'سه‌شنبه', short: 'س' },
  { id: 4, name: 'چهارشنبه', short: 'چ' },
  { id: 5, name: 'پنج‌شنبه', short: 'پ' },
  { id: 6, name: 'جمعه', short: 'ج' },
] as const;
