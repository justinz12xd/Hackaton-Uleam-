-- Ensure organizers can update attendance for their events
-- This fixes the issue where QR scanning doesn't update attendance

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their registrations" ON public.event_registrations;

-- Create new update policy that allows:
-- 1. Users to update their own registrations
-- 2. Organizers to update registrations for their events (for attendance marking)
CREATE POLICY "Users and organizers can update registrations"
    ON public.event_registrations FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_registrations.event_id 
            AND events.organizer_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_registrations.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'event_registrations' 
AND policyname = 'Users and organizers can update registrations';
