"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/Button"
import { HeartPulse, Check } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function PersonalitySync() {
  const router = useRouter()
  const supabase = createClient()
  const [vibes, setVibes] = useState<string[]>([])
  const [step, setStep] = useState<"own" | "seeking">("own")
  const [ownVibes, setOwnVibes] = useState<string[]>([])
  const [seekingVibes, setSeekingVibes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAlreadyDone = async () => {
      // Fetch Vibe Definitions from DB
      const { data: vibeData } = await supabase
        .from('vibe_definitions')
        .select('label')
        .order('label', { ascending: true })
      
      if (vibeData) {
        setVibes(vibeData.map(v => v.label))
      }

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.replace("/"); return }

      const { data: profile } = await supabase
        .from("profiles")
        .select("personality_vibes, seeking_vibes, verification_status")
        .eq("id", userData.user.id)
        .single()


      // If personality already completed, go straight to radar
      if (
        (profile?.personality_vibes?.length ?? 0) > 0 ||
        (profile?.seeking_vibes?.length ?? 0) > 0
      ) {
        router.replace("/radar")
        return
      }

      // If they haven't even submitted ID, send them back
      if (!profile || profile.verification_status === "pending") {
        router.replace("/onboarding/verification")
        return
      }

      setChecking(false)
    }

    checkAlreadyDone()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleVibe = (vibe: string, type: "own" | "seeking") => {
    if (type === "own") {
      setOwnVibes(prev => prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe])
    } else {
      setSeekingVibes(prev => prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe])
    }
  }

  const handleComplete = async () => {
    if (step === "own") {
      setStep("seeking")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated. Please sign in again.")

      console.log("Updating vibes for user:", userData.user.id)

      const { error } = await supabase
        .from('profiles')
        .update({
          personality_vibes: ownVibes,
          seeking_vibes: seekingVibes
        })
        .eq('id', userData.user.id)

      if (error) {
        console.error("Supabase Update Error:", error)
        throw new Error(`Sync failed: ${error.message}`)
      }

      console.log("Vibes updated successfully")
      
      router.refresh()
      router.push('/radar')
    } catch (err: any) {
      console.error("Personality Sync Error:", err)
      setError(err.message || "Failed to sync vibes. Please check your internet connection.")
      setLoading(false)
    }
  }

  const currentSelection = step === "own" ? ownVibes : seekingVibes

  // Show nothing while checking — avoids flash of content before redirect
  if (checking) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#A855F7] border-t-transparent animate-spin" />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 relative overflow-y-auto pb-24">
      <div className="z-10 w-full max-w-sm flex flex-col items-center text-center mt-12">
        <HeartPulse className="w-10 h-10 text-[#A855F7] mb-6 animate-pulse" />
        
        <h1 className="font-display text-2xl font-semibold mb-2 text-[#e3b5ff]">
          {step === "own" ? "What's your vibe?" : "What are you looking for?"}
        </h1>
        <p className="text-[#cec3d0] text-sm mb-8 px-2">
          {step === "own" 
            ? "Select the traits and interests that best describe you." 
            : "Select the frequencies you want to resonate with on the radar."}
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {vibes.map((vibe) => {

            const isSelected = currentSelection.includes(vibe)
            return (
              <button
                key={vibe}
                onClick={() => toggleVibe(vibe, step)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  isSelected 
                    ? 'bg-[#2E004B] border-[#A855F7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                    : 'bg-white/5 border-white/10 text-[#cec3d0] hover:bg-white/10'
                }`}
              >
                {isSelected && <Check className="inline-block w-3 h-3 mr-1" />}
                {vibe}
              </button>
            )
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14] to-transparent">
          <div className="max-w-sm mx-auto">
            <Button 
              onClick={handleComplete} 
              disabled={currentSelection.length === 0 || loading}
              className="w-full h-14 text-lg shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-[#A855F7] hover:bg-[#A855F7]/80 text-white"
            >
              {loading ? "Syncing..." : (step === "own" ? "Next Step" : "Enter The Radar")}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
