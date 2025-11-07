import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Award, Users, BookOpen, PlayCircle } from "lucide-react"
import { Link, redirect } from "@/lib/i18n/routing"
import type { CourseContent } from "@/lib/types/course-content"

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

  // Fetch course details with instructor information
  const courseResponse = await supabase
    .from("courses")
    .select("*, instructor:profiles!instructor_id(full_name)")
    .eq("id", id)
    .single()

  if (!courseResponse.data) {
    redirect({ href: '/courses', locale })
  }

  const course = courseResponse.data
  const instructor = course.instructor as { full_name: string } | null

  // Check if user is enrolled
  const enrollmentResponse = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("course_id", id)
    .eq("student_id", user?.user?.id || "")
    .single()

  const isEnrolled = !!enrollmentResponse.data

  // Parsear el contenido del curso
  let courseContent: CourseContent | null = null
  try {
    if (course.content) {
      courseContent = typeof course.content === 'string' 
        ? JSON.parse(course.content) 
        : course.content
    }
  } catch (error) {
    console.error('Error parsing course content:', error)
  }

  // Contar lecciones totales
  const totalLessons = courseContent?.modules?.reduce(
    (total, module) => total + (module.lessons?.length || 0),
    0
  ) || 0

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
                {courseContent && courseContent.modules.length > 0 && (
                  <CardDescription>
                    {courseContent.modules.length} módulos • {totalLessons} lecciones
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {courseContent && courseContent.modules.length > 0 ? (
                  <div className="space-y-3">
                    {courseContent.modules.map((module, index) => (
                      <div key={module.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-start gap-3 p-4 bg-muted/30">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground">{module.title}</h4>
                            {module.description && (
                              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {module.lessons?.length || 0} lecciones
                              </span>
                              {module.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {module.duration} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {module.lessons && module.lessons.length > 0 && (
                          <div className="p-4 space-y-2 bg-background">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-2 text-sm py-2 px-3 rounded hover:bg-muted/50 transition-colors"
                              >
                                <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                                <span className="flex-1">{lesson.title}</span>
                                {lesson.duration && (
                                  <span className="text-xs text-muted-foreground">
                                    {lesson.duration} min
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Este curso aún no tiene contenido disponible</p>
                  </div>
                )}
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
                  <>
                    <Link href={`/courses/${id}/learn`}>
                      <Button className="w-full">Comenzar a Aprender</Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full">Ver Dashboard</Button>
                    </Link>
                  </>
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
                  <p>Instructor: {instructor?.full_name || "Unknown"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

