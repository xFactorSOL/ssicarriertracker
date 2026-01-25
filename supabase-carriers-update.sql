-- ===========================================
-- Carriers Table Update - FMCSA Integration
-- ===========================================
-- Run this in Supabase SQL Editor to add new fields for FMCSA data

-- Add new columns to carriers table if they don't exist
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS safety_rating TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS operating_status TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS power_units TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS drivers TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS fmcsa_last_updated TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN carriers.address IS 'Physical street address from FMCSA';
COMMENT ON COLUMN carriers.city IS 'City from FMCSA';
COMMENT ON COLUMN carriers.state IS 'State abbreviation from FMCSA';
COMMENT ON COLUMN carriers.zip IS 'ZIP code from FMCSA';
COMMENT ON COLUMN carriers.safety_rating IS 'FMCSA safety rating (Satisfactory, Conditional, Unsatisfactory, None)';
COMMENT ON COLUMN carriers.operating_status IS 'Current operating status from FMCSA';
COMMENT ON COLUMN carriers.power_units IS 'Number of power units/trucks';
COMMENT ON COLUMN carriers.drivers IS 'Number of drivers';
COMMENT ON COLUMN carriers.fmcsa_last_updated IS 'When FMCSA data was last fetched';

-- ===========================================
-- Load Notes Table for Activity/Comments
-- ===========================================

CREATE TABLE IF NOT EXISTS load_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on load_notes
ALTER TABLE load_notes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert notes
CREATE POLICY "Authenticated users can insert notes" ON load_notes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read all notes
CREATE POLICY "Authenticated users can read notes" ON load_notes
FOR SELECT USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_load_notes_load_id ON load_notes(load_id);

-- ===========================================
-- Load Documents Table (BOL, POD, Rate Cons)
-- ===========================================

CREATE TABLE IF NOT EXISTS load_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  document_type TEXT NOT NULL, -- 'bol', 'pod', 'rate_con', 'invoice', 'other'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on load_documents
ALTER TABLE load_documents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert documents
CREATE POLICY "Authenticated users can insert documents" ON load_documents
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read all documents
CREATE POLICY "Authenticated users can read documents" ON load_documents
FOR SELECT USING (true);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents" ON load_documents
FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_load_documents_load_id ON load_documents(load_id);

-- ===========================================
-- Add Delivery Tracking Fields to Loads
-- ===========================================

ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivery_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivery_confirmed_by UUID REFERENCES auth.users(id);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS receiver_name TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

COMMENT ON COLUMN loads.delivery_confirmed IS 'Whether delivery has been confirmed';
COMMENT ON COLUMN loads.delivery_confirmed_at IS 'When delivery was confirmed';
COMMENT ON COLUMN loads.receiver_name IS 'Name of person who received the shipment';
COMMENT ON COLUMN loads.delivery_notes IS 'Notes about the delivery';

-- ===========================================
-- Create Storage Bucket for Documents
-- ===========================================
-- NOTE: Run this in Supabase Dashboard > Storage > Create new bucket
-- Bucket name: load-documents
-- Public: false (private)

-- Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'carriers' 
ORDER BY ordinal_position;
