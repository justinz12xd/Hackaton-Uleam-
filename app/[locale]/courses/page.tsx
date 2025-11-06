import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search } from "lucide-react"
import { Suspense } from "react"
import { Link } from "@/lib/i18n/routing"

async function CoursesList() {
  const supabase = await createClient()

  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching courses:", error)
  }

  const courseList = courses || []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courseList.length > 0 ? (
        courseList.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-40" />
            <CardHeader className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                  {course.difficulty_level || "Beginner"}
                </span>
                <span className="text-xs text-muted-foreground">{course.duration_hours} hours</span>
              </div>
              <CardTitle className="line-clamp-2">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/courses/${course.id}`}>
                <Button className="w-full">View Course</Button>
              </Link>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">No courses available yet</p>
        </div>
      )}
    </div>
  )
}

export default async function CoursesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">All Courses</h1>
          <p className="text-lg text-muted-foreground">Explore our complete catalog of microcredential programs</p>
        </div>
      </div>
      {/* Search and Filter */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search courses..." className="pl-10" disabled />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm">All</Button>
              <Button variant="ghost" size="sm">Beginner</Button>
              <Button variant="ghost" size="sm">Intermediate</Button>
              <Button variant="ghost" size="sm">Advanced</Button>
            </div>
          </div>
        </div>
      </div>
      {/* Courses Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<div className="text-center py-12">Loading courses...</div>}>
          <CoursesList />
        </Suspense>
      </div>
    </main>
  )
}

