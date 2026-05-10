import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ModerationClient from "./ModerationClient"

export default async function AdminModerationPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  // Check if user is moderator/admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !['moderator', 'admin', 'super_admin'].includes(profile.role)) {
    redirect("/")
  }

  // Fetch reports
  const { data: reports } = await supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_id_fkey(id), target:profiles!reports_target_user_id_fkey(id)")
    .order("created_at", { ascending: false })

  return <ModerationClient initialReports={reports || []} />
}
