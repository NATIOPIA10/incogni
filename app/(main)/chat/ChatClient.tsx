"use client"

import { GlassCard } from "@/components/ui/GlassCard"
import { MessageCircle, User, ChevronRight } from "lucide-react"
import Link from "next/link"

interface ChatClientProps {
  matches: any[]
  currentUser: any
}

export default function ChatClient({ matches, currentUser }: ChatClientProps) {
  return (
    <main className="flex flex-col min-h-screen p-6 overflow-y-auto pb-24">
      <h1 className="font-display text-2xl font-semibold tracking-wide mb-8 mt-4">Current Connections</h1>

      <div className="space-y-4">
        {matches.length > 0 ? matches.map((match) => {
          const otherProfile = match.user_1_id === currentUser.id ? match.user_2 : match.user_1
          const lastMessage = match.messages?.[0]
          
          return (
            <Link key={match.id} href={`/chat/${match.id}`}>
              <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-white/5 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#A855F7]/20 flex items-center justify-center border border-[#A855F7]/30">
                  <User className="w-6 h-6 text-[#A855F7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {otherProfile?.personality_vibes?.[0] || 'Anonymous'} Voyager
                  </h3>
                  <p className="text-xs text-[#978d9a] truncate mt-0.5">
                    {lastMessage?.content || "Connection established. Say hi!"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {lastMessage && (
                    <span className="text-[10px] text-[#4c444f]">
                      {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#4c444f]" />
                </div>
              </GlassCard>
            </Link>
          )
        }) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <MessageCircle className="w-16 h-16 mb-4 text-[#4c444f]" />
            <p className="text-sm">You are not connected yet.</p>
            <p className="text-xs mt-2">The system allows only one active connection at a time.</p>
          </div>
        )}
      </div>
    </main>
  )
}
