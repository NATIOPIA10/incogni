"use client"

import { GlassCard } from "@/components/ui/GlassCard"
import { MessageCircle, User, ChevronRight, Trash2 } from "lucide-react"
import Link from "next/link"
import { deleteMatch } from "@/app/actions/match"

interface ChatClientProps {
  matches: any[]
  currentUser: any
}

export default function ChatClient({ matches, currentUser }: ChatClientProps) {
  const handleDelete = async (e: React.MouseEvent, matchId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (confirm("Are you sure you want to delete this connection? This will remove all messages.")) {
      const res = await deleteMatch(matchId)
      if (res.error) alert(res.error)
    }
  }

  return (
    <main className="flex flex-col min-h-screen p-6 overflow-y-auto pb-24">
      <h1 className="font-display text-2xl font-semibold tracking-wide mb-8 mt-4">Current Connections</h1>

      <div className="space-y-4">
        {matches.length > 0 ? matches.map((match) => {
          const otherProfile = match.user_1_id === currentUser.id ? match.user_2 : match.user_1
          const sortedMessages = [...(match.messages || [])].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          const lastMessage = sortedMessages[0]
          const displayName = otherProfile?.display_name || `${otherProfile?.personality_vibes?.[0] || 'Anonymous'} Voyager`
          
            return (
              <div key={match.id} className="relative group">
                <Link href={`/chat/${match.id}`}>
                  <GlassCard className={`p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-white/5 mb-3 ${match.status === 'pending' && match.initiator_id !== currentUser.id ? 'border-[#A855F7]/40 bg-[#A855F7]/5' : ''}`}>
                    <div className="w-12 h-12 rounded-full bg-[#A855F7]/20 flex items-center justify-center border border-[#A855F7]/30">
                      <User className="w-6 h-6 text-[#A855F7]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {displayName}
                        </h3>
                        {match.status === 'pending' && match.initiator_id !== currentUser.id && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#A855F7] text-white animate-pulse uppercase tracking-tighter">
                            Signal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#978d9a] truncate mt-0.5">
                        {lastMessage?.content?.includes('||') 
                          ? "Sent a photo" 
                          : (lastMessage?.content?.startsWith('http') ? "Sent a photo" : (lastMessage?.content || "Connection established. Say hi!"))}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {lastMessage && (
                        <span className="text-[10px] text-[#4c444f]">
                          {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleDelete(e, match.id)}
                          className="p-2 rounded-full hover:bg-red-500/10 text-[#4c444f] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#4c444f]" />
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </div>
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
