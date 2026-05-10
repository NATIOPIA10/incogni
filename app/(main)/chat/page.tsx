import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ChatClient from "./ChatClient"

export default async function ChatPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  // Fetch all matches involving the current user
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      user_1:profiles!matches_user_1_id_fkey(id, personality_vibes),
      user_2:profiles!matches_user_2_id_fkey(id, personality_vibes),
      messages(content, created_at)
    `)
    .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
    .eq("status", "active")
    .order("created_at", { foreignTable: "messages", ascending: false })

  return <ChatClient matches={matches || []} currentUser={user} />
}
