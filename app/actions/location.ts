'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLocation(lat: number, lng: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Round to 3 decimal places for "Geo-Bucketing" privacy (approx 100m precision)
  const bucket = `${lat.toFixed(4)},${lng.toFixed(4)}`

  const { error } = await supabase
    .from('profiles')
    .update({ geo_bucket: bucket })
    .eq('id', user.id)

  if (error) return { error: error.message }
  
  revalidatePath('/radar')
  return { success: true, bucket }
}
