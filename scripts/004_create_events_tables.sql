-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    image_url TEXT,
    max_attendees INTEGER,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resources_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    qr_code TEXT UNIQUE NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended_at TIMESTAMPTZ,
    is_attended BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_qr ON public.event_registrations(qr_code);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Everyone can view published events"
    ON public.events FOR SELECT
    USING (status != 'cancelled');

CREATE POLICY "Organizers can create events"
    ON public.events FOR INSERT
    WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their events"
    ON public.events FOR UPDATE
    USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their events"
    ON public.events FOR DELETE
    USING (auth.uid() = organizer_id);

-- RLS Policies for event_registrations
CREATE POLICY "Users can view their registrations"
    ON public.event_registrations FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = event_registrations.event_id 
        AND events.organizer_id = auth.uid()
    ));

CREATE POLICY "Users can register for events"
    ON public.event_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their registrations"
    ON public.event_registrations FOR UPDATE
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = event_registrations.event_id 
        AND events.organizer_id = auth.uid()
    ));
