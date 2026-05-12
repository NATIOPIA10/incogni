"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { Sparkles, Plus, Trash2, Loader2, Save, Info } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function VibeManager() {
  const [vibes, setVibes] = useState<any[]>([])
  const [newVibe, setNewVibe] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchVibes()
  }, [])

  const fetchVibes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vibe_definitions')
      .select('*')
      .order('label', { ascending: true })
    
    if (data) setVibes(data)
    setLoading(false)
  }

  const handleAddVibe = async () => {
    if (!newVibe.trim()) return
    setActionLoading(true)
    
    const { error } = await supabase
      .from('vibe_definitions')
      .insert([{ label: newVibe.trim() }])

    if (error) {
      alert(error.message)
    } else {
      setNewVibe("")
      fetchVibes()
    }
    setActionLoading(false)
  }

  const handleDeleteVibe = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vibe from the system? Users will no longer be able to select it.")) return
    
    setActionLoading(true)
    const { error } = await supabase
      .from('vibe_definitions')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
    } else {
      fetchVibes()
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#A855F7]" />
          Vibe Frequency Master List
        </h2>
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#978d9a] bg-white/5 px-3 py-1 rounded-full border border-white/10">
          {vibes.length} ACTIVE VIBES
        </span>
      </div>

      <GlassCard className="p-6 border-white/5 bg-[#0B0E14]/40">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input 
              type="text"
              placeholder="Enter new vibe label (e.g. Vintage Film)..."
              value={newVibe}
              onChange={(e) => setNewVibe(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-[#A855F7] transition-all outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddVibe()}
            />
          </div>
          <button 
            onClick={handleAddVibe}
            disabled={actionLoading || !newVibe.trim()}
            className="h-12 px-6 bg-[#A855F7] text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Vibe
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#A855F7] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {vibes.map((vibe) => (
              <div 
                key={vibe.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#A855F7]/30 transition-all"
              >
                <span className="text-sm text-[#cec3d0] font-medium">{vibe.label}</span>
                <button 
                  onClick={() => handleDeleteVibe(vibe.id)}
                  disabled={actionLoading}
                  className="p-2 text-[#F43F5E] opacity-0 group-hover:opacity-100 hover:bg-[#F43F5E]/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {vibes.length === 0 && !loading && (
          <div className="text-center py-10">
            <Info className="w-8 h-8 text-[#4c444f] mx-auto mb-3" />
            <p className="text-sm text-[#4c444f]">No vibes defined yet. Add your first one above.</p>
          </div>
        )}
      </GlassCard>

      <div className="p-4 rounded-xl bg-[#00D1FF]/5 border border-[#00D1FF]/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#00D1FF] mt-0.5" />
        <div className="text-xs text-[#978d9a] leading-relaxed">
          <p className="font-bold text-[#00D1FF] mb-1 uppercase tracking-widest">Admin Tip</p>
          Deleting a vibe here will remove it from all future selection menus (onboarding and profile edit). 
          It will <span className="text-white">not</span> remove it from existing users who already have it selected, 
          ensuring their profile data remains intact while preventing new users from picking it.
        </div>
      </div>
    </div>
  )
}
