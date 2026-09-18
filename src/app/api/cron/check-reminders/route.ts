import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";
import { getPersianDayOfWeek, formatTime, formatToJalaali } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  // Protect route if CRON_SECRET is configured
  if (cronSecret) {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  
  // Calculate Tehran time representation
  const tehranDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" }); // YYYY-MM-DD
  const tehranTimeString = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Tehran", hour12: false }); // HH:mm:ss
  
  const [currentHour, currentMinute] = tehranTimeString.split(":").map(Number);
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // Target time for class reminder: now + 90 minutes
  const targetTotalMinutes = currentTotalMinutes + 90;
  const targetDateObj = new Date(now.getTime() + 90 * 60 * 1000);
  const targetDayOfWeek = getPersianDayOfWeek(new Date(targetDateObj.toLocaleString("en-US", { timeZone: "Asia/Tehran" })));

  const results = {
    executedAt: now.toISOString(),
    tehranDate: tehranDateStr,
    classesNotified: 0,
    assignmentsNotified: 0,
    urgentAssignmentsNotified: 0,
    errors: [] as string[],
  };

  try {
    // =========================================================================
    // 1. Check Class Sessions (90 minutes before start)
    // =========================================================================
    
    // Fetch active terms
    const { data: activeTerms, error: termsError } = await supabase
      .from("terms")
      .select("id, name, start_date, end_date")
      .eq("is_active", true)
      .lte("start_date", tehranDateStr)
      .gte("end_date", tehranDateStr);

    if (termsError) {
      results.errors.push(`Terms query error: ${termsError.message}`);
    }

    if (activeTerms && activeTerms.length > 0) {
      const activeTermIds = activeTerms.map((t) => t.id);

      // Fetch sessions for active terms matching targetDayOfWeek
      const { data: sessions, error: sessionsError } = await supabase
        .from("course_sessions")
        .select(`
          id,
          course_id,
          day_of_week,
          start_time,
          end_time,
          courses!inner (
            id,
            name,
            location,
            term_id
          )
        `)
        .eq("day_of_week", targetDayOfWeek)
        .in("courses.term_id", activeTermIds);

      if (sessionsError) {
        results.errors.push(`Sessions query error: ${sessionsError.message}`);
      } else if (sessions) {
        for (const session of sessions) {
          const course = (session as any).courses;
          const [sHour, sMin] = session.start_time.split(":").map(Number);
          const sessionMinutes = sHour * 60 + sMin;

          // Check window: within ±4 minutes around the 90-minute target mark
          const diff = sessionMinutes - targetTotalMinutes;
          if (diff >= -4 && diff <= 4) {
            // Check if class is cancelled today (Edge Case 1)
            const { data: cancellation } = await supabase
              .from("course_cancellations")
              .select("id, reason")
              .eq("course_id", course.id)
              .eq("cancelled_date", tehranDateStr)
              .maybeSingle();

            if (cancellation) {
              console.log(`Class ${course.name} is cancelled today: ${cancellation.reason || "no reason"}`);
              continue;
            }

            // Check if already notified today
            const { data: existingLog } = await supabase
              .from("notification_log")
              .select("id")
              .eq("ref_type", "class_session")
              .eq("ref_id", session.id)
              .eq("trigger_date", tehranDateStr)
              .maybeSingle();

            if (!existingLog) {
              const formattedStart = formatTime(session.start_time);
              const formattedEnd = formatTime(session.end_time);
              const locationText = course.location ? `\n📍 مکان: <b>${course.location}</b>` : "";

              const msg = `⏰ <b>یادآور کلاس — ۹۰ دقیقه دیگر</b>\n\n📚 درس: <b>${course.name}</b>\n🕒 ساعت: <b>${formattedStart} تا ${formattedEnd}</b>${locationText}\n\n🎓 برای حضور به موقع آماده باشید!`;

              const tgRes = await sendTelegramMessage(msg);
              if (tgRes.success) {
                await supabase.from("notification_log").insert({
                  ref_type: "class_session",
                  ref_id: session.id,
                  trigger_date: tehranDateStr,
                });
                results.classesNotified++;
              } else {
                results.errors.push(`Telegram error for session ${session.id}: ${tgRes.error}`);
              }
            }
          }
        }
      }
    }

    // =========================================================================
    // 2. Check Assignments (24h standard reminder + 3h urgent reminder)
    // =========================================================================
    const { data: pendingAssignments, error: assignError } = await supabase
      .from("assignments")
      .select(`
        id,
        title,
        due_at,
        is_done,
        notes,
        courses (
          id,
          name
        )
      `)
      .eq("is_done", false);

    if (assignError) {
      results.errors.push(`Assignments query error: ${assignError.message}`);
    } else if (pendingAssignments) {
      for (const assignment of pendingAssignments) {
        const dueDate = new Date(assignment.due_at);
        const minutesUntilDue = (dueDate.getTime() - now.getTime()) / (60 * 1000);
        const courseName = (assignment as any).courses?.name || "عمومی / آزاد";
        const dueShamsi = formatToJalaali(dueDate);
        const dueTime = dueDate.toLocaleTimeString("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" });

        // Check if 24h/upcoming reminder was already sent for this assignment
        const { data: existing24hLog } = await supabase
          .from("notification_log")
          .select("id")
          .eq("ref_type", "assignment")
          .eq("ref_id", assignment.id)
          .maybeSingle();

        // Case A: Reminder for upcoming assignment within 24 hours
        if (!existing24hLog && minutesUntilDue > 0 && minutesUntilDue <= 24 * 60 + 30) {
          const notesText = assignment.notes ? `\n📝 توضیحات: ${assignment.notes}` : "";
          const hoursRemaining = Math.round(minutesUntilDue / 60);
          const timeRemainingText = minutesUntilDue > 18 * 60 
            ? `فردا ساعت ${dueTime}` 
            : `حدود ${hoursRemaining} ساعت دیگر (ساعت ${dueTime})`;

          const msg = `📌 <b>یادآور تحویل تکلیف</b>\n\n📝 عنوان: <b>${assignment.title}</b>\n📚 درس: <b>${courseName}</b>\n⏳ مهلت تحویل: <b>${timeRemainingText}</b> (${dueShamsi})${notesText}\n\n⚡ تا دیر نشده تکمیلش کن!`;

          const tgRes = await sendTelegramMessage(msg);
          if (tgRes.success) {
            await supabase.from("notification_log").insert({
              ref_type: "assignment",
              ref_id: assignment.id,
              trigger_date: tehranDateStr,
            });
            results.assignmentsNotified++;
          } else {
            results.errors.push(`Telegram error for assignment ${assignment.id}: ${tgRes.error}`);
          }
        }

        // Case B: Urgent Reminder (Edge case: <= 3 hours remaining)
        if (minutesUntilDue > 10 && minutesUntilDue <= 180) {
          const { data: existingUrgentLog } = await supabase
            .from("notification_log")
            .select("id")
            .eq("ref_type", "assignment_urgent")
            .eq("ref_id", assignment.id)
            .maybeSingle();

          if (!existingUrgentLog) {
            const hoursLeft = Math.ceil(minutesUntilDue / 60);
            const msg = `🚨 <b>هشدار فوری ددلاین تکلیف!</b>\n\n📝 عنوان: <b>${assignment.title}</b>\n📚 درس: <b>${courseName}</b>\n⚠️ تنها حدود <b>${hoursLeft} ساعت</b> تا پایان مهلت تحویل باقیست (ساعت ${dueTime}).`;

            const tgRes = await sendTelegramMessage(msg);
            if (tgRes.success) {
              await supabase.from("notification_log").insert({
                ref_type: "assignment_urgent",
                ref_id: assignment.id,
                trigger_date: tehranDateStr,
              });
              results.urgentAssignmentsNotified++;
            } else {
              results.errors.push(`Telegram error for urgent assignment ${assignment.id}: ${tgRes.error}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reminders check processed successfully",
      data: results,
    });
  } catch (err: any) {
    console.error("Cron check failed:", err);
    return NextResponse.json(
      { success: false, error: err.message, data: results },
      { status: 500 }
    );
  }
}
