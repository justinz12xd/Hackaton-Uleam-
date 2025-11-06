import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Award, Users } from "lucide-react"
import { Link, redirect } from "@/lib/i18n/routing"

interface CoursePageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()

  // Fetch course details
  const courseResponse = await supabase.from("courses").select("*").eq("id", id).single()

  if (!courseResponse.data) {
    redirect('/courses')
  }

  const course = courseResponse.data

  // Check if user is enrolled
  const enrollmentResponse = await supabase
    .from("enrollments")
    .select("*")
    .eq("course_id", id)
    .eq("student_id", user?.user?.id || "")
    .single()

  const isEnrolled = !!enrollmentResponse.data

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/courses">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground mt-2">{course.description}</p>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-64" />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{course.description}</p>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <Clock className="w-4 h-4 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{course.duration_hours} hours</p>
                  </div>
                  <div>
                    <Award className="w-4 h-4 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Certificate</p>
                    <p className="font-semibold">Yes</p>
                  </div>
                  <div>
                    <Users className="w-4 h-4 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Difficulty</p>
                    <p className="font-semibold">{course.difficulty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold">
                        {i}
                      </div>
                      <p className="text-foreground">Module {i}: Course Content</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription className="text-base font-semibold text-primary mt-2">
                  {isEnrolled ? "You are enrolled" : "Not enrolled"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEnrolled ? (
                  <Link href="/dashboard">
                    <Button className="w-full">Continue Learning</Button>
                  </Link>
                ) : (
                  <>
                    {user?.user ? (
                      <Button className="w-full">Enroll Now</Button>
                    ) : (
                      <Link href="/auth/signup" className="w-full">
                        <Button className="w-full">Sign Up to Enroll</Button>
                      </Link>
                    )}
                  </>
                )}
                <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
                  <p>Duration: {course.duration_hours} hours</p>
                  <p>Level: {course.difficulty}</p>
                  <p>Instructor: {course.instructor_id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

