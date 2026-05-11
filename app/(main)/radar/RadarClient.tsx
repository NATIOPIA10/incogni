"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import { X, Zap, ShieldCheck, ShieldAlert, Shield, Radio } from "lucide-react"
import Link from "next/link"
import { updateLocation } from "@/app/actions/location"
import { initiateMatch } from "@/app/actions/match"
import { TrustMeter } from "@/components/ui/TrustMeter"
import { createClient } from "@/utils/supabase/client"

export type RadarProfile = {
  id: string
  display_name?: string
  age?: number
  personality_vibes: string[]
  seeking_vibes: string[]
  compatibility: number
  geo_bucket?: string
  trust_score?: number
  gender?: string
}

// Calculate real position based on geographic coordinates
function getRealPosition(myBucket: string | undefined, theirBucket: string | undefined, index: number, id: string, maxRangeMeters: number = 2000) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)

  if (!myBucket || !theirBucket) {
    // fallback if no location
    const angle = ((hash * 137.5 + index * 60) % 360) // golden-angle spread
    const distance = 30 + (hash % 40) // 30–70% of radar radius
    return { angle, distance }
  }
  
  const [myLat, myLng] = myBucket.split(",").map(Number)
  const [theirLat, theirLng] = theirBucket.split(",").map(Number)
  
  const dLat = theirLat - myLat
  const dLng = theirLng - myLng
  
  // Calculate distance in meters
  const diff = Math.sqrt(Math.pow(dLat, 2) + Math.pow(dLng, 2))
  const meters = diff * 111000

  // Math.atan2(y, x). Standard UI: y is down, x is right.
  // Geographic: North is up, East is right.
  // To map North to top of UI, y should be -dLat.
  let angle = 0;
  
  if (meters === 0) {
    // If they are exactly on top of me (same coordinates), give them a scattered angle
    angle = (hash * 137.5) % 360
  } else {
    angle = (Math.atan2(-dLat, dLng) * 180) / Math.PI
    // Add small deterministic jitter (-15 to 15 degrees) so close users don't perfectly overlap
    angle += (hash % 30) - 15
  }

  // Use the dynamic range from profile (default to 50m if not set/zero, but we'll pass it from component)
  let distancePercentage = (meters / maxRangeMeters) * 100
  
  // Add small deterministic distance jitter (-3% to +3%)
  distancePercentage += (hash % 7) - 3

  // Clamp so they don't fall outside the radar
  if (distancePercentage > 95) distancePercentage = 95
  
  // Minimum distance so it doesn't overlap the center "me" dot
  // If they are very close, scatter them slightly based on hash
  if (distancePercentage < 15) {
    distancePercentage = 15 + (hash % 10) 
  }
  
  return { angle, distance: distancePercentage }
}

// Pick a colour for the glow based on compatibility
function getVibeColor(compat: number) {
  if (compat >= 70) return "#A855F7" // purple – high match
  if (compat >= 40) return "#00D1FF" // cyan  – medium
  return "#10B981"                   // green – low
}

// Proximity logic based on buckets
function getProximityLabel(myBucket?: string, theirBucket?: string) {
  if (!myBucket || !theirBucket) return { label: "Nearby", meters: null, cardinal: "" }
  if (myBucket === theirBucket) return { label: "Very Close", meters: 15, cardinal: "Nearby" }
  
  const [myLat, myLng] = myBucket.split(",").map(Number)
  const [theirLat, theirLng] = theirBucket.split(",").map(Number)
  
  const dLat = theirLat - myLat
  const dLng = theirLng - myLng
  const diff = Math.sqrt(Math.pow(dLat, 2) + Math.pow(dLng, 2))
  
  // 1 degree is roughly 111,000 meters
  const meters = Math.round(diff * 111000)
  
  // Calculate angle for direction
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.round(((angle + 360) % 360) / 45) % 8
  const cardinal = directions[index]
  
  let label = "Nearby"
  if (meters < 50) label = "Very Close"
  else if (meters < 200) label = "On Campus"
  
  return { label, meters, cardinal }
}

export default function RadarClient({ 
  profiles, 
  myVibes, 
  myBucket,
  myRadius = 0.05
}: { 
  profiles: RadarProfile[]; 
  myVibes: string[];
  myBucket?: string;
  myRadius?: number;
}) {
  const [selected, setSelected] = useState<RadarProfile | null>(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [liveProfiles, setLiveProfiles] = useState(profiles)
  const [myLiveBucket, setMyLiveBucket] = useState(myBucket)
  
  const router = useRouter()
  const watchId = useRef<number | null>(null)
  const lastUpdate = useRef<number>(0)

  useEffect(() => {
    // Sync initial profiles to live profiles when props change
    setLiveProfiles(profiles)
  }, [profiles])

  useEffect(() => {
    // Supabase Realtime Subscription
    const supabase = createClient()
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setLiveProfiles(prev => prev.map(p => 
            p.id === payload.new.id ? { ...p, geo_bucket: payload.new.geo_bucket } : p
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [])

  // Auto-start tracking on mount
  useEffect(() => {
    startTracking()
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [])

  const startTracking = () => {
    if (!navigator.geolocation) return
    
    setIsTracking(true)
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setMyLiveBucket(`${lat},${lng}`)
        
        // Throttle DB updates to once every 10 seconds
        const now = Date.now()
        if (now - lastUpdate.current > 10000) {
          lastUpdate.current = now
          await updateLocation(lat, lng)
        }
      }, 
      (err) => {
        console.error("GPS Error:", err)
        setIsTracking(false)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )
  }

  const toggleTracking = () => {
    if (isTracking) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      setIsTracking(false)
    } else {
      startTracking()
    }
  }

  // Close the detail card when tapping the backdrop
  const close = () => setSelected(null)

  return (
    <div className="flex flex-col items-center w-full h-full relative">
      {/* ── Radar canvas ─────────────────────────────── */}
      <div className="relative flex items-center justify-center w-72 h-72 mt-6">
        {/* Sweep arm */}
        <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
          {isTracking && (
            <span className="text-[10px] uppercase font-bold text-[#10B981] animate-pulse bg-[#10B981]/20 px-2 py-1 rounded-full border border-[#10B981]/40">
              Live
            </span>
          )}
          <button 
            onClick={toggleTracking}
            className={`p-3 rounded-full border transition-all ${
              isTracking 
                ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                : 'bg-[#00D1FF]/10 border-[#00D1FF]/30 text-[#00D1FF] hover:bg-[#00D1FF]/20'
            }`}
            aria-label={isTracking ? "Stop Live Tracking" : "Start Live Tracking"}
          >
            {isTracking ? <Radio className="w-5 h-5 animate-pulse" /> : <Radio className="w-5 h-5" />}
          </button>
        </div>

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
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#00D1FF] shadow-[0_0_20px_#00D1FF] z-20" />

        {/* Profile blips */}
        {liveProfiles.map((profile, i) => {
          // Convert resonance_radius (km) to meters for calculation, default to 50m if very small
          const maxRange = Math.max(myRadius * 1000, 50)
          const { angle, distance } = getRealPosition(myLiveBucket, profile.geo_bucket, i, profile.id, maxRange)
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
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
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
          {liveProfiles.length === 0
            ? "No one nearby yet — check back soon"
            : `Scanning for resonant frequencies...`}
        </p>
        {liveProfiles.length > 0 && (
          <p className="text-[#00D1FF] font-medium text-sm animate-pulse mt-1">
            {liveProfiles.length} {liveProfiles.length === 1 ? "connection" : "connections"} nearby
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                      {selected.display_name || 'Anonymous Voyager'}
                    </h2>
                    <p className="text-xs text-[#978d9a] font-medium flex items-center gap-2 mt-0.5 capitalize">
                      {selected.age || '20'}y • {selected.gender || 'Explorer'}
                    </p>
                    <p className="text-[10px] text-[#00D1FF] font-medium mt-1 uppercase tracking-widest opacity-80">
                      Sync: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={close}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Compatibility Badge */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1.5 bg-[#A855F7]/20 px-3 py-1 rounded-full border border-[#A855F7]/30">
                    <Zap className="w-4 h-4 text-[#A855F7]" />
                    <span className="font-bold text-[#e3b5ff] text-xs">
                      {selected.compatibility}% Resonance
                    </span>
                  </div>
                  {(() => {
                    const liveSelected = liveProfiles.find(p => p.id === selected.id) || selected
                    const prox = getProximityLabel(myLiveBucket, liveSelected.geo_bucket)
                    return (
                      <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00D1FF] animate-pulse" />
                        <span className="text-[10px] text-[#00D1FF] font-bold uppercase tracking-wider">
                          {prox.meters 
                            ? `${prox.meters > 1000 ? (prox.meters / 1000).toFixed(1) + 'km' : Math.round(prox.meters) + 'm'} ${prox.cardinal}` 
                            : prox.label}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                {/* Trust Meter */}
                <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {selected.trust_score && selected.trust_score >= 80 ? (
                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                      ) : selected.trust_score && selected.trust_score >= 40 ? (
                        <Shield className="w-4 h-4 text-[#00D1FF]" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                      )}
                      <span className="text-xs font-semibold text-white">Trust Level</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${
                      (selected.trust_score ?? 0) >= 80 ? "text-[#10B981]" : 
                      (selected.trust_score ?? 0) >= 40 ? "text-[#00D1FF]" : "text-[#F59E0B]"
                    }`}>
                      {(selected.trust_score ?? 0) >= 80 ? "High Trust" : 
                       (selected.trust_score ?? 0) >= 40 ? "Verified" : "Caution"}
                    </span>
                  </div>
                  <TrustMeter level={selected.trust_score ?? 0} />
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

                <div className="mt-6 space-y-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Send an anonymous resonance signal..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-[#4c444f] focus:outline-none focus:border-[#A855F7] transition-colors"
                    rows={2}
                  />

                  <button 
                    disabled={sending || !message.trim()}
                    onClick={async () => {
                      if (selected && message.trim()) {
                        setSending(true)
                        const result = await initiateMatch(selected.id, message)
                        if (result?.error) {
                          alert(result.error)
                        } else if (result?.matchId) {
                          alert("Signal Resonated! Redirecting to secure channel...")
                          window.location.href = `/chat/${result.matchId}`
                        }
                        setSending(false)
                      }
                    }}
                    className="w-full h-12 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00D1FF] transition-colors disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send Resonance Signal"}
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
