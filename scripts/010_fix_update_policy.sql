-- Fix UPDATE policy for event_registrations to allow organizers to mark attendance

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update their registrations" ON public.event_registrations;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Users can update their registrations"
    ON public.event_registrations FOR UPDATE
    USING (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_registrations.event_id 
            AND events.organizer_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_registrations.event_id 
            AND events.organizer_id = auth.uid()
        )
    );
