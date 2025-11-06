import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Award, ArrowRight, Briefcase as Certificate } from "lucide-react"
import { Link, redirect } from "@/lib/i18n/routing"
import { getTranslations, setRequestLocale } from 'next-intl/server'

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('dashboard')
  const tHome = await getTranslations('home.courses')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch user profile and enrolled courses
  const [profileResponse, enrollmentsResponse] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", data.user.id).single(),
    supabase
      .from("course_enrollments")
      .select("*, course:courses(*)")
      .eq("student_id", data.user.id)
      .order("created_at", { ascending: false }),
  ])

  const profile = profileResponse.data
  const enrollments = enrollmentsResponse.data || []

  // Fetch recommended courses (published courses not enrolled by user)
  const enrolledCourseIds = enrollments.map((e) => e.course?.id).filter(Boolean)
  
  let recommendedQuery = supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6)
  
  const { data: allRecommendedCourses } = await recommendedQuery
  
  // Filter out enrolled courses on the client side
  const recommended = (allRecommendedCourses || [])
    .filter((course) => !enrolledCourseIds.includes(course.id))
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
              <Link href="/dashboard/certificates">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Certificate className="w-4 h-4" />
                  {t('certificates')}
                </Button>
              </Link>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('enrolledCourses')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{enrollments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('certificatesEarned')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {enrollments.filter((e) => e.completed_at).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('learningStreak')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">7 days</div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('yourCourses')}</h2>
            <p className="text-muted-foreground">{t('manageCourses')}</p>
          </div>

          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-32" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {enrollment.course?.difficulty_level || "Beginner"}
                      </span>
                      {enrollment.completed_at && <Award className="w-4 h-4 text-accent" />}
                    </div>
                    <CardTitle className="line-clamp-2">{enrollment.course?.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{enrollment.course?.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-muted-foreground">{t('progress')}</span>
                        <span className="font-semibold">{enrollment.progress_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>
                    <Link href={`/courses/${enrollment.course?.id}`}>
                      <Button className="w-full" size="sm">
                        {t('continueLearning')}
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
                <p className="text-muted-foreground">{t('noCourses')}</p>
                <Link href="/courses">
                  <Button className="gap-2">
                    {t('browseCourses')} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommended Section */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('recommended')}</h2>
            <p className="text-muted-foreground">{t('recommendedDescription')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.length > 0 ? (
              recommended.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-br from-secondary/20 to-primary/20 h-32" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded capitalize">
                        {course.difficulty_level || tHome('levels.beginner')}
                      </span>
                      <span className="text-xs text-muted-foreground">{course.duration_hours || 0} {tHome('hours')}</span>
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/courses/${course.id}`}>
                      <Button variant="outline" className="w-full bg-transparent" size="sm">
                        {t('viewDetails')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">{t('noRecommendedCourses')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

