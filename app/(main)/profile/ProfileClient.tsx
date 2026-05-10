"use client"

import { GlassCard } from "@/components/ui/GlassCard"
import { TrustMeter } from "@/components/ui/TrustMeter"
import { ShieldCheck, Music, Coffee, Book, User, Settings } from "lucide-react"

interface ProfileClientProps {
  profile: any
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const vibes = profile?.personality_vibes || []
  const status = profile?.verification_status || 'pending'
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'verified': return 'text-[#10B981] bg-[#10B981]/10'
      case 'pending_verification': return 'text-[#00D1FF] bg-[#00D1FF]/10'
      default: return 'text-[#A855F7] bg-[#A855F7]/10'
    }
  }

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'verified': return 'Verified Student'
      case 'pending_verification': return 'Verification Pending'
      default: return 'Unverified'
    }
  }

  return (
    <main className="flex flex-col min-h-screen p-6 overflow-y-auto pb-24">
      {/* Header */}
      <div className="relative w-full h-48 rounded-3xl overflow-hidden mt-4 flex items-center justify-center border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2E004B]/80 to-[#0B0E14] z-0" />
        <div className="absolute inset-0 bg-[#A855F7] opacity-20 blur-[60px] z-0" />
        
        <GlassCard className="z-10 w-24 h-24 rounded-full border-2 border-white/20 flex flex-col items-center justify-center backdrop-blur-[40px] overflow-hidden">
          <div className="w-full h-full bg-white/5 backdrop-blur-3xl absolute inset-0" />
          <User className="relative z-20 w-10 h-10 text-[#A855F7]" />
        </GlassCard>
      </div>

      <div className="mt-8 flex flex-col items-center text-center px-4">
        <h1 className="font-display text-2xl font-semibold tracking-wide mb-2">My Frequency</h1>
        <div className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-6 ${getStatusColor(status)}`}>
          <ShieldCheck className="w-3 h-3" />
          {getStatusLabel(status)}
        </div>

        <GlassCard className="w-full p-5 mb-6 border-[#2E004B]/30 bg-white/5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-semibold tracking-wider text-[#cec3d0] uppercase">System Trust</h2>
            <span className="text-[#10B981] font-medium text-sm">
              {status === 'verified' ? '100%' : status === 'pending_verification' ? '60%' : '20%'}
            </span>
          </div>
          <TrustMeter level={status === 'verified' ? 100 : status === 'pending_verification' ? 60 : 20} />
          <p className="text-[11px] text-[#978d9a] mt-3 text-left leading-relaxed">
            {status === 'verified' 
              ? "Your identity is fully verified. You have full access to all network features."
              : "Complete your verification to reveal your real name and photos to trusted matches."}
          </p>
        </GlassCard>

        <div className="w-full text-left mb-6">
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-display text-xl font-semibold text-[#e1e2eb]">My Vibe</h2>
            <button className="text-[10px] uppercase tracking-widest text-[#00D1FF] font-semibold">Edit</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {vibes.length > 0 ? vibes.map((v: string) => (
              <span key={v} className="bg-[#2E004B]/40 border border-white/5 px-4 py-1.5 rounded-full text-xs text-[#cec3d0]">
                {v}
              </span>
            )) : (
              <p className="text-xs text-[#4c444f]">No vibes set yet.</p>
            )}
          </div>
        </div>

        <GlassCard className="w-full p-5 mb-8 text-left border-white/5 bg-white/5">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-display text-lg font-semibold">Seeking</h2>
            <Settings className="w-4 h-4 text-[#4c444f]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile?.seeking_vibes || []).map((v: string) => (
              <span key={v} className="bg-[#00D1FF]/10 border border-[#00D1FF]/20 px-3 py-1 rounded-full text-[11px] text-[#00D1FF]">
                {v}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>
    </main>
  )
}
