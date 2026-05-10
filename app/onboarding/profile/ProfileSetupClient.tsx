"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/Button"
import { User, Calendar, Users, Sparkles } from "lucide-react"
import { updateProfile } from "@/app/actions/profile"

export default function ProfileSetupClient({ profile }: { profile: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    age: profile?.age || 20,
    gender: profile?.gender || "not_set",
    preferred_gender: profile?.preferred_gender || "everyone"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.display_name || formData.gender === "not_set") {
      setError("Please fulfill all identity details.")
      return
    }

    setLoading(true)
    setError(null)

    const res = await updateProfile(formData)
    
    if (res.success) {
      router.push("/onboarding/verification")
    } else {
      setError(res.error || "Failed to save profile")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-[#0B0E14]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00D1FF] rounded-full blur-[120px] opacity-20 z-0" />
      
      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-[#A855F7]/20 rounded-full flex items-center justify-center mb-6 border border-[#A855F7]/30 shadow-lg shadow-[#A855F7]/10">
          <Sparkles className="w-8 h-8 text-[#A855F7]" />
        </div>
        
        <h1 className="font-display text-3xl font-semibold mb-2 text-white">Initialize Identity</h1>
        <p className="text-[#978d9a] text-sm text-center mb-8">Set your campus alias and resonance markers.</p>

        <GlassCard className="w-full p-6 border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#978d9a] font-bold pl-1">Campus Nickname</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="e.g. StarVoyager"
                  value={formData.display_name}
                  onChange={e => setFormData({...formData, display_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-10 pr-4 focus:border-[#A855F7] transition-all"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#978d9a] font-bold pl-1">Age</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    min={18}
                    max={100}
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-10 pr-4 focus:border-[#A855F7] transition-all"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#978d9a] font-bold pl-1">Gender</label>
                <select 
                  required
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-xs focus:border-[#A855F7] transition-all appearance-none text-[#cec3d0]"
                >
                  <option value="not_set">Select...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-Binary</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#978d9a] font-bold pl-1">Interested In</label>
              <div className="flex gap-2">
                {['female', 'male', 'everyone'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({...formData, preferred_gender: g})}
                    className={`flex-1 py-2.5 rounded-xl border text-[10px] uppercase font-bold transition-all ${
                      formData.preferred_gender === g 
                        ? "bg-[#A855F7] border-[#A855F7] text-white" 
                        : "bg-white/5 border-white/10 text-[#4c444f]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 bg-[#A855F7] hover:bg-[#9333EA] text-white">
              {loading ? "Initializing..." : "Next: Verify Student ID"}
            </Button>
          </form>
        </GlassCard>
      </div>
    </main>
  )
}
