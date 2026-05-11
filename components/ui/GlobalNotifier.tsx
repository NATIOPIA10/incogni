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

  const pathnameRef = useRef(pathname)
  
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    // Request permission once
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    const supabase = createClient()
    console.log("[GlobalNotifier] Listening to global messages for user", userId)
    
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
          console.log("[GlobalNotifier] Received message payload:", payload)
          const newMsg = payload.new
          if (newMsg.sender_id !== userId) {
            const isCurrentlyInChat = pathnameRef.current?.includes(`/chat/${newMsg.match_id}`)
            console.log(`[GlobalNotifier] Message from others. Currently in chat? ${isCurrentlyInChat}`)
            
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
      .subscribe((status) => {
        console.log("[GlobalNotifier] Subscription status:", status)
      })

    return () => {
      console.log("[GlobalNotifier] Cleaning up channel")
      supabase.removeChannel(channel)
    }
  }, [userId])

  return null
}
