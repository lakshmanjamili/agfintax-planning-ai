import type {
  WhatsAppSendMessagePayload,
  WhatsAppMarkReadPayload,
} from "./types";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const MAX_MESSAGE_LENGTH = 4096;

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    throw new Error(
      "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID"
    );
  }
  return { accessToken, phoneNumberId };
}

export async function sendTextMessage(
  to: string,
  text: string
): Promise<void> {
  const chunks = splitMessage(text);
  for (const chunk of chunks) {
    await sendSingleMessage(to, chunk);
  }
}

async function sendSingleMessage(to: string, text: string): Promise<void> {
  const { accessToken, phoneNumberId } = getConfig();

  const payload: WhatsAppSendMessagePayload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("WhatsApp send failed:", response.status, error);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }
}

export async function markAsRead(messageId: string): Promise<void> {
  const { accessToken, phoneNumberId } = getConfig();

  const payload: WhatsAppMarkReadPayload = {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  };

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    console.error("WhatsApp markAsRead failed:", response.status);
  }
}

/**
 * Splits long text into chunks that fit within WhatsApp's 4096 char limit.
 * Tries to split on paragraph boundaries, then sentence boundaries.
 */
function splitMessage(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_MESSAGE_LENGTH) {
      chunks.push(remaining);
      break;
    }

    let splitIdx = remaining.lastIndexOf("\n\n", MAX_MESSAGE_LENGTH);
    if (splitIdx < MAX_MESSAGE_LENGTH * 0.3) {
      splitIdx = remaining.lastIndexOf("\n", MAX_MESSAGE_LENGTH);
    }
    if (splitIdx < MAX_MESSAGE_LENGTH * 0.3) {
      splitIdx = remaining.lastIndexOf(". ", MAX_MESSAGE_LENGTH);
      if (splitIdx > 0) splitIdx += 1; // keep the period
    }
    if (splitIdx < MAX_MESSAGE_LENGTH * 0.3) {
      splitIdx = MAX_MESSAGE_LENGTH;
    }

    chunks.push(remaining.slice(0, splitIdx).trimEnd());
    remaining = remaining.slice(splitIdx).trimStart();
  }

  return chunks;
}
