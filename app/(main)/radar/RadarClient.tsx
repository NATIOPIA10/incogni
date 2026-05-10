"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import { X, Zap } from "lucide-react"
import Link from "next/link"
import { initiateMatch } from "@/app/actions/match"

export type RadarProfile = {
  id: string
  personality_vibes: string[]
  seeking_vibes: string[]
  compatibility: number
}

// Deterministically scatter profiles across angles/distances based on their id
function getPosition(id: string, index: number) {
  // Use char codes from id for deterministic but varied placement
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const angle = ((hash * 137.5 + index * 60) % 360) // golden-angle spread
  const distance = 30 + (hash % 40) // 30–70% of radar radius
  return { angle, distance }
}

// Pick a colour for the glow based on compatibility
function getVibeColor(compat: number) {
  if (compat >= 70) return "#A855F7" // purple – high match
  if (compat >= 40) return "#00D1FF" // cyan  – medium
  return "#10B981"                   // green – low
}

export default function RadarClient({ profiles, myVibes }: { profiles: RadarProfile[]; myVibes: string[] }) {
  const [selected, setSelected] = useState<RadarProfile | null>(null)

  // Close the detail card when tapping the backdrop
  const close = () => setSelected(null)

  return (
    <div className="flex flex-col items-center w-full h-full relative">
      {/* ── Radar canvas ─────────────────────────────── */}
      <div className="relative flex items-center justify-center w-72 h-72 mt-6">
        {/* Sweep arm */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{ width: "50%", height: "2px", translateX: "-0%", translateY: "-50%" }}
          >
            <div className="w-full h-full bg-gradient-to-r from-[#00D1FF]/60 to-transparent" />
          </motion.div>
        </motion.div>

        {/* Concentric rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-[#00D1FF]/20"
            style={{ width: `${ring * 33}%`, height: `${ring * 33}%` }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: ring * 0.5 }}
          />
        ))}

        {/* Pulsing outer ring */}
        {[1, 2].map((r) => (
          <motion.div
            key={`pulse-${r}`}
            className="absolute rounded-full border border-[#00D1FF]/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: [1, 1.4, 2], opacity: [0.5, 0.2, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: r * 1.5, ease: "easeOut" }}
            style={{ width: "100%", height: "100%" }}
          />
        ))}

        {/* Center dot = me */}
        <div className="absolute w-5 h-5 rounded-full bg-[#00D1FF] shadow-[0_0_20px_#00D1FF] z-20" />

        {/* Profile blips */}
        {profiles.map((profile, i) => {
          const { angle, distance } = getPosition(profile.id, i)
          const radians = (angle * Math.PI) / 180
          // radar is 288px wide → max radius ≈ 130px; distance is 30-70 → scale 0.3-0.7
          const radius = (distance / 100) * 130
          const x = Math.cos(radians) * radius
          const y = Math.sin(radians) * radius
          const color = getVibeColor(profile.compatibility)

          return (
            <motion.button
              key={profile.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
              className="absolute z-10 flex items-center justify-center"
              style={{ x, y }}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelected(profile)}
              aria-label={`View profile with ${profile.compatibility}% compatibility`}
            >
              {/* Glow halo */}
              <div
                className="absolute w-10 h-10 rounded-full blur-md opacity-60"
                style={{ background: color }}
              />
              {/* Glass disc */}
              <GlassCard className="w-10 h-10 rounded-full relative border flex items-center justify-center overflow-hidden"
                style={{ borderColor: `${color}60` }}>
                <span className="text-[10px] font-bold" style={{ color }}>
                  {profile.compatibility}%
                </span>
              </GlassCard>
            </motion.button>
          )
        })}
      </div>

      {/* Status text */}
      <div className="mt-6 text-center">
        <p className="text-[#cec3d0] text-sm">
          {profiles.length === 0
            ? "No one nearby yet — check back soon"
            : `Scanning for resonant frequencies...`}
        </p>
        {profiles.length > 0 && (
          <p className="text-[#00D1FF] font-medium text-sm animate-pulse mt-1">
            {profiles.length} {profiles.length === 1 ? "connection" : "connections"} nearby
          </p>
        )}
      </div>

      {/* ── Profile detail drawer ─────────────────────── */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-24 left-4 right-4 z-40 rounded-2xl"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              <GlassCard className="p-6 border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#A855F7]" />
                    <span className="font-semibold text-white text-lg">
                      {selected.compatibility}% Resonance
                    </span>
                  </div>
                  <button
                    onClick={close}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Shared vibes */}
                {(() => {
                  const shared = (selected.personality_vibes ?? []).filter(v =>
                    myVibes.includes(v)
                  )
                  return shared.length > 0 ? (
                    <div className="mb-4">
                      <p className="text-xs text-[#cec3d0] mb-2 uppercase tracking-wider">Shared Vibes</p>
                      <div className="flex flex-wrap gap-2">
                        {shared.map(v => (
                          <span key={v} className="px-3 py-1 rounded-full text-xs font-medium bg-[#A855F7]/20 border border-[#A855F7]/40 text-[#e3b5ff]">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null
                })()}

                {/* Their vibes */}
                {selected.personality_vibes?.length > 0 && (
                  <div>
                    <p className="text-xs text-[#cec3d0] mb-2 uppercase tracking-wider">Their Vibe</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.personality_vibes.map(v => (
                        <span key={v} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-[#cec3d0]">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[#978d9a] text-[10px] mt-4 text-center leading-relaxed">
                  Profiles are anonymous to protect privacy. Connect to reveal more.
                </p>

                <div className="mt-6">
                  <button 
                    onClick={async () => {
                      if (selected) {
                        const result = await initiateMatch(selected.id)
                        if (result?.error) {
                          alert(result.error)
                        }
                      }
                    }}
                    className="w-full h-12 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00D1FF] transition-colors"
                  >
                    Initiate Secure Connection
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
