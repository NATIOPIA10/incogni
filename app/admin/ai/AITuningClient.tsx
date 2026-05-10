"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { 
  Zap, 
  Brain, 
  Target, 
  Save, 
  RotateCcw,
  Sparkles,
  Info
} from "lucide-react"
import { updateAIWeights } from "@/app/actions/admin"

interface AITuningClientProps {
  initialWeights: any
}

export default function AITuningClient({ initialWeights }: AITuningClientProps) {
  const [loading, setLoading] = useState(false)
  const [weights, setWeights] = useState({
    personality: initialWeights.personality || 0.4,
    vibe: initialWeights.vibe || 0.3,
    interests: initialWeights.interests || 0.2,
    distance: initialWeights.distance || 0.1
  })

  const total = Object.values(weights).reduce((a, b) => a + (b as number), 0)

  const handleReset = () => {
    setWeights({
      personality: 0.4,
      vibe: 0.3,
      interests: 0.2,
      distance: 0.1
    })
  }

  const handleDeploy = async () => {
    setLoading(true)
    try {
      await updateAIWeights(weights)
      alert("AI Configuration deployed successfully to the resonance engine.")
    } catch (err) {
      alert("Deployment failed. Ensure you have Super Admin privileges.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">AI Resonance Core</h1>
          <p className="text-[#978d9a] mt-1">Tune the recommendation engine and compatibility logic.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button 
            onClick={handleDeploy}
            disabled={loading}
            className={`px-4 py-2 bg-[#A855F7] text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "Deploying..." : <><Save className="w-4 h-4" /> Deploy Weights</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8 border-white/5 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Brain className="w-5 h-5 text-[#A855F7]" />
              Matching Weights
            </h2>
            <div className={`text-xs font-bold px-3 py-1 rounded-full ${Math.abs(total - 1) < 0.01 ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#F43F5E] bg-[#F43F5E]/10'}`}>
              Total: {(total * 100).toFixed(0)}%
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(weights).map(([key, val]) => (
              <div key={key} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#cec3d0] capitalize">{key} Factor</span>
                  <span className="text-sm font-bold text-white">{(val as number * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={val as number}
                  onChange={(e) => setWeights({...weights, [key]: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#A855F7]"
                />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3">
            <Info className="w-5 h-5 text-[#00D1FF] shrink-0" />
            <p className="text-xs text-[#978d9a] leading-relaxed">
              Weights must total 100% for balanced recommendations. AI will prioritize factors with higher percentages during proximity scans.
            </p>
          </div>
        </GlassCard>

        <div className="space-y-8">
          <GlassCard className="p-8 border-white/5 bg-gradient-to-br from-[#A855F7]/5 to-transparent">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#00D1FF]" />
              Simulation Results
            </h2>
            <div className="space-y-6">
              <p className="text-sm text-[#978d9a]">Current configuration estimated impact:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest mb-1">Match Quality</p>
                  <p className="text-2xl font-bold text-[#10B981]">High</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest mb-1">User Satisfaction</p>
                  <p className="text-2xl font-bold text-white">84%</p>
                </div>
              </div>
              <div className="h-32 flex items-end gap-1">
                {[30, 45, 60, 40, 80, 50, 70, 90, 60].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#A855F7]/20 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 border-white/5">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Target className="w-5 h-5 text-[#10B981]" />
              Optimization Goals
            </h2>
            <div className="space-y-4">
              {["Increase meaningful connections", "Reduce 'Ghosting' rates", "Prioritize campus-specific vibes"].map((goal) => (
                <div key={goal} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-sm text-[#cec3d0]">{goal}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
