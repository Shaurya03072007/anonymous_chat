-- Extended Supabase Schema for Advanced Chat Features
-- Run this AFTER the base schema.sql

-- Add columns to messages table for editing/deleting
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_text TEXT,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_name, emoji)
);

-- Create index for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_name ON message_reactions(user_name);

-- Create reported messages table
CREATE TABLE IF NOT EXISTS reported_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reported_by TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for reported messages
CREATE INDEX IF NOT EXISTS idx_reported_message_id ON reported_messages(message_id);

-- Enable RLS for new tables
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_messages ENABLE ROW LEVEL SECURITY;

-- Policies for reactions (public read/write)
DROP POLICY IF EXISTS "Allow public read reactions" ON message_reactions;
CREATE POLICY "Allow public read reactions" ON message_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert reactions" ON message_reactions;
CREATE POLICY "Allow public insert reactions" ON message_reactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete reactions" ON message_reactions;
CREATE POLICY "Allow public delete reactions" ON message_reactions
  FOR DELETE USING (true);

-- Policies for reported messages (public insert, admin read)
DROP POLICY IF EXISTS "Allow public report messages" ON reported_messages;
CREATE POLICY "Allow public report messages" ON reported_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read reports" ON reported_messages;
CREATE POLICY "Allow public read reports" ON reported_messages
  FOR SELECT USING (true);

-- Enable Realtime for reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

