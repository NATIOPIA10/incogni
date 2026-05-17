"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import { X, Zap, ShieldCheck, ShieldAlert, Shield, Radio, RefreshCw, Flag, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { updateLocation } from "@/app/actions/location"
import { initiateMatch } from "@/app/actions/match"
import { submitUserReport } from "@/app/actions/report"
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
  skin_color?: string
  height?: number
  weight?: number
}

// Calculate real position based on geographic coordinates (Haversine for distance)
function getRealPosition(myBucket: string | undefined, theirBucket: string | undefined, index: number, id: string, maxRangeMeters: number = 2000) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)

  if (!myBucket || !theirBucket) {
    const angle = ((hash * 137.5 + index * 60) % 360) 
    const distance = 40 + (hash % 40)
    return { angle, distance }
  }
  
  const [lat1, lon1] = myBucket.split(",").map(Number)
  const [lat2, lon2] = theirBucket.split(",").map(Number)
  
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return { angle: (hash * 137.5) % 360, distance: 50 }
  }

  const R = 6371e3
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(Math.min(1, Math.max(0, a))), Math.sqrt(Math.max(0, 1 - a)))
  const meters = Math.max(0, R * c)

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  const angle = bearing - 90
  
  let distancePercentage = (meters / Math.max(1, maxRangeMeters)) * 100
  if (distancePercentage > 95) distancePercentage = 95
  if (distancePercentage < 15) distancePercentage = 15 + (hash % 10)
  
  return { angle, distance: distancePercentage }
}

function getVibeColor(compat: number) {
  if (compat >= 70) return "#A855F7" // purple – high match
  if (compat >= 40) return "#00D1FF" // cyan  – medium
  return "#10B981"                   // green – low
}

function getProximityLabel(myBucket?: string, theirBucket?: string) {
  if (!myBucket || !theirBucket) return { label: "Nearby", meters: null, cardinal: "" }
  if (myBucket === theirBucket) return { label: "Very Close", meters: 0, cardinal: "Nearby" }
  
  const [lat1, lon1] = myBucket.split(",").map(Number)
  const [lat2, lon2] = theirBucket.split(",").map(Number)
  
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return { label: "Nearby", meters: null, cardinal: "" }
  }

  const R = 6371e3
  const phi1 = lat1 * Math.PI / 180
  const phi2 = lat2 * Math.PI / 180
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const safeA = Math.min(1, Math.max(0, a))
  const c = 2 * Math.atan2(Math.sqrt(safeA), Math.sqrt(Math.max(0, 1 - safeA)))

  const meters = Math.max(0, Math.round(R * c))
  
  const y = Math.sin(dLon) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon)
  const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.round(brng / 45) % 8
  const cardinal = directions[index]
  
  let label = "Nearby"
  if (meters < 20) label = "Very Close"
  else if (meters < 200) label = "On Campus"
  
  return { label, meters, cardinal }
}

interface RadarClientProps {
  profiles: RadarProfile[]
  myBucket?: string
  myRadius: number
  myProfile: any
}

export default function RadarClient({ profiles, myBucket, myRadius, myProfile }: RadarClientProps) {
  const [selected, setSelected] = useState<RadarProfile | null>(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [liveProfiles, setLiveProfiles] = useState(profiles)
  const [myLiveBucket, setMyLiveBucket] = useState(myBucket)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [availableVibes, setAvailableVibes] = useState<string[]>([])
  const notifiedUsers = useRef<Set<string>>(new Set())
  const supabase = createClient()
  
  // Report State
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("harassment")
  const [reportEvidence, setReportEvidence] = useState("")
  const [isReporting, setIsReporting] = useState(false)

  useEffect(() => {
    const fetchVibes = async () => {
      const { data } = await supabase
        .from('vibe_definitions')
        .select('label')
      if (data) setAvailableVibes(data.map(v => v.label))
    }
    fetchVibes()
  }, [])

  const router = useRouter()
  const watchId = useRef<number | null>(null)
  const lastUpdate = useRef<number>(0)
  const audioCtx = useRef<AudioContext | null>(null)

  const playPingSound = () => {
    try {
      if (typeof window === "undefined") return;
      const AudioClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioClass) return;
      if (!audioCtx.current) {
        audioCtx.current = new AudioClass();
      }
      const ctx = audioCtx.current;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn("Radar audio ping error:", e);
    }
  }

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "Notification" in window && window.Notification && window.Notification.permission === "default") {
        const promise = window.Notification.requestPermission();
        if (promise && promise.catch) {
          promise.catch(err => console.warn("Notification permission error:", err));
        }
      }
    } catch (e) {
      console.warn("Mobile notification permission error:", e);
    }
  }, [])

  useEffect(() => {
    setLiveProfiles(profiles)
  }, [profiles])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('radar-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setLiveProfiles(prev => prev.map(p => 
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            ))
          } else if (payload.eventType === 'INSERT') {
            const newUser = payload.new as RadarProfile
            setLiveProfiles(prev => {
              if (prev.find(p => p.id === newUser.id)) return prev
              return [...prev, newUser]
            })
          } else if (payload.eventType === 'DELETE') {
            setLiveProfiles(prev => prev.filter(p => p.id === payload.old.id))
          }
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

  const close = () => {
    setSelected(null)
    setIsReportOpen(false)
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected?.id) return alert("Target profile ID missing.")

    try {
      setIsReporting(true)
      const res = await submitUserReport({
        targetUserId: selected.id,
        reasonCategory: reportReason,
        evidenceText: reportEvidence
      })
      if (res.error) {
        alert("Failed to submit report: " + res.error)
      } else {
        alert("Report successfully filed. Our moderation team will investigate shortly.")
        setIsReportOpen(false)
        setReportEvidence("")
      }
    } catch (err: any) {
      alert("Failed to submit report: " + err.message)
    } finally {
      setIsReporting(false)
    }
  }

  const [tempMaxRange, setTempMaxRange] = useState<number | null>(null)
  const maxRange = tempMaxRange || Math.max(myRadius * 1000, 10)
  
  const usersInRange = liveProfiles.filter(p => {
    const effectiveMyBucket = myLiveBucket || myBucket
    const { meters } = getProximityLabel(effectiveMyBucket, p.geo_bucket)
    return meters !== null && meters <= maxRange
  })

  const nearbyProfiles = usersInRange.filter(p => {
    const myPref = myProfile?.preferred_gender
    if (myPref && myPref !== "everyone" && p.gender !== myPref) return false
    return true
  })

  useEffect(() => {
    try {
      let triggered = false;
      nearbyProfiles.forEach(p => {
        if (p.compatibility > 50 && !notifiedUsers.current.has(p.id)) {
          notifiedUsers.current.add(p.id);
          triggered = true;
          
          if (typeof window !== "undefined" && "Notification" in window && window.Notification && window.Notification.permission === "granted") {
            try {
              const options: any = {
                body: `A ${p.compatibility}% resonance match is nearby!`,
                icon: "/icon.png",
                vibrate: [200, 100, 200]
              };
              new window.Notification("Incogni Resonance Alert!", options);
            } catch (err) {}
          }
        }
      });
      
      if (triggered) {
        playPingSound();
      }
    } catch (e) {
      console.warn("Nearby profile alert error:", e);
    }
  }, [nearbyProfiles]);

  const hasLocation = !!(myLiveBucket || myBucket)

  return (
    <div className="flex flex-col items-center w-full h-full relative">
      <div className="relative flex items-center justify-center w-72 h-72 mt-6">
        <div className="absolute top-2 left-2 z-30">
          <button
            onClick={() => {
              setIsRefreshing(true)
              router.refresh()
              setTimeout(() => setIsRefreshing(false), 1000)
            }}
            className={`p-3 rounded-full border transition-all duration-300 backdrop-blur-xl ${
              isRefreshing 
                ? 'bg-[#00D1FF]/20 border-[#00D1FF]/50 text-[#00D1FF] shadow-[0_0_20px_rgba(0,209,255,0.3)]' 
                : 'bg-white/5 border-white/10 text-[#cec3d0] hover:bg-white/10 hover:border-white/20'
            }`}
            aria-label="Refresh Radar"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

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

        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-[#00D1FF]/20"
            style={{ width: `${ring * 33}%`, height: `${ring * 33}%` }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: ring * 0.5 }}
          />
        ))}

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

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#00D1FF] shadow-[0_0_20px_#00D1FF] z-20" />

        {(() => {
          const positions = nearbyProfiles.map((profile, i) => {
            const { angle, distance } = getRealPosition(myLiveBucket, profile.geo_bucket, i, profile.id, maxRange)
            const radians = (angle * Math.PI) / 180
            const radius = (distance / 100) * 130
            const x = Math.cos(radians) * radius
            const y = Math.sin(radians) * radius
            return { profile, x, y, i }
          })

          const minDistance = 45;
          for (let iter = 0; iter < 10; iter++) {
            let moved = false;
            for (let i = 0; i < positions.length; i++) {
              for (let j = i + 1; j < positions.length; j++) {
                const p1 = positions[i];
                const p2 = positions[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < minDistance) {
                  moved = true;
                  const pushDist = (minDistance - dist) / 2;
                  const pushAngle = dist === 0 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx);
                  
                  p1.x += Math.cos(pushAngle) * pushDist;
                  p1.y += Math.sin(pushAngle) * pushDist;
                  p2.x -= Math.cos(pushAngle) * pushDist;
                  p2.y -= Math.sin(pushAngle) * pushDist;

                  const r1 = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
                  if (r1 > 130) {
                    p1.x = (p1.x / r1) * 130;
                    p1.y = (p1.y / r1) * 130;
                  }
                  const r2 = Math.sqrt(p2.x * p2.x + p2.y * p2.y);
                  if (r2 > 130) {
                    p2.x = (p2.x / r2) * 130;
                    p2.y = (p2.y / r2) * 130;
                  }
                }
              }
            }
            if (!moved) break;
          }

          return positions.map(({ profile, x, y, i }) => {
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
                <div
                  className="absolute w-10 h-10 rounded-full blur-md opacity-60"
                  style={{ background: color }}
                />
                <GlassCard className="w-10 h-10 rounded-full relative border flex items-center justify-center overflow-hidden"
                  style={{ borderColor: `${color}60` }}>
                  <span className="text-[10px] font-bold" style={{ color }}>
                    {profile.compatibility}%
                  </span>
                </GlassCard>
              </motion.button>
            )
          })
        })()}
      </div>

      <div className="mt-6 text-center" key={`status-${nearbyProfiles.length}-${myLiveBucket}`}>
        <p className="text-[#cec3d0] text-sm">
          {!hasLocation 
            ? "Establishing GPS lock..." 
            : nearbyProfiles.length === 0
              ? `No one within ${maxRange}m`
              : `Scanning ${maxRange}m resonant field...`}
        </p>
        {hasLocation && nearbyProfiles.length > 0 && (
          <p className="text-[#00D1FF] font-medium text-sm animate-pulse mt-1">
            {nearbyProfiles.length} {nearbyProfiles.length === 1 ? "connection" : "connections"} nearby
          </p>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            <motion.div
              className="fixed bottom-24 left-4 right-4 z-40 rounded-2xl max-h-[85vh] overflow-y-auto"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              <GlassCard className="p-6 border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col">
                    <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                      {selected.display_name || 'Anonymous Voyager'}
                    </h2>
                    <p className="text-xs text-[#978d9a] font-medium flex items-center gap-2 mt-0.5 capitalize">
                      {selected.age || '20'}y • {selected.gender || 'Explorer'}
                    </p>
                    {(selected.skin_color || selected.height || selected.weight) && (
                      <p className="text-[10px] text-[#978d9a]/80 font-medium mt-0.5 capitalize">
                        {selected.skin_color && `${selected.skin_color} Tone`}
                        {selected.height && ` • ${selected.height}cm`}
                        {selected.weight && ` • ${selected.weight}kg`}
                      </p>
                    )}
                    <p className="text-[10px] text-[#00D1FF] font-medium mt-1 uppercase tracking-widest opacity-80">
                      Sync: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsReportOpen(true)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#F43F5E]/20 text-[#978d9a] hover:text-[#F43F5E] hover:border-[#F43F5E]/40 transition-colors border border-white/10"
                      title="Report Profile"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                    <button
                      onClick={close}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

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
                    if (!prox.meters && prox.meters !== 0) return null
                    
                    return (
                      <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00D1FF] animate-pulse" />
                        <span className="text-[10px] text-[#00D1FF] font-bold uppercase tracking-wider">
                          {prox.meters >= 1000 
                            ? `${(prox.meters / 1000).toFixed(1)}KM` 
                            : `${Math.round(prox.meters)}M`} {prox.cardinal}
                        </span>
                      </div>
                    )
                  })()}
                </div>

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

                {(() => {
                  const shared = (selected.personality_vibes ?? [])
                    .filter(v => (myProfile?.personality_vibes || []).includes(v))
                    .filter(v => availableVibes.includes(v))
                  
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

                {(() => {
                  const filteredTheirVibes = (selected.personality_vibes ?? [])
                    .filter(v => availableVibes.includes(v))

                  return filteredTheirVibes.length > 0 ? (
                    <div>
                      <p className="text-xs text-[#cec3d0] mb-2 uppercase tracking-wider">Their Vibe</p>
                      <div className="flex flex-wrap gap-2">
                        {filteredTheirVibes.map(v => (
                          <span key={v} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-[#cec3d0]">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null
                })()}

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

      {/* Safety Report Modal */}
      {isReportOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <GlassCard className="w-full max-w-lg border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setIsReportOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#978d9a] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-center justify-center text-[#F43F5E]">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white tracking-wide">Report Citizen</h2>
                <p className="text-xs text-[#978d9a] mt-0.5">Submit an official incident report for moderation review</p>
              </div>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-[#cec3d0] mb-2">Reason Category</label>
                <select 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#F43F5E]/50 focus:outline-none transition-all"
                >
                  <option value="harassment" className="bg-[#12151c]">Harassment or Threatening Behavior</option>
                  <option value="inappropriate_content" className="bg-[#12151c]">Inappropriate Content or Nudity</option>
                  <option value="spam_scam" className="bg-[#12151c]">Spam, Scam, or Solicitation</option>
                  <option value="fake_profile" className="bg-[#12151c]">Fake Profile or Impersonation</option>
                  <option value="other" className="bg-[#12151c]">Other Safety Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-[#cec3d0] mb-2">Evidence & Details</label>
                <textarea 
                  value={reportEvidence}
                  onChange={(e) => setReportEvidence(e.target.value)}
                  rows={4}
                  placeholder="Provide context or specific details to help our moderation team investigate..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#F43F5E]/50 focus:outline-none transition-all placeholder:text-[#4c444f]"
                  required
                />
              </div>

              <div className="p-4 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
                <p className="text-xs text-[#978d9a] leading-relaxed">
                  Verified reports isolate the reported profile and notify our moderation staff immediately. All investigations remain completely confidential.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isReporting}
                  className="px-6 py-2.5 rounded-xl bg-[#F43F5E] hover:brightness-110 text-white font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isReporting ? "Filing..." : "Submit Official Report"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

