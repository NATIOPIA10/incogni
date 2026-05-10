import { BottomNav } from "@/components/ui/BottomNav"
import { createClient } from "@/utils/supabase/server"
import { MaintenanceView } from "@/components/ui/MaintenanceView"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check Maintenance Mode
  const { data: config } = await supabase
    .from('system_config')
    .eq('key', 'maintenance_mode')
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = ['admin', 'super_admin', 'moderator'].includes(profile?.role || 'user')
  }

  if (config?.value === true && !isAdmin) {
    const updatedAt = new Date(config.updated_at).getTime()
    const now = new Date().getTime()
    const diffMs = (updatedAt + (72 * 60 * 60 * 1000)) - now

    if (diffMs > 0) {
      return <MaintenanceView startTime={config.updated_at} />
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-24">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
