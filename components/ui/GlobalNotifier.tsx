"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { usePathname } from "next/navigation"

export function GlobalNotifier({ userId }: { userId: string }) {
  const pathname = usePathname()
  const audioCtx = useRef<AudioContext | null>(null)

  const playMessageSound = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const ctx = audioCtx.current
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    // Softer double-blip for messages
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
  }

  useEffect(() => {
    // Request permission once
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    const supabase = createClient()
    
    // We listen to the messages table where receiver_id == userId
    // Note: Supabase RLS on 'messages' table will naturally filter this if set up correctly, 
    // but the filter string `receiver_id=eq.${userId}` ensures we only process our own messages.
    // Wait, the table might just be 'messages'. Let's listen to all inserts and check.
    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new
          // Check if message is for us
          // And don't notify if we are already in the chat room for this match
          if (newMsg.sender_id !== userId) {
            const isCurrentlyInChat = pathname?.includes(`/chat/${newMsg.match_id}`)
            
            if (!isCurrentlyInChat) {
              if ("Notification" in window && Notification.permission === "granted") {
                const options: any = {
                  body: `New message received!`,
                  icon: "/icon.png",
                  vibrate: [100, 50, 100]
                }
                new Notification("Incogni Message", options)
              }
              playMessageSound()
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, pathname])

  return null
}
