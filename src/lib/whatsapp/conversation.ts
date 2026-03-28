import { createServerClient } from "@/lib/supabase/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_MESSAGES = 10;
const SESSION_WINDOW_HOURS = 24;

/**
 * Loads recent conversation history for a phone number within the
 * 24-hour WhatsApp session window. Returns up to MAX_HISTORY_MESSAGES.
 */
export async function getConversationHistory(
  phoneNumber: string
): Promise<ChatMessage[]> {
  const supabase = createServerClient();

  const cutoff = new Date(
    Date.now() - SESSION_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select("role, content")
    .eq("phone_number", phoneNumber)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  if (error) {
    console.error("Failed to load conversation history:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content,
  }));
}

/**
 * Saves a single message to the conversation history.
 */
export async function saveMessage(
  phoneNumber: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase.from("whatsapp_conversations").insert({
    phone_number: phoneNumber,
    role,
    content,
  });

  if (error) {
    console.error("Failed to save conversation message:", error);
  }
}

/**
 * Clears conversation history older than the session window
 * for a given phone number. Can be called periodically or on session reset.
 */
export async function cleanupOldMessages(
  phoneNumber: string
): Promise<void> {
  const supabase = createServerClient();

  const cutoff = new Date(
    Date.now() - SESSION_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from("whatsapp_conversations")
    .delete()
    .eq("phone_number", phoneNumber)
    .lt("created_at", cutoff);

  if (error) {
    console.error("Failed to cleanup old messages:", error);
  }
}
