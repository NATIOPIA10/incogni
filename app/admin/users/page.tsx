import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import UsersClient from "./UsersClient"

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect("/")
  }

  // Fetch all users and total count
  const { data: users, count } = await supabase
    .from("profiles")
    .select("*", { count: 'exact' })
    .order("created_at", { ascending: false })

  console.log(`ADMIN DEBUG: Found ${users?.length} users in profiles table. Total count: ${count}`)

  return <UsersClient initialUsers={users || []} totalCount={count || 0} />
}
