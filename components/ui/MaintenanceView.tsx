"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "./GlassCard"
import { Hammer, Clock, Sparkles } from "lucide-react"

export function MaintenanceView({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null)

  useEffect(() => {
    const target = new Date(startTime).getTime() + (72 * 60 * 60 * 1000)
    
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0) {
        window.location.reload()
        return
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime])

  if (!timeLeft) return null

  return (
    <div className="fixed inset-0 z-[999] bg-[#0B0E14] flex items-center justify-center p-6 text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A855F7] opacity-10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00D1FF] opacity-10 blur-[120px] animate-pulse delay-700" />
      </div>

      <GlassCard className="max-w-md w-full p-10 border-white/5 relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#A855F7] to-[#00D1FF] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-bounce">
          <Hammer className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-display font-bold text-white mb-4 tracking-tight">Ethereal Upgrade</h1>
        <p className="text-[#978d9a] mb-10 leading-relaxed text-sm">
          We are currently fine-tuning the soul resonance frequency. The network will be back online shortly.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-2xl font-display font-bold text-[#00D1FF]">{timeLeft.hours}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#4c444f] font-bold">Hours</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-2xl font-display font-bold text-white">{timeLeft.minutes}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#4c444f] font-bold">Mins</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-2xl font-display font-bold text-[#A855F7]">{timeLeft.seconds}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#4c444f] font-bold">Secs</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#00D1FF] font-black">
          <Sparkles className="w-3 h-3" />
          Synchronizing Reality
          <Sparkles className="w-3 h-3" />
        </div>
      </GlassCard>
    </div>
  )
}
