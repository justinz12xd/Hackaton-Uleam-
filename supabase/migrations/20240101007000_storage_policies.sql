-- Storage Policies for Event-pictures bucket
-- This script sets up RLS policies for the Event-pictures bucket

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('Event-pictures', 'Event-pictures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Event-pictures'
);

-- Policy: Allow public read access to all images
CREATE POLICY "Public read access for event images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'Event-pictures'
);

-- Policy: Allow users to update their own uploaded images
CREATE POLICY "Users can update their own event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Event-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'Event-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Event-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Optional: Policy to allow event organizers to manage event images
-- This allows users to manage images for events they've created
CREATE POLICY "Event organizers can manage their event images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Event-pictures' AND
  EXISTS (
    SELECT 1 FROM events
    WHERE events.organizer_id = auth.uid()
  )
);
