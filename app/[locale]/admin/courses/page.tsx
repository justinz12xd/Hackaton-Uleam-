import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, MoreVertical } from "lucide-react"
import { Link, redirect } from "@/lib/i18n/routing"

export default async function AdminCoursesPage() {
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

  // Fetch all courses with instructor and enrollment info
  const coursesResponse = await supabase
    .from("courses")
    .select("*, instructor:profiles!instructor_id(full_name), _count:course_enrollments(count)")
    .order("created_at", { ascending: false })

  const allCourses = coursesResponse.data || []

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground mt-2">Review and manage all courses on the platform</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search courses..." className="pl-10" disabled />
          </div>
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses ({allCourses.length})</CardTitle>
            <CardDescription>Manage courses on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {allCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-semibold">Course Title</th>
                      <th className="text-left py-3 px-3 font-semibold">Instructor</th>
                      <th className="text-left py-3 px-3 font-semibold">Level</th>
                      <th className="text-left py-3 px-3 font-semibold">Status</th>
                      <th className="text-left py-3 px-3 font-semibold">Enrollments</th>
                      <th className="text-left py-3 px-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCourses.map((course) => (
                      <tr key={course.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-3 font-medium">{course.title}</td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {(course.instructor as any)?.full_name || "Unknown"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-semibold capitalize">{course.difficulty_level}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              course.is_published ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted"
                            }`}
                          >
                            {course.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs">{course._count?.[0]?.count || 0}</td>
                        <td className="py-3 px-3">
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No courses found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

