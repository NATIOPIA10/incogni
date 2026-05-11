"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X } from "lucide-react"

export function GlobalNotifier({ userId }: { userId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const audioCtx = useRef<AudioContext | null>(null)
  
  // Visual toast state
  const [toast, setToast] = useState<{ id: string, matchId: string, text: string } | null>(null)

  const playMessageSound = () => {
    try {
      if (!audioCtx.current) return
      const ctx = audioCtx.current
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2)
      
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch (e) {
      console.error("Audio ping failed:", e)
    }
  }

  const pathnameRef = useRef(pathname)
  
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Pre-warm Audio Context on first interaction to bypass autoplay restrictions
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      if (audioCtx.current?.state === 'suspended') {
        audioCtx.current.resume()
      }
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
    window.addEventListener('click', unlockAudio)
    window.addEventListener('touchstart', unlockAudio)
    return () => {
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  useEffect(() => {
    // Request permission once
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    const supabase = createClient()
    console.log("[GlobalNotifier] Listening to global messages for user", userId)
    
    const channel = supabase
      .channel('messages-universal')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
        },
        (payload) => {
          console.log("[GlobalNotifier] MSG:", payload)
          const newMsg = payload.new
          
          // Only notify if not from us
          if (newMsg && newMsg.sender_id !== userId) {
            // Check if we are currently in THIS specific chat room
            const isCurrentlyInThisChat = pathnameRef.current?.includes(newMsg.match_id)
            
            if (!isCurrentlyInThisChat) {
              setToast({ 
                id: newMsg.id || String(Date.now()), 
                matchId: newMsg.match_id, 
                text: newMsg.content?.includes("||") ? "Sent an image" : (newMsg.content || "New message")
              })
              
              setTimeout(() => setToast(null), 5000)

              if ("Notification" in window && Notification.permission === "granted") {
                try {
                  new Notification("Incogni Message", {
                    body: "New message received",
                    icon: "/icon.png"
                  })
                } catch (e) {}
              }
              
              playMessageSound()
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("[GlobalNotifier] Status:", status)
      })

    return () => {
      console.log("[GlobalNotifier] Cleaning up channel")
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-6 left-4 right-4 z-50 flex justify-center pointer-events-none"
        >
          <div className="bg-[#191c22]/95 backdrop-blur-md border border-[#00D1FF]/30 shadow-lg shadow-[#00D1FF]/10 rounded-2xl p-4 flex items-center gap-4 max-w-sm w-full pointer-events-auto cursor-pointer"
               onClick={() => {
                 setToast(null)
                 router.push(`/chat/${toast.matchId}`)
               }}
          >
            <div className="w-10 h-10 rounded-full bg-[#00D1FF]/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-[#00D1FF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white mb-0.5">New Resonance Signal</p>
              <p className="text-sm text-[#cec3d0] truncate">{toast.text}</p>
            </div>
            <button 
              className="p-2 text-gray-500 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                setToast(null)
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
