import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST() {
  try {
    const result = await sendTelegramMessage(
      "🚀 <b>اتصال Brevity به تلگرام با موفقیت برقرار شد!</b>\n\nربات آماده ارسال یادآورهای کلاس‌ها (۹۰ دقیقه قبل) و تکالیف است."
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
