"use client"

import { GlassCard } from "@/components/ui/GlassCard"
import { TrustMeter } from "@/components/ui/TrustMeter"
import { ShieldCheck, Music, Coffee, Book, User, Settings, Save, X, Sparkles, Heart } from "lucide-react"
import { useState } from "react"
import { updateProfile } from "@/app/actions/profile"
import { useRouter } from "next/navigation"

interface ProfileClientProps {
  profile: any
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    personality_vibes: profile?.personality_vibes || [],
    preferred_gender: profile?.preferred_gender || 'everyone',
    display_name: profile?.display_name || '',
    age: profile?.age || 20,
    gender: profile?.gender || 'not_set',
    resonance_radius: profile?.resonance_radius || 1.0,
    seeking_vibes: profile?.seeking_vibes || []
  })
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const vibes = isEditing ? editedProfile.personality_vibes : (profile?.personality_vibes || [])
  const status = profile?.verification_status || 'pending'
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'verified': return 'text-[#10B981] bg-[#10B981]/10'
      case 'pending_verification': return 'text-[#00D1FF] bg-[#00D1FF]/10'
      default: return 'text-[#A855F7] bg-[#A855F7]/10'
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const res = await updateProfile(editedProfile)
    setIsSaving(false)
    if (res.success) {
      setIsEditing(false)
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const toggleVibe = (vibe: string) => {
    setEditedProfile(prev => ({
      ...prev,
      personality_vibes: prev.personality_vibes.includes(vibe)
        ? prev.personality_vibes.filter((v: string) => v !== vibe)
        : [...prev.personality_vibes, vibe]
    }))
  }

  const toggleSeekingVibe = (vibe: string) => {
    setEditedProfile(prev => ({
      ...prev,
      seeking_vibes: prev.seeking_vibes.includes(vibe)
        ? prev.seeking_vibes.filter((v: string) => v !== vibe)
        : [...prev.seeking_vibes, vibe]
    }))
  }

  const availableVibes = ["Music Lover", "Late Night Owl", "Library Regular", "Coffee Addict", "Matcha Fan", "Night Voyager", "Early Riser", "Sports Fan", "AI Enthusiast"]

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
        <h1 className="font-display text-2xl font-semibold tracking-wide mb-1">
          {profile?.display_name || 'Campus Voyager'}
        </h1>
        <p className="text-xs text-[#978d9a] mb-3 capitalize">
          {profile?.age || '20'}y • {profile?.gender || 'Explorer'} • {profile?.resonance_radius || 1}km Radius
        </p>
        <div className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-6 ${getStatusColor(status)}`}>
          <ShieldCheck className="w-3 h-3" />
          {status === 'verified' ? 'Verified Student' : status === 'pending_verification' ? 'Verification Pending' : 'Unverified'}
        </div>

        {isEditing && (
          <div className="w-full mb-8 space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#978d9a] mb-2 text-left ml-1">My Nickname</label>
              <input 
                type="text"
                placeholder="e.g. SpaceVoyager"
                value={editedProfile.display_name}
                onChange={(e) => setEditedProfile({...editedProfile, display_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-sm focus:border-[#A855F7] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#978d9a] mb-2 text-left ml-1">My Age</label>
                <input 
                  type="number"
                  value={editedProfile.age}
                  onChange={(e) => setEditedProfile({...editedProfile, age: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-sm focus:border-[#A855F7] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#978d9a] mb-2 text-left ml-1">Identity</label>
                <select 
                  value={editedProfile.gender}
                  onChange={(e) => setEditedProfile({...editedProfile, gender: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-sm focus:border-[#A855F7] transition-all appearance-none"
                >
                  <option value="not_set">Select...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-Binary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#978d9a] mb-2 text-left ml-1">Resonance Reach</label>
              <div className="flex gap-2">
                {[0.5, 1.0, 2.0, 5.0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setEditedProfile({...editedProfile, resonance_radius: r})}
                    className={`flex-1 py-2 rounded-xl border text-[10px] transition-all ${
                      editedProfile.resonance_radius === r 
                        ? "bg-[#00D1FF] border-[#00D1FF] text-black font-bold shadow-lg shadow-[#00D1FF]/20" 
                        : "bg-white/5 border-white/10 text-[#978d9a]"
                    }`}
                  >
                    {r < 1 ? `${r*1000}m` : `${r}km`}
                  </button>
                ))}
              </div>
            </div>

             <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#978d9a] mb-2 text-left ml-1">Preferred Resonance</label>
              <div className="flex gap-2">
                {['female', 'male', 'everyone'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setEditedProfile({...editedProfile, preferred_gender: g})}
                    className={`flex-1 py-2.5 rounded-xl border text-xs capitalize transition-all ${
                      editedProfile.preferred_gender === g 
                        ? "bg-[#A855F7] border-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20" 
                        : "bg-white/5 border-white/10 text-[#978d9a]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-[10px] uppercase tracking-widest text-[#00D1FF] font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Edit
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(false)}
                className="text-[10px] uppercase tracking-widest text-[#ef4444] font-semibold flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {availableVibes.map((v) => (
                <button
                  key={v}
                  onClick={() => toggleVibe(v)}
                  className={`px-4 py-2 rounded-full text-xs transition-all border ${
                    editedProfile.personality_vibes.includes(v)
                      ? "bg-[#A855F7]/20 border-[#A855F7] text-white"
                      : "bg-white/5 border-white/5 text-[#4c444f]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vibes.length > 0 ? vibes.map((v: string) => (
                <span key={v} className="bg-[#2E004B]/40 border border-white/5 px-4 py-1.5 rounded-full text-xs text-[#cec3d0]">
                  {v}
                </span>
              )) : (
                <p className="text-xs text-[#4c444f]">No vibes set yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="w-full text-left mb-6">
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-display text-xl font-semibold text-[#e1e2eb]">Seeking Resonance</h2>
          </div>
          
          {isEditing ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {availableVibes.map((v) => (
                <button
                  key={v}
                  onClick={() => toggleSeekingVibe(v)}
                  className={`px-4 py-2 rounded-full text-xs transition-all border ${
                    editedProfile.seeking_vibes.includes(v)
                      ? "bg-[#00D1FF]/20 border-[#00D1FF] text-white"
                      : "bg-white/5 border-white/5 text-[#4c444f]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile?.seeking_vibes?.length > 0 ? profile.seeking_vibes.map((v: string) => (
                <span key={v} className="bg-[#003B46]/40 border border-[#00D1FF]/20 px-4 py-1.5 rounded-full text-xs text-[#b0f2ff]">
                  {v}
                </span>
              )) : (
                <p className="text-xs text-[#4c444f]">No preferences set yet.</p>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 bg-gradient-to-r from-[#A855F7] to-[#00D1FF] rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#A855F7]/20 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Frequency
              </>
            )}
          </button>
        )}
      </div>
    </main>
  )
}
