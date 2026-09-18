import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expectedPassword = process.env.APP_PASSWORD;

    if (expectedPassword && password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "رمز عبور نادرست است." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(getSessionCookieName(), expectedPassword || "authorized", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90, // 90 days for seamless PWA experience
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
