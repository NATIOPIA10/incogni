"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Radar, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: "/radar", icon: Radar, label: "Radar" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/90 to-transparent">
      <div className="flex items-center justify-around max-w-md mx-auto glass-panel rounded-full py-3 px-6">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href)
          const Icon = link.icon
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-full transition-colors",
                isActive ? "text-[#00D1FF]" : "text-[#cec3d0] hover:text-[#e1e2eb]"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(0,209,255,0.6)]")} />
              <span className="text-[10px] font-medium tracking-wide uppercase">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
