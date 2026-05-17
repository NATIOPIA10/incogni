"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !['admin', 'super_admin', 'moderator'].includes(profile.role)) {
    throw new Error("Forbidden")
  }
  return { supabase, adminId: user.id }
}

export async function updateUserStatus(userId: string, status: string) {
  const { supabase, adminId } = await checkAdmin()

  const { error } = await supabase
    .from("profiles")
    .update({ 
      verification_status: status,
      trust_score: status === 'verified' ? 100 : 50 
    })
    .eq("id", userId)

  if (error) throw error

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action_type: `VERIFY_USER_${status.toUpperCase()}`,
    target_user_id: userId,
    reason: `Admin manually updated verification status to ${status}`
  })

  revalidatePath("/admin/users")
}

export async function toggleUserSuspension(userId: string, isSuspended: boolean) {
  const { supabase, adminId } = await checkAdmin()

  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: isSuspended })
    .eq("id", userId)

  if (error) throw error

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action_type: isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
    target_user_id: userId
  })

  revalidatePath("/admin/users")
}

export async function resetUserPassword(email: string) {
  const { supabase, adminId } = await checkAdmin()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) throw error

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action_type: 'RESET_PASSWORD_INITIATED',
    reason: `Admin triggered password reset for ${email}`
  })
}

export async function blockUser(userId: string) {
  const { supabase, adminId } = await checkAdmin()

  const { error } = await supabase
    .from("profiles")
    .update({ 
      is_suspended: true,
      verification_status: 'rejected'
    })
    .eq("id", userId)

  if (error) throw error

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action_type: 'BLOCK_USER',
    target_user_id: userId,
    reason: 'Admin manually blocked user'
  })

  revalidatePath("/admin/users")
}

export async function updateAIWeights(weights: any) {
  const { supabase, adminId } = await checkAdmin()

  const { error } = await supabase
    .from("system_config")
    .upsert({ 
      key: "matching_weights",
      value: weights,
      updated_by: adminId,
      updated_at: new Date().toISOString()
    })

  if (error) throw error
  revalidatePath("/admin/ai")
}

export async function updateSystemSetting(key: string, value: any) {
  const { supabase, adminId } = await checkAdmin()

  const { error } = await supabase
    .from("system_config")
    .upsert({ 
      key: key,
      value: value,
      updated_by: adminId,
      updated_at: new Date().toISOString()
    })

  if (error) throw error

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action_type: 'UPDATE_SETTING',
    reason: `Changed ${key} to ${JSON.stringify(value)}`
  })

  revalidatePath("/admin/settings")
}

export async function updateReportStatus(reportId: string, status: 'investigating' | 'resolved' | 'dismissed', notes?: string) {
  const { supabase, adminId } = await checkAdmin()

  const { error } = await supabase
    .from("reports")
    .update({ 
      status,
      resolution_notes: notes || `Marked as ${status} by admin`,
      resolved_at: status !== 'investigating' ? new Date().toISOString() : null,
      resolved_by: adminId
    })
    .eq("id", reportId)

  if (error) throw error

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action_type: `REPORT_${status.toUpperCase()}`,
    reason: `Report ${reportId} updated to ${status}. Notes: ${notes || 'None'}`
  })

  revalidatePath("/admin/moderation")
  revalidatePath("/admin")
}

export async function warnUser(userId: string, warningMessage: string) {
  const { supabase, adminId } = await checkAdmin()

  // Insert a notification or message to the user
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: 'admin_warning',
      title: 'Official Warning from Moderation',
      content: warningMessage,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error("Failed to insert notification:", error)
    // If notifications table doesn't exist or failed, log to admin logs
  }

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action_type: 'WARN_USER',
    target_user_id: userId,
    reason: warningMessage
  })

  revalidatePath("/admin/users")
}

export async function updateUserTrustScore(userId: string, trustScore: number) {
  const { supabase, adminId } = await checkAdmin()

  const clampedScore = Math.max(0, Math.min(100, trustScore))
  const { error } = await supabase
    .from("profiles")
    .update({ trust_score: clampedScore })
    .eq("id", userId)

  if (error) throw error

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action_type: 'UPDATE_TRUST_SCORE',
    target_user_id: userId,
    reason: `Admin manually adjusted trust score to ${clampedScore}%`
  })

  revalidatePath("/admin/users")
}

