import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search } from "lucide-react"
import { Link } from "@/lib/i18n/routing"
import { CoursesClient } from "./courses-client"

interface Course {
  id: string
  title: string
  description: string
  difficulty_level: string
  duration_hours: number
  is_published: boolean
  created_at: string
}

export default async function CoursesPage() {
  const supabase = await createClient()

  // Fetch courses on server for better performance
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching courses:", error)
  }

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

      {/* Client component for search and filtering */}
      <CoursesClient initialCourses={courses || []} />
    </main>
  )
}
