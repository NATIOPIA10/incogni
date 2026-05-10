"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function initiateMatch(otherUserId: string, initialMessage?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 1. Check if a match already exists (active or pending)
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id, status")
    .or(`and(user_1_id.eq.${user.id},user_2_id.eq.${otherUserId}),and(user_1_id.eq.${otherUserId},user_2_id.eq.${user.id})`)
    .maybeSingle()

  // 2. If match exists, just deliver message (if any) and return
  if (existingMatch) {
    if (initialMessage && initialMessage.trim()) {
      await supabase.from("messages").insert({
        match_id: existingMatch.id,
        sender_id: user.id,
        content: initialMessage.trim()
      })
    }
    return { success: true, matchId: existingMatch.id }
  }

  // 3. Otherwise, create a NEW match with 'pending' status
  const { data: newMatch, error: matchError } = await supabase
    .from("matches")
    .insert({
      user_1_id: user.id,
      user_2_id: otherUserId,
      initiator_id: user.id,
      status: 'pending'
    })
    .select()
    .single()

  if (matchError) {
    return { error: matchError.message }
  }

  // 4. Send initial message for new match
  if (initialMessage && initialMessage.trim()) {
    const { error: msgError } = await supabase.from("messages").insert({
      match_id: newMatch.id,
      sender_id: user.id,
      content: initialMessage.trim()
    })
    if (msgError) console.error("Initial message error:", msgError)
  }

  revalidatePath("/chat")
  return { success: true, matchId: newMatch.id }
}

export async function acceptMatch(matchId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("matches")
    .update({ status: 'active' })
    .eq("id", matchId)
    .neq("initiator_id", user.id) // Only receiver can accept

  if (error) return { error: error.message }
  
  revalidatePath("/chat")
  return { success: true }
}
