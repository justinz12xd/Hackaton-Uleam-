import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import { Link } from "@/lib/i18n/routing"
import { EventsClient } from "./events-client"
import { RotatingText } from "@/components/rotating-text"
import { EventsCarousel } from "@/components/events-carousel"
import { getTranslations } from "next-intl/server"

export default async function EventsPage() {
  const t = await getTranslations('events')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user profile to check role
  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    userProfile = profile
  }

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
      <div className="border-b border-border bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Greeting - Only for authenticated users */}
          {user && userProfile && (
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Hola, {userProfile.full_name?.split(' ')[0] || 'Usuario'} 👋
              </h2>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                <RotatingText 
                  words={['Gestiona', 'Asiste a ', 'Crea', 'Accede a', 'Participa en']} 
                  staticText="Eventos"
                />
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                {userProfile?.role === 'instructor' || userProfile?.role === 'admin'
                  ? 'Crea y gestiona eventos para tu comunidad'
                  : 'Descubre y participa en eventos relevantes para tu aprendizaje'}
              </p>
            </div>

            {/* Create Event Button - Only for instructors and admins */}
            {(userProfile?.role === 'instructor' || userProfile?.role === 'admin') && (
              <div className="shrink-0">
                <Link href="/events/create">
                  <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                    <Plus className="h-5 w-5" />
                    {t('createEvent')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
            
      {/* Featured Events Carousel */}
      <EventsCarousel events={eventsWithData} />

      {/* Client component for events list */}
      <EventsClient initialEvents={eventsWithData} user={user} userProfile={userProfile} />
    </main>
  )
}
