"use server"

import { createClient } from "@/utils/supabase/server"

export async function submitUserReport({
  targetUserId,
  reasonCategory,
  evidenceText
}: {
  targetUserId: string
  reasonCategory: string
  evidenceText?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Unauthorized to submit report.")
  }

  if (user.id === targetUserId) {
    throw new Error("You cannot report your own account.")
  }

  const { error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      target_user_id: targetUserId,
      reason_category: reasonCategory,
      evidence_text: evidenceText ? evidenceText.trim() : "No additional evidence provided.",
      status: "pending"
    })

  if (error) {
    console.error("Submit report error:", error)
    throw new Error(error.message)
  }

  return { success: true }
}
