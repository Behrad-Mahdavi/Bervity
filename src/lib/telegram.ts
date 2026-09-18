/**
 * Telegram Bot API Notification Client for Brevity
 */

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export async function sendTelegramMessage(
  text: string,
  options?: {
    inlineButtons?: InlineKeyboardButton[][];
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in environment variables.");
    return { success: false, error: "Missing Telegram credentials" };
  }

  const payload: any = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  if (options?.inlineButtons && options.inlineButtons.length > 0) {
    payload.reply_markup = {
      inline_keyboard: options.inlineButtons,
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      console.error("Telegram API Error:", result);
      return { success: false, error: result.description || "Telegram API error" };
    }

    return { success: true, data: result };
  } catch (err: any) {
    console.error("Failed to connect to Telegram API:", err);
    return { success: false, error: err.message };
  }
}
