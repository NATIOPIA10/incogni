import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ChatClient from "./ChatClient"

export default async function ChatPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  // Fetch all matches involving the current user
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      *,
      user_1:profiles!user_1_id(id, personality_vibes, display_name),
      user_2:profiles!user_2_id(id, personality_vibes, display_name),
      messages(content, created_at)
    `)
    .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Match Fetch Error:", error)
  }

  return <ChatClient matches={matches || []} currentUser={user} />
}
