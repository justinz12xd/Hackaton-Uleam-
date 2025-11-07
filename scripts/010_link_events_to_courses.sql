-- Script to link events with courses
-- This allows instructors to associate multiple courses with an event

-- Step 1: Create a junction table for many-to-many relationship
-- (One event can have multiple courses, and theoretically a course could be in multiple events)
CREATE TABLE IF NOT EXISTS public.event_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, course_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_courses_event ON public.event_courses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_courses_course ON public.event_courses(course_id);

-- Enable RLS
ALTER TABLE public.event_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_courses
CREATE POLICY "Everyone can view event courses"
    ON public.event_courses FOR SELECT
    USING (true);

CREATE POLICY "Event organizers can link courses"
    ON public.event_courses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_courses.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Event organizers can unlink courses"
    ON public.event_courses FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_courses.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

-- Function to get all courses for an event
CREATE OR REPLACE FUNCTION get_event_courses(p_event_id UUID)
RETURNS TABLE (
    course_id UUID,
    title TEXT,
    description TEXT,
    instructor_id UUID,
    is_published BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.instructor_id,
        c.is_published,
        c.created_at
    FROM public.courses c
    INNER JOIN public.event_courses ec ON ec.course_id = c.id
    WHERE ec.event_id = p_event_id
    ORDER BY ec.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link a course to an event
CREATE OR REPLACE FUNCTION link_course_to_event(
    p_event_id UUID,
    p_course_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_organizer_id UUID;
    v_instructor_id UUID;
BEGIN
    -- Get event organizer
    SELECT organizer_id INTO v_organizer_id
    FROM public.events
    WHERE id = p_event_id;

    -- Get course instructor
    SELECT instructor_id INTO v_instructor_id
    FROM public.courses
    WHERE id = p_course_id;

    -- Only allow if user is both event organizer and course instructor
    IF v_organizer_id = auth.uid() AND v_instructor_id = auth.uid() THEN
        INSERT INTO public.event_courses (event_id, course_id)
        VALUES (p_event_id, p_course_id)
        ON CONFLICT (event_id, course_id) DO NOTHING;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_courses TO authenticated;
GRANT EXECUTE ON FUNCTION link_course_to_event TO authenticated;

-- Add event_id column to courses table for quick reference (optional, for reverse lookup)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS primary_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Index for the new column
CREATE INDEX IF NOT EXISTS idx_courses_primary_event ON public.courses(primary_event_id);

-- Comment
COMMENT ON TABLE public.event_courses IS 'Junction table linking events with their associated courses';
COMMENT ON COLUMN public.courses.primary_event_id IS 'Optional reference to the primary event this course was created for';
