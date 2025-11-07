import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Award, ArrowRight, Calendar } from "lucide-react"
import { Link, redirect } from "@/lib/i18n/routing"
import { getTranslations, setRequestLocale } from 'next-intl/server'

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('dashboard')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect({ href: "/auth/login", locale })
  }

  // Optimize: Fetch all data in parallel with joins
  const [profileResponse, registrationsResponse, upcomingEventsResponse] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", data.user.id).single(),
    supabase
      .from("event_registrations")
      .select("*, event:events(*)")
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("*")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(6),
  ])

  const profile = profileResponse.data
  const registrationsData = registrationsResponse.data || []
  const allUpcomingEvents = upcomingEventsResponse.data || []

  // Process registrations (events are already joined)
  const registrations = registrationsData.map((reg: any) => ({
    ...reg,
    event: reg.event || null,
  }))

  // Get registered event IDs for filtering
  const registeredEventIds = registrations
    .map((r) => r.event?.id)
    .filter(Boolean) as string[]
  
  // Filter out registered events
  const recommended = allUpcomingEvents
    .filter((event) => !registeredEventIds.includes(event.id))
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('welcome', { name: profile?.full_name || t('student') })}</h1>
              <p className="text-muted-foreground mt-2">{t('continueLearning')}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/profile">
                <Button variant="outline">{t('myProfile')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendedEvents')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{registrations.filter((r) => r.is_attended).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('registeredEvents')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {registrations.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registered Events */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('yourEvents')}</h2>
            <p className="text-muted-foreground">{t('manageEvents')}</p>
          </div>

          {registrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((registration) => (
                <Card key={registration.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-32" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {new Date(registration.event?.event_date || '').toLocaleDateString()}
                      </span>
                      {registration.is_attended && <Award className="w-4 h-4 text-accent" />}
                    </div>
                    <CardTitle className="line-clamp-2">{registration.event?.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{registration.event?.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{registration.event?.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {registration.is_attended ? (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                          {t('attended')}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {t('registered')}
                        </span>
                      )}
                    </div>
                    <Link href={`/events/${registration.event?.id}`}>
                      <Button className="w-full" size="sm">
                        {t('viewEvent')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">{t('noEvents')}</p>
                <Link href="/events">
                  <Button className="gap-2">
                    {t('browseEvents')} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommended Section */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('upcomingEvents')}</h2>
            <p className="text-muted-foreground">{t('upcomingEventsDescription')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.length > 0 ? (
              recommended.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-br from-secondary/20 to-primary/20 h-32" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded">
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">{event.max_attendees} {t('spots')}</span>
                    </div>
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      📍 {event.location}
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <Button variant="outline" className="w-full bg-transparent" size="sm">
                        {t('viewDetails')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">{t('noUpcomingEvents')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

