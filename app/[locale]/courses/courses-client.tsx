"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Link } from "@/lib/i18n/routing"

interface Course {
  id: string
  title: string
  description: string
  difficulty_level: string
  duration_hours: number
  is_published: boolean
  created_at: string
}

interface CoursesClientProps {
  initialCourses: Course[]
}

export function CoursesClient({ initialCourses }: CoursesClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("All")

  // Memoize filtered courses for better performance
  const filteredCourses = useMemo(() => {
    let filtered = initialCourses

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query)
      )
    }

    // Filter by difficulty level
    if (selectedLevel !== "All") {
      filtered = filtered.filter(
        (course) => course.difficulty_level?.toLowerCase() === selectedLevel.toLowerCase()
      )
    }

    return filtered
  }, [initialCourses, searchQuery, selectedLevel])

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level)
  }

  return (
    <>
      {/* Search and Filter */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedLevel === "All" ? "outline" : "ghost"}
                size="sm"
                onClick={() => handleLevelChange("All")}
              >
                All {selectedLevel === "All" && `(${filteredCourses.length})`}
              </Button>
              <Button
                variant={selectedLevel === "Beginner" ? "outline" : "ghost"}
                size="sm"
                onClick={() => handleLevelChange("Beginner")}
              >
                Beginner
              </Button>
              <Button
                variant={selectedLevel === "Intermediate" ? "outline" : "ghost"}
                size="sm"
                onClick={() => handleLevelChange("Intermediate")}
              >
                Intermediate
              </Button>
              <Button
                variant={selectedLevel === "Advanced" ? "outline" : "ghost"}
                size="sm"
                onClick={() => handleLevelChange("Advanced")}
              >
                Advanced
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
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
              <p className="text-muted-foreground">
                {searchQuery || selectedLevel !== "All"
                  ? "No courses found matching your criteria"
                  : "No courses available yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

