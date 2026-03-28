-- WhatsApp TaxGPT conversation history
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_phone
  ON whatsapp_conversations(phone_number, created_at DESC);

-- Enable Row Level Security (RLS) but allow service role full access
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON whatsapp_conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);
