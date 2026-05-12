"use client"

import { useState, useEffect, useRef } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { TrustMeter } from "@/components/ui/TrustMeter"
import { Send, Lock, Unlock, Image as ImageIcon, ChevronLeft, Check, XCircle, MoreVertical, Edit2, Trash2, Reply, CornerDownRight, Save } from "lucide-react"

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
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<any | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editInput, setEditInput] = useState("")
  const [showMenuId, setShowMenuId] = useState<string | null>(null)


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
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => {
              if (prev.find(m => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id === payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, supabase])


  const handleSend = async () => {
    if (!input.trim() && !pendingImage) return

    const newMessage: any = {
      match_id: matchId,
      sender_id: currentUser.id,
      content: pendingImage ? (input.trim() ? `${pendingImage}||${input}` : pendingImage) : input,
    }

    if (replyTo) {
      newMessage.reply_to_id = replyTo.id
    }

    // Optimistic UI
    const optimisticMsg = { ...newMessage, id: Date.now().toString(), created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimisticMsg])
    setInput("")
    setPendingImage(null)
    setReplyTo(null)

    const { error } = await supabase
      .from("messages")
      .insert(newMessage)

    if (error) {
      console.error("Failed to send message:", error)
    } else {
      router.refresh()
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", msgId)
      .eq("sender_id", currentUser.id) // Security check

    if (error) {
      console.error("Delete error:", error)
    } else {
      setMessages(prev => prev.filter(m => m.id !== msgId))
      setShowMenuId(null)
    }
  }

  const handleEditMessage = async (msgId: string) => {
    if (!editInput.trim()) return

    const { error } = await supabase
      .from("messages")
      .update({ content: editInput })
      .eq("id", msgId)
      .eq("sender_id", currentUser.id)

    if (error) {
      console.error("Edit error:", error)
    } else {
      setEditingMessageId(null)
      setEditInput("")
      setShowMenuId(null)
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

    setPendingImage(publicUrl)
    setIsUploading(false)
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
          const isEditing = editingMessageId === msg.id;
          const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} relative group`}>
              {/* Reply Preview Above Message */}
              {replyMsg && (
                <div className={`flex items-center gap-2 mb-1 px-2 opacity-60 scale-90 origin-bottom-${isMe ? 'right' : 'left'}`}>
                  <CornerDownRight className="w-3 h-3" />
                  <div className="text-[10px] truncate max-w-[150px] italic">
                    {replyMsg.content.includes('||') ? "Image" : replyMsg.content}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 max-w-[85%] group">
                {isMe && !isEditing && (
                  <button 
                    onClick={() => setShowMenuId(showMenuId === msg.id ? null : msg.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 mt-2 text-[#4c444f] hover:text-[#00D1FF] transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}

                <div className={`px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all relative ${
                  isMe 
                    ? "bg-[#A855F7]/20 border-[#A855F7]/30 rounded-tr-none text-white shadow-[#A855F7]/5" 
                    : "bg-white/5 border-white/10 rounded-tl-none text-[#978d9a]"
                }`}>
                  {isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <textarea
                        autoFocus
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="bg-transparent border-none text-sm focus:outline-none resize-none w-full"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingMessageId(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded">
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditMessage(msg.id)} className="p-1 text-[#00D1FF] hover:bg-[#00D1FF]/10 rounded">
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {msg.content.includes('||') ? (
                        <div className="space-y-2">
                          <img 
                            src={msg.content.split('||')[0]} 
                            alt="Shared resonance" 
                            className="max-w-full rounded-lg border border-white/10 shadow-sm"
                          />
                          {msg.content.split('||')[1] && (
                            <p className="text-sm leading-relaxed">{msg.content.split('||')[1]}</p>
                          )}
                        </div>
                      ) : msg.content.startsWith('http') ? (
                        <img 
                          src={msg.content} 
                          alt="Shared image" 
                          className="max-w-full rounded-lg border border-white/10 shadow-sm"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </>
                  )}

                  {/* Context Menu Popup */}
                  {showMenuId === msg.id && (
                    <GlassCard className="absolute -top-12 right-0 p-1 flex gap-1 z-30 shadow-2xl border-white/20 animate-in fade-in zoom-in duration-200">
                      <button 
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditInput(msg.content.includes('||') ? msg.content.split('||')[1] : msg.content);
                          setShowMenuId(null);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg text-amber-400"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </GlassCard>
                  )}
                </div>

                {!isMe && !isEditing && (
                  <button 
                    onClick={() => setReplyTo(msg)}
                    className="opacity-0 group-hover:opacity-100 p-1 mt-2 text-[#4c444f] hover:text-[#00D1FF] transition-all"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5 px-1">
                <span className="text-[10px] text-[#4c444f] font-medium tracking-tighter uppercase">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.updated_at !== msg.created_at && (
                  <span className="text-[8px] text-[#4c444f] italic">Edited</span>
                )}
              </div>
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
        {replyTo && (
          <div className="max-w-md mx-auto mb-3 bg-white/5 rounded-xl p-3 border border-[#00D1FF]/30 flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <Reply className="w-4 h-4 text-[#00D1FF] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-[#00D1FF]">Replying to</p>
                <p className="text-xs text-[#978d9a] truncate italic">
                  {replyTo.content.includes('||') ? "Image message" : replyTo.content}
                </p>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/10 rounded-full">
              <XCircle className="w-4 h-4 text-[#978d9a]" />
            </button>
          </div>
        )}

        {pendingImage && (

          <div className="max-w-md mx-auto mb-3 relative group">
            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#A855F7] shadow-lg shadow-[#A855F7]/20">
              <img src={pendingImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
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
