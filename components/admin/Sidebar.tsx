"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Zap, 
  BarChart3, 
  Settings, 
  LogOut,
  ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/moderation", icon: ShieldAlert, label: "Moderation" },
  { href: "/admin/ai", icon: Zap, label: "AI Tuning" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#0B0E14]/40 backdrop-blur-2xl border-r border-white/5 flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#00D1FF] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-bold tracking-tight text-white">SOUL ADMIN</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-white/10 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] border border-white/10" 
                  : "text-[#978d9a] hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive ? "text-[#00D1FF]" : "text-[#4c444f]"
              )} />
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D1FF] shadow-[0_0_8px_#00D1FF]" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-[#978d9a] hover:text-red-400 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-medium">Exit Admin</span>
        </button>
      </div>
    </aside>
  )
}
