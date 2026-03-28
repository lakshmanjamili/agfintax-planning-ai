import { NextRequest, NextResponse } from "next/server";
import { TAX_SYSTEM_PROMPT } from "@/lib/ai/tax-system-prompt";
import { sendTextMessage, markAsRead } from "@/lib/whatsapp/client";
import {
  getConversationHistory,
  saveMessage,
  cleanupOldMessages,
} from "@/lib/whatsapp/conversation";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const WHATSAPP_SYSTEM_ADDENDUM = `

## WHATSAPP-SPECIFIC FORMATTING RULES
- Keep responses concise — ideally under 1500 characters. Summarize first, then offer to elaborate.
- Do NOT use markdown tables — WhatsApp renders them as plain text. Use bullet lists instead.
- Use *bold* and _italic_ (WhatsApp style) sparingly for emphasis.
- Use numbered lists for step-by-step instructions.
- Do NOT use ### headers — WhatsApp ignores them. Use *SECTION NAME* in bold instead.
- When greeting, use: "Hi! I'm TaxGPT by AG FinTax. 🧾"
- End longer replies with: "Reply with a follow-up question or type *menu* for options."`;

/**
 * GET — Meta webhook verification handshake.
 * Meta sends hub.mode, hub.verify_token, hub.challenge as query params.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("Webhook verification failed — token mismatch");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST — Receives incoming WhatsApp messages, generates an AI response,
 * and sends the reply back via the WhatsApp Cloud API.
 */
export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppWebhookPayload = await req.json();

    // Meta expects a 200 quickly, so we process asynchronously
    // but since Vercel serverless waits for the function to finish,
    // we process inline and return 200 at the end.

    const messages = extractMessages(body);

    for (const msg of messages) {
      await processIncomingMessage(msg.from, msg.text, msg.messageId);
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook POST error:", error);
    // Always return 200 to prevent Meta from retrying
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}

interface ExtractedMessage {
  from: string;
  text: string;
  messageId: string;
}

function extractMessages(payload: WhatsAppWebhookPayload): ExtractedMessage[] {
  const results: ExtractedMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const msgs = change.value?.messages ?? [];
      for (const msg of msgs) {
        if (msg.type === "text" && msg.text?.body) {
          results.push({
            from: msg.from,
            text: msg.text.body,
            messageId: msg.id,
          });
        }
      }
    }
  }

  return results;
}

async function processIncomingMessage(
  from: string,
  text: string,
  messageId: string
): Promise<void> {
  // Mark message as read (blue ticks)
  await markAsRead(messageId).catch(() => {});

  // Handle special commands
  if (text.toLowerCase().trim() === "menu") {
    const menuText = [
      "Hi! I'm TaxGPT by AG FinTax. 🧾\n",
      "Here's what I can help with:\n",
      "1️⃣ *Tax Planning* — strategies to reduce your tax burden",
      "2️⃣ *Deductions* — find deductions you might be missing",
      "3️⃣ *Entity Structure* — S-Corp vs LLC vs C-Corp analysis",
      "4️⃣ *Real Estate Tax* — depreciation, 1031 exchanges, REPS",
      "5️⃣ *NRI/Cross-Border* — India-US tax, PFIC, FBAR/FATCA",
      "6️⃣ *Retirement Planning* — SEP-IRA, Solo 401(k), Roth",
      "7️⃣ *2025 Tax Changes* — latest law updates\n",
      "Just type your question in plain English!",
      "For a consultation with our CPA team, visit agfintax.com",
    ].join("\n");

    await sendTextMessage(from, menuText);
    return;
  }

  // Cleanup old messages in the background
  cleanupOldMessages(from).catch(() => {});

  // Load conversation history
  const history = await getConversationHistory(from);

  // Save the incoming user message
  await saveMessage(from, "user", text);

  // Generate AI response
  const aiResponse = await generateAIResponse(history, text);

  // Save the assistant response
  await saveMessage(from, "assistant", aiResponse);

  // Send the reply
  await sendTextMessage(from, aiResponse);
}

async function generateAIResponse(
  history: { role: string; content: string }[],
  currentMessage: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return "TaxGPT is temporarily unavailable. Please try again later or visit agfintax.com for assistance.";
  }

  const models = [
    "anthropic/claude-sonnet-4",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o-mini",
  ];

  const systemPrompt = TAX_SYSTEM_PROMPT + WHATSAPP_SYSTEM_ADDENDUM;

  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: currentMessage },
  ];

  for (const model of models) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://agfintax.com",
          "X-Title": "AgFinTax TaxGPT WhatsApp",
        },
        body: JSON.stringify({
          model,
          stream: false,
          temperature: 0.3,
          max_tokens: 2048,
          messages: chatMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter error with ${model}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;

      console.error(`No content in response from ${model}`);
      continue;
    } catch (err) {
      console.error(`Model ${model} failed:`, err);
      continue;
    }
  }

  return "I'm sorry, I'm having trouble processing your question right now. Please try again in a moment, or reach out to our team at agfintax.com for direct assistance.";
}
