"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function initiateMatch(otherUserId: string, initialMessage?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 1. Check if a match already exists between these two specifically
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id")
    .or(`and(user_1_id.eq.${user.id},user_2_id.eq.${otherUserId}),and(user_1_id.eq.${otherUserId},user_2_id.eq.${user.id})`)
    .eq("status", "active")
    .maybeSingle()

  if (existingMatch) {
    return { error: "You already have an active connection with this frequency." }
  }

  // 2. Create the match
  const { data: newMatch, error: matchError } = await supabase
    .from("matches")
    .insert({
      user_1_id: user.id,
      user_2_id: otherUserId,
      status: 'active'
    })
    .select()
    .single()

  if (matchError) {
    return { error: matchError.message }
  }

  // 3. Send initial message if provided
  if (initialMessage && initialMessage.trim()) {
    await supabase.from("messages").insert({
      match_id: newMatch.id,
      sender_id: user.id,
      content: initialMessage.trim()
    })
  }

  revalidatePath("/chat")
  return { success: true, matchId: newMatch.id }
}
