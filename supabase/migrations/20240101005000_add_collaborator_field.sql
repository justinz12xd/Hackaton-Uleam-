-- Add is_collaborator field to event_registrations table
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS is_collaborator BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_collaborator 
ON public.event_registrations(event_id, is_collaborator) 
WHERE is_collaborator = TRUE;

-- Add comment to document the field
COMMENT ON COLUMN public.event_registrations.is_collaborator IS 
'Indicates if the registered user is a collaborator/helper for the event';
