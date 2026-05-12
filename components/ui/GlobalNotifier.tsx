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

      // Create a "Mega-Volume" triple chime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const osc3 = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6)
      
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1320, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.6)

      osc3.type = 'square' // Square waves are much louder/piercing
      osc3.frequency.setValueAtTime(220, ctx.currentTime)
      osc3.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.6)
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(1.5, ctx.currentTime + 0.02) // Max volume boost
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)
      
      osc1.connect(gainNode)
      osc2.connect(gainNode)
      osc3.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc1.start()
      osc2.start()
      osc3.start()
      osc1.stop(ctx.currentTime + 1.0)
      osc2.stop(ctx.currentTime + 1.0)
      osc3.stop(ctx.currentTime + 1.0)
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
    console.log(`INITIALIZING GLOBAL NOTIFIER FOR USER: ${userId}`)
    
    // 1. Suspension Listener (Real-time)
    const channel = supabase
      .channel('suspension-sync')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${userId}` 
        },
        (payload) => {
          console.log("REAL-TIME PROFILE UPDATE RECEIVED:", payload)
          if (payload.new.is_suspended === true) {
            console.log("SUSPENSION DETECTED - FORCING REDIRECT")
            router.push('/suspended')
            setTimeout(() => window.location.reload(), 100)
          }
        }
      )
      .subscribe((status) => {
        console.log("SUSPENSION SYNC STATUS:", status)
      })

    // 2. Poll Messages & Fallback Suspension Check
    const pollMessages = async () => {
      console.log("POLLING SESSION STATUS...")
      try {
        // Fallback: Check if user is suspended during polling
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('is_suspended')
          .eq('id', userId)
          .single()
        
        if (pError) {
          console.error("POLLING ERROR:", pError)
          // If column doesn't exist, stop polling for suspension to prevent spamming errors
          if (pError.code === 'PGRST204' || pError.message?.includes("column")) {
             console.warn("Suspension column not found. Skipping suspension check.")
          }
        }

        if (profile?.is_suspended) {
          console.log("POLLING DETECTED SUSPENSION - FORCING REDIRECT")
          router.push('/suspended')
          setTimeout(() => window.location.reload(), 100)
          return
        }

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
          
          if ("vibrate" in navigator) {
            navigator.vibrate([100, 50, 100]);
          }

          setTimeout(() => setToast(null), 6000)

          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("Incogni", { body: "New Resonance Detected", icon: "/icon.png" })
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'SHOW_NOTIFICATION',
                  title: 'Incogni Resonance',
                  body: 'A new signal has emerged'
                });
              }
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
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, router])

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
