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
  ShieldCheck,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

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
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-[60] p-2 bg-[#1A1A1A] border border-white/10 rounded-xl text-white shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#0B0E14] border-r border-white/5 flex flex-col p-6 z-[80] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-7 right-6 text-[#4c444f] hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-white/10">
            <img src="/icon.png" alt="Incogni Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold tracking-tight text-white uppercase text-lg">Incogni</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
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
    </>
  )
}
