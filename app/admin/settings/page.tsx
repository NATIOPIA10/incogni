import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import SettingsClient from "./SettingsClient"

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    // Only super_admin can access global settings
    redirect("/admin")
  }

  // Fetch current system config
  const { data: config } = await supabase
    .from("system_config")
    .select("*")

  return <SettingsClient initialConfig={config || []} />
}
