'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    revalidatePath('/', 'layout')
    
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      redirect('/admin')
    } else {
      redirect('/radar')
    }
  }

  redirect('/radar')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is required, the session will be null
  if (!authData.session) {
    return { error: "Please check your email to confirm your account before logging in." }
  }

  // After signup, redirect to onboarding
  revalidatePath('/', 'layout')
  redirect('/onboarding/verification')
}
