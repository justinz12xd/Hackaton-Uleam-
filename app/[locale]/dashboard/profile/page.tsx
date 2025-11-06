import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, redirect } from "@/lib/i18n/routing"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const profileResponse = await supabase.from("profiles").select("*").eq("id", data.user.id).single()
  const profile = profileResponse.data

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and manage your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={profile?.full_name || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={data.user.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" value={profile?.bio || ""} disabled placeholder="Add your bio" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <Input id="role" value={profile?.role || "student"} disabled />
              </div>
            </div>
            <Button disabled>Edit Profile (Coming Soon)</Button>
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Certificates</CardTitle>
            <CardDescription>Download and share your earned certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Complete courses to earn certificates</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

