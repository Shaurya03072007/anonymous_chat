-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages (public read)
CREATE POLICY "Allow public read access" ON messages
  FOR SELECT
  USING (true);

-- Allow anyone to insert messages (public write)
CREATE POLICY "Allow public insert access" ON messages
  FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for formatted messages
CREATE OR REPLACE VIEW messages_formatted AS
SELECT 
  id,
  text,
  sender,
  created_at,
  TO_CHAR(created_at, 'MM/DD/YYYY') as date,
  TO_CHAR(created_at, 'HH12:MI AM') as time,
  EXTRACT(EPOCH FROM created_at) * 1000 as timestamp
FROM messages
ORDER BY created_at DESC
LIMIT 10000;

