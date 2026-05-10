"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function initiateMatch(otherUserId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 1. Check if a match already exists between these two
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id")
    .or(`and(user_1_id.eq.${user.id},user_2_id.eq.${otherUserId}),and(user_1_id.eq.${otherUserId},user_2_id.eq.${user.id})`)
    .eq("status", "active")
    .single()

  if (existingMatch) {
    redirect(`/chat/${existingMatch.id}`)
  }

  // 2. Try to create a new match
  const { data: newMatch, error } = await supabase
    .from("matches")
    .insert({
      user_1_id: user.id,
      user_2_id: otherUserId,
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    // This will happen if one of them is already matched (due to trigger)
    return { error: error.message || "One of you already has an active connection." }
  }

  revalidatePath("/chat")
  redirect(`/chat/${newMatch.id}`)
}
