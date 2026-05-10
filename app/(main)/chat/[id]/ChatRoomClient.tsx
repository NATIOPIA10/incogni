"use client"

import { useState, useEffect, useRef } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { TrustMeter } from "@/components/ui/TrustMeter"
import { Send, Lock, Unlock, Image as ImageIcon, ChevronLeft, Check, XCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { acceptMatch } from "@/app/actions/match"

interface ChatRoomClientProps {
  initialMessages: any[]
  currentUser: any
  otherProfile: any
  matchId: string
  status: string
  initiatorId: string
}

export default function ChatRoomClient({ 
  initialMessages, 
  currentUser, 
  otherProfile, 
  matchId,
  status: initialStatus,
  initiatorId
}: ChatRoomClientProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [status, setStatus] = useState(initialStatus)
  const [input, setInput] = useState("")
  const [trustLevel, setTrustLevel] = useState(40)
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Real-time Status Sync
  useEffect(() => {
    const channel = supabase
      .channel(`match_status_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          if (payload.new.status === 'active') {
            setStatus('active')
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, supabase, router])

  // Real-time Message Sync
  useEffect(() => {
    const channel = supabase
      .channel(`room_messages_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          // Add message if not already present (avoid duplicates from optimistic UI)
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, supabase])

  const handleSend = async () => {
    if (!input.trim()) return

    const newMessage = {
      match_id: matchId,
      sender_id: currentUser.id,
      content: input,
    }

    // Optimistic UI
    const optimisticMsg = { ...newMessage, id: Date.now(), created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimisticMsg])
    setInput("")

    const { error } = await supabase
      .from("messages")
      .insert(newMessage)

    if (error) {
      console.error("Failed to send message:", error)
    } else {
      router.refresh()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${matchId}/${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { data, error } = await supabase.storage
      .from('chat_images')
      .upload(filePath, file)

    if (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat_images')
      .getPublicUrl(filePath)

    // Send the image URL as a message
    const newMessage = {
      match_id: matchId,
      sender_id: currentUser.id,
      content: publicUrl, // The content is the URL
    }

    await supabase.from("messages").insert(newMessage)
    setIsUploading(false)
    router.refresh()
  }

  const handleAccept = async () => {
    const res = await acceptMatch(matchId)
    if (res.success) {
      setStatus('active')
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const isInitiator = currentUser.id === initiatorId
  const isPending = status === 'pending'

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <header className="px-6 py-4 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/chat" className="p-2 -ml-2 text-[#978d9a] hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#A855F7]/30 blur-[1px] border border-white/20 flex items-center justify-center">
              <span className="text-sm">✨</span>
            </div>
            <div>
              <h1 className="font-display font-semibold text-sm">
                {otherProfile?.personality_vibes?.[0] || 'Anonymous'} Voyager
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[#10B981] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure Connection
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 ml-10">
          <span className="text-[10px] uppercase tracking-widest text-[#978d9a]">Trust</span>
          <TrustMeter level={trustLevel} className="flex-1 h-1.5" />
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all ${
                isMe 
                  ? "bg-[#A855F7]/20 border-[#A855F7]/30 rounded-tr-none text-white shadow-[#A855F7]/5" 
                  : "bg-white/5 border-white/10 rounded-tl-none text-[#978d9a]"
              }`}>
                {msg.content.startsWith('http') ? (
                  <img 
                    src={msg.content} 
                    alt="Shared image" 
                    className="max-w-full rounded-lg border border-white/10 shadow-sm"
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
              <span className="text-[10px] text-[#4c444f] mt-1.5 px-1 font-medium tracking-tighter uppercase">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isPending && !isInitiator && (
          <div className="flex flex-col items-center gap-4 py-8">
            <GlassCard className="p-6 text-center border-[#A855F7]/30 bg-[#A855F7]/5 max-w-sm">
              <h3 className="font-semibold mb-2">New Resonance Signal!</h3>
              <p className="text-xs text-[#978d9a] mb-6">
                Someone nearby has resonated with your vibes. Allow this connection to start chatting securely?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={handleAccept}
                  className="flex-1 h-10 bg-[#10B981] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#10B981]/80 transition-colors"
                >
                  <Check className="w-4 h-4" /> Allow
                </button>
                <button className="flex-1 h-10 bg-white/5 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                  <XCircle className="w-4 h-4" /> Ignore
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {isPending && isInitiator && (
          <div className="flex flex-col items-center gap-2 py-8 opacity-60">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
              <Lock className="w-4 h-4 text-[#978d9a]" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-[#978d9a]">Waiting for Resonance...</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#0B0E14]/80 backdrop-blur-md border-t border-white/5 sticky bottom-0 z-20 pb-28">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload}
          />
          <button 
            disabled={isUploading || isPending}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full bg-white/5 text-[#978d9a] hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-[#00D1FF] border-t-transparent animate-spin rounded-full" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              disabled={isPending}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isPending ? (isInitiator ? "Waiting for resonance..." : "Allow connection to reply") : "Send a safe message..."}
              className="w-full bg-[#191c22] border border-white/10 rounded-full h-12 pl-5 pr-12 text-sm focus:outline-none focus:border-[#00D1FF]/50 transition-all disabled:opacity-50"
              suppressHydrationWarning
            />
            {!isPending && (
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#00D1FF] hover:bg-[#00D1FF]/10 rounded-full transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
