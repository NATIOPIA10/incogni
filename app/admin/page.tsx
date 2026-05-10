import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import AdminOverviewClient from "./AdminOverviewClient"

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !['moderator', 'admin', 'super_admin'].includes(profile.role)) {
    redirect("/")
  }

  // Fetch real stats from database
  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { count: matchCount } = await supabase.from("matches").select("*", { count: "exact", head: true, filter: "status.eq.active" })
  const { count: messageCount } = await supabase.from("messages").select("*", { count: "exact", head: true })
  const { count: reportCount } = await supabase.from("reports").select("*", { count: "exact", head: true, filter: "status.eq.pending" })

  // Fetch recent activity logs
  const { data: recentLogs } = await supabase
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  const stats = {
    userCount: userCount || 0,
    matchCount: matchCount || 0,
    messageCount: messageCount || 0,
    reportCount: reportCount || 0
  }

  return <AdminOverviewClient stats={stats} recentLogs={recentLogs || []} />
}
