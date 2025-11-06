import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Eye, Plus } from "lucide-react"
import Link from "next/link"

export default async function InstructorDashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch instructor profile
  const profileResponse = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const profile = profileResponse.data

  // Check if user is instructor
  if (profile?.role !== "instructor" && profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch instructor's courses
  const coursesResponse = await supabase
    .from("courses")
    .select("*, _count:course_enrollments(count)")
    .eq("instructor_id", data.user.id)
    .order("created_at", { ascending: false })

  const courses = coursesResponse.data || []

  // Calculate stats
  const publishedCourses = courses.filter((c) => c.is_published).length
  const totalEnrollments = courses.reduce((sum, course) => sum + (course._count?.[0]?.count || 0), 0)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Instructor Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage your courses and track student progress</p>
            </div>
            <Link href="/instructor/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{courses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{publishedCourses} published</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalEnrollments}</div>
              <p className="text-xs text-muted-foreground mt-1">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Course Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">4.8</div>
              <p className="text-xs text-muted-foreground mt-1">Based on reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* My Courses */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">My Courses</h2>
            <p className="text-muted-foreground">Create, manage, and track your courses</p>
          </div>

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-32" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          course.is_published ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted"
                        }`}
                      >
                        {course.is_published ? "Published" : "Draft"}
                      </span>
                      <span className="text-xs text-muted-foreground">{course.duration_hours} hours</span>
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{0} students enrolled</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/instructor/${course.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.id}`} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full gap-2">
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No courses created yet</p>
                <Link href="/instructor/create">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
