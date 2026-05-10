import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ChatRoomClient from "./ChatRoomClient"

export default async function ChatRoomPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signup")

  // Fetch the specific match
  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      user_1:profiles!matches_user_1_id_fkey(id, personality_vibes),
      user_2:profiles!matches_user_2_id_fkey(id, personality_vibes)
    `)
    .eq("id", id)
    .single()

  if (!match) redirect("/chat")

  // Fetch messages for this match
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", id)
    .order("created_at", { ascending: true })

  const otherProfile = match.user_1_id === user.id ? match.user_2 : match.user_1

  return (
    <ChatRoomClient 
      initialMessages={messages || []} 
      currentUser={user} 
      otherProfile={otherProfile} 
      matchId={id}
    />
  )
}
