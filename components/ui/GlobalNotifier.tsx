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

      // Create a more audible "chime" sound
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, ctx.currentTime) // A5
      osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5)
      
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1320, ctx.currentTime) // E6
      osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.5)
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.02) // Louder
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      
      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + 0.8)
      osc2.stop(ctx.currentTime + 0.8)
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
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW Registered', reg))
        .catch(err => console.error('SW Error', err))
    }
  }, [])


  const lastMsgId = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const pollMessages = async () => {
      try {
        const { data: latestMsg } = await supabase
          .from('messages')
          .select('id, match_id, sender_id, content')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestMsg && latestMsg.sender_id !== userId && latestMsg.id !== lastMsgId.current) {
          lastMsgId.current = latestMsg.id
          
          setToast({ 
            id: latestMsg.id, 
            matchId: latestMsg.match_id, 
            text: latestMsg.content?.includes("||") ? "Sent an image" : (latestMsg.content || "New message")
          })
          
          setTimeout(() => setToast(null), 6000)

          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("Incogni", { body: "New message!", icon: "/icon.png" })
            } catch (e) {}
          }
          
          playMessageSound()
        }
      } catch (e) {}
    }

    const interval = setInterval(pollMessages, 3000)
    pollMessages()

    return () => {
      clearInterval(interval)
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
