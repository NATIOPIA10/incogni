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
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please ensure you are logged in." }
    }

    if (user.id === targetUserId) {
      return { error: "You cannot report your own account." }
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
      return { error: `Database error: ${error.message}` }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Unexpected error in submitUserReport:", err)
    return { error: err.message || "An unexpected error occurred while submitting your report." }
  }
}
