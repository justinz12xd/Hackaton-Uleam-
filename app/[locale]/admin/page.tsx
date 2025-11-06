import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Award, TrendingUp } from "lucide-react"
import { Link, redirect } from "@/lib/i18n/routing"

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const profileResponse = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

  if (profileResponse.data?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all users
  const usersResponse = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  const allUsers = usersResponse.data || []
  const students = allUsers.filter((u) => u.role === "student").length
  const instructors = allUsers.filter((u) => u.role === "instructor").length

  // Fetch all courses
  const coursesResponse = await supabase
    .from("courses")
    .select("*, _count:course_enrollments(count)")
    .order("created_at", { ascending: false })

  const allCourses = coursesResponse.data || []
  const publishedCourses = allCourses.filter((c) => c.is_published).length

  // Calculate total enrollments
  const totalEnrollments = allCourses.reduce((sum, course) => sum + (course._count?.[0]?.count || 0), 0)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage platform users, courses, and settings</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{allUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {students} students, {instructors} instructors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{allCourses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{publishedCourses} published</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalEnrollments}</div>
              <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Growth Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">+24%</div>
              <p className="text-xs text-muted-foreground mt-1">Month over month</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div>
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">User Management</h2>
                <p className="text-muted-foreground">Manage all platform users and their roles</p>
              </div>
              <Link href="/admin/users">
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{user.full_name || "No name"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded capitalize">
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Management */}
          <div>
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Course Management</h2>
                <p className="text-muted-foreground">Manage all courses on the platform</p>
              </div>
              <Link href="/admin/courses">
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allCourses.slice(0, 5).map((course) => (
                    <div key={course.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.duration_hours} hours</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          course.is_published ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted"
                        }`}
                      >
                        {course.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>Configure platform-wide settings and features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full bg-transparent">
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/courses">
                <Button variant="outline" className="w-full bg-transparent">
                  Manage Courses
                </Button>
              </Link>
              <Button variant="outline" className="w-full bg-transparent" disabled>
                Settings (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

