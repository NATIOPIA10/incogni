'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLocation(lat: number, lng: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Use 8 decimal places for exact, high-precision GPS tracking (centimeter accuracy)
  const bucket = `${lat.toFixed(8)},${lng.toFixed(8)}`

  const { error } = await supabase
    .from('profiles')
    .update({ geo_bucket: bucket })
    .eq('id', user.id)

  if (error) return { error: error.message }
  
  revalidatePath('/radar')
  return { success: true, bucket }
}
