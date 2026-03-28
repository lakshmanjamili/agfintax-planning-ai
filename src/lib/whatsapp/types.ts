export interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppChangeValue;
  field: "messages";
}

export interface WhatsAppChangeValue {
  messaging_product: "whatsapp";
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "image" | "audio" | "document" | "interactive" | "button" | "reaction";
  text?: { body: string };
}

export interface WhatsAppStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
}

export interface WhatsAppSendMessagePayload {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: { body: string };
}

export interface WhatsAppMarkReadPayload {
  messaging_product: "whatsapp";
  status: "read";
  message_id: string;
}
