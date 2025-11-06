import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, MoreVertical } from "lucide-react"
import Link from "next/link"

export default async function AdminUsersPage() {
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

  // Fetch all users with enrollment count
  const usersResponse = await supabase
    .from("profiles")
    .select("*, _count:course_enrollments(count)")
    .order("created_at", { ascending: false })

  const allUsers = usersResponse.data || []

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
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage all platform users and their roles</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users by name or email..." className="pl-10" disabled />
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({allUsers.length})</CardTitle>
            <CardDescription>View and manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {allUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-semibold">Name</th>
                      <th className="text-left py-3 px-3 font-semibold">Email</th>
                      <th className="text-left py-3 px-3 font-semibold">Role</th>
                      <th className="text-left py-3 px-3 font-semibold">Joined</th>
                      <th className="text-left py-3 px-3 font-semibold">Activity</th>
                      <th className="text-left py-3 px-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-3">{user.full_name || "-"}</td>
                        <td className="py-3 px-3">{user.email}</td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-xs">{user._count?.[0]?.count || 0} enrollments</td>
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
              <p className="text-center text-muted-foreground py-12">No users found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
