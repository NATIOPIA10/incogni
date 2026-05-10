import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import AITuningClient from "./AITuningClient"

export default async function AdminAIPage() {
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

  // Fetch AI config
  const { data: config } = await supabase
    .from("system_config")
    .select("*")
    .eq("key", "matching_weights")
    .single()

  return <AITuningClient initialWeights={config?.value || {}} />
}
