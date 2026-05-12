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
