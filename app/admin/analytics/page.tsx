import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import AnalyticsClient from "./AnalyticsClient"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect("/")
  }

  // 1. Vibe Distribution
  const { data: vibes } = await supabase
    .from("profiles")
    .select("vibe_type")
    .not("vibe_type", "is", null)

  const vibeCounts: Record<string, number> = {}
  vibes?.forEach(v => {
    vibeCounts[v.vibe_type] = (vibeCounts[v.vibe_type] || 0) + 1
  })
  const totalVibes = vibes?.length || 1
  const vibeData = Object.entries(vibeCounts).map(([label, count]) => ({
    label,
    value: Math.round((count / totalVibes) * 100)
  })).sort((a, b) => b.value - a.value)

  // 2. Weekly Signup Flow (Last 6 weeks)
  const weeklyFlow = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - (i + 1) * 7)
    const end = new Date()
    end.setDate(end.getDate() - i * 7)
    
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
    
    weeklyFlow.push(count || 0)
  }

  // 3. User Growth (Last 7 days)
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const recentUsers = weeklyFlow[weeklyFlow.length - 1]
  const growthRate = totalUsers ? Math.round(((recentUsers || 0) / totalUsers) * 100) : 0

  // 4. Match Stats
  const { count: activeMatches } = await supabase.from("matches").select("*", { count: "exact", head: true, filter: "status.eq.active" })
  const matchSuccessRate = totalUsers ? Math.round((activeMatches || 0) / totalUsers * 100) : 0

  // 5. Report Density
  const { count: totalReports } = await supabase.from("reports").select("*", { count: "exact", head: true })
  const reportDensity = totalUsers ? ((totalReports || 0) / totalUsers * 100).toFixed(2) : "0.00"

  const analyticsData = {
    vibeData: vibeData.length > 0 ? vibeData : [{ label: "No Data", value: 0 }],
    matchSuccessRate,
    totalUsers: totalUsers || 0,
    growthRate,
    reportDensity,
    weeklyFlow
  }

  return <AnalyticsClient data={analyticsData} />
}
