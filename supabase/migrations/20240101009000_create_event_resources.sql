-- Create event_resources table
CREATE TABLE IF NOT EXISTS event_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_url TEXT NOT NULL,
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('photo', 'pdf', 'document', 'other')),
  file_name VARCHAR(255),
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_event_resources_event_id ON event_resources(event_id);
CREATE INDEX idx_event_resources_uploaded_by ON event_resources(uploaded_by);

-- Enable RLS
ALTER TABLE event_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view resources from events they have access to
CREATE POLICY "Users can view event resources" ON event_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_resources.event_id
    )
  );

-- Event organizers can insert resources
CREATE POLICY "Organizers can insert resources" ON event_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_resources.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Event organizers can update their resources
CREATE POLICY "Organizers can update resources" ON event_resources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_resources.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Event organizers can delete their resources
CREATE POLICY "Organizers can delete resources" ON event_resources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_resources.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Create storage bucket for event resources (this needs to be run in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('event-resources', 'event-resources', true);

-- Storage policies (run after creating bucket in Supabase Dashboard)
-- CREATE POLICY "Anyone can view event resources" ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'event-resources');

-- CREATE POLICY "Authenticated users can upload event resources" ON storage.objects
--   FOR INSERT
--   WITH CHECK (bucket_id = 'event-resources' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can update their own event resources" ON storage.objects
--   FOR UPDATE
--   USING (bucket_id = 'event-resources' AND auth.uid() = owner);

-- CREATE POLICY "Users can delete their own event resources" ON storage.objects
--   FOR DELETE
--   USING (bucket_id = 'event-resources' AND auth.uid() = owner);
