import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ProfileSetupClient from "./ProfileSetupClient"

export default async function ProfileSetupPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // If they already have a display name, they might have already done this step
  // but we'll let them see it again if they navigated here manually.
  
  return <ProfileSetupClient profile={profile} />
}
