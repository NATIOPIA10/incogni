"use client"

import { GlassCard } from "@/components/ui/GlassCard"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  PieChart, 
  Users, 
  Waves, 
  Calendar,
  Download,
  Filter
} from "lucide-react"

interface AnalyticsClientProps {
  data: {
    vibeData: { label: string, value: number }[]
    matchSuccessRate: number
    totalUsers: number
    growthRate: number
    reportDensity: string
    weeklyFlow: number[]
  }
}

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  const colors = ["#A855F7", "#00D1FF", "#10B981", "#F43F5E", "#F59E0B"]

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Network Intelligence</h1>
          <p className="text-[#978d9a] mt-1">Deep behavioral insights and retention analytics.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter Range
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Retention Curve */}
        <GlassCard className="lg:col-span-2 p-8 border-white/5 min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Waves className="w-5 h-5 text-[#00D1FF]" />
              User Retention Flow
            </h2>
            <div className="text-xs text-[#978d9a]">30 Day Average: <span className="text-[#10B981] font-bold">68%</span></div>
          </div>
          
          <div className="h-64 relative flex items-end">
            <svg className="w-full h-full absolute inset-0 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {(() => {
                const max = Math.max(...data.weeklyFlow, 1)
                const points = data.weeklyFlow.map((v, i) => `${(i * 20)} ${80 - (v / max) * 60}`).join(' L ')
                const areaPoints = `0 100 L ${points} L 100 100 Z`
                const linePoints = `0 80 L ${points}`
                
                return (
                  <>
                    <motion.path
                      d={`M ${areaPoints}`}
                      fill="url(#retentionGradient)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      transition={{ duration: 1 }}
                    />
                    <motion.path
                      d={`M ${linePoints}`}
                      stroke="#00D1FF"
                      strokeWidth="1"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </>
                )
              })()}
              <defs>
                <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D1FF" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
            <div className="w-full flex justify-between px-2 pt-4 border-t border-white/5 mt-auto">
              {['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map(w => (
                <span key={w} className="text-[10px] text-[#4c444f] uppercase font-bold">{w}</span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Vibe Popularity */}
        <GlassCard className="p-8 border-white/5">
          <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
            <PieChart className="w-5 h-5 text-[#A855F7]" />
            Vibe Resonance
          </h2>
          <div className="space-y-6">
            {data.vibeData.map((vibe, i) => (
              <div key={vibe.label} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#cec3d0] font-medium capitalize">{vibe.label}</span>
                  <span className="text-white font-bold">{vibe.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full" 
                    style={{ backgroundColor: colors[i % colors.length] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${vibe.value}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-[#10B981]/5 to-transparent">
          <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest mb-1">Match Success</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-bold text-white">{data.matchSuccessRate}%</h3>
            <span className="text-xs text-[#10B981] font-medium pb-1">Live</span>
          </div>
        </GlassCard>
        <GlassCard className="p-6 border-white/5">
          <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest mb-1">Total Users</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-bold text-white">{data.totalUsers}</h3>
            <span className="text-xs text-[#A855F7] font-medium pb-1">All Time</span>
          </div>
        </GlassCard>
        <GlassCard className="p-6 border-white/5">
          <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest mb-1">Campus Growth</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-bold text-white">+{data.growthRate}%</h3>
            <span className="text-xs text-[#00D1FF] font-medium pb-1">7 Days</span>
          </div>
        </GlassCard>
        <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-[#F43F5E]/5 to-transparent">
          <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest mb-1">Report Density</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-bold text-white">{data.reportDensity}%</h3>
            <span className="text-xs text-[#F43F5E] font-medium pb-1">Live</span>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
