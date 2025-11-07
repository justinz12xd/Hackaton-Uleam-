import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import { Link } from "@/lib/i18n/routing"
import { EventsClient } from "./events-client"
import { getTranslations } from "next-intl/server"

export default async function EventsPage() {
  const t = await getTranslations('events')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch events and registrations in parallel with optimized queries
  const [eventsResponse, registrationsResponse] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .neq("status", "cancelled")
      .order("event_date", { ascending: true }),
    user
      ? supabase
          .from("event_registrations")
          .select("event_id, user_id")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [], error: null }),
  ])

  const events = eventsResponse.data || []
  const registrations = registrationsResponse.data || []

  // Get all event IDs for counting registrations
  const eventIds = events.map((e) => e.id)

  // Get registration counts for all events in one query
  const { data: allRegistrations } = await supabase
    .from("event_registrations")
    .select("event_id, user_id")
    .in("event_id", eventIds)

  // Count registrations per event and check user registration
  const registrationsByEvent = (allRegistrations || []).reduce(
    (acc, reg) => {
      if (!acc[reg.event_id]) {
        acc[reg.event_id] = { count: 0, userRegistered: false }
      }
      acc[reg.event_id].count++
      if (user && reg.user_id === user.id) {
        acc[reg.event_id].userRegistered = true
      }
      return acc
    },
    {} as Record<string, { count: number; userRegistered: boolean }>
  )

  // Map events with registration data
  const eventsWithData = events.map((event) => ({
    ...event,
    registrations_count: registrationsByEvent[event.id]?.count || 0,
    is_registered: registrationsByEvent[event.id]?.userRegistered || false,
  }))

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-bold mb-2">{t('title')}</h1>
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" className="hover:bg-accent">
                  {t('upcoming')}
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:bg-accent hover:text-foreground">
                  {t('past')}
                </Button>
              </div>
            </div>
            {user && (
              <div className="flex gap-3">
                <Link href="/events/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('createEvent')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client component for events list */}
      <EventsClient initialEvents={eventsWithData} user={user} />
    </main>
  )
}
