import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "brevity_session";

export async function verifyAuthSession(): Promise<boolean> {
  const expectedPassword = process.env.APP_PASSWORD;
  if (!expectedPassword) {
    // If no password configured yet, allow access
    return true;
  }

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return sessionValue === expectedPassword;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
