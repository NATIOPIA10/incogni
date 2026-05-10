"use client"

import { GlassCard } from "@/components/ui/GlassCard"
import { motion } from "framer-motion"
import { 
  Users, 
  MessageSquare, 
  Heart, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Activity
} from "lucide-react"

interface AdminOverviewClientProps {
  stats: {
    userCount: number
    matchCount: number
    messageCount: number
    reportCount: number
  }
  recentLogs: any[]
}

export default function AdminOverviewClient({ stats: realStats, recentLogs }: AdminOverviewClientProps) {
  const stats = [
    { label: "Active Users", value: realStats.userCount.toLocaleString(), change: "+0%", trend: "up", icon: Users, color: "#00D1FF" },
    { label: "Active Matches", value: realStats.matchCount.toLocaleString(), change: "+0%", trend: "up", icon: Heart, color: "#A855F7" },
    { label: "Total Messages", value: realStats.messageCount.toLocaleString(), change: "+0%", trend: "up", icon: MessageSquare, color: "#10B981" },
    { label: "Pending Reports", value: realStats.reportCount.toLocaleString(), change: realStats.reportCount > 0 ? `+${realStats.reportCount}` : "0", trend: "up", icon: ShieldAlert, color: "#F43F5E" },
  ]

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">Ethereal Insight</h1>
          <p className="text-[#978d9a] mt-1 text-sm sm:text-base">Platform overview and real-time activity.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors">
            Export
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2 bg-[#00D1FF] text-black rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(0,209,255,0.3)] hover:brightness-110 transition-all">
            System Pulse
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-6 border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className="w-12 h-12" style={{ color: stat.color }} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-white/5">
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs font-semibold tracking-wider text-[#978d9a] uppercase">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-white">{stat.value}</span>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.trend === 'up' ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#F43F5E] bg-[#F43F5E]/10'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Chart Mockup */}
        <GlassCard className="lg:col-span-2 p-8 border-white/5 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#00D1FF]/10 text-[#00D1FF]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">Engagement Trend</h2>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex-1 flex items-end gap-2 pb-2">
            {[40, 60, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <motion.div 
                  className="w-full bg-gradient-to-t from-[#00D1FF]/20 to-[#00D1FF]/60 rounded-t-lg group-hover:to-[#00D1FF] transition-all"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.5 + i * 0.05, type: "spring" }}
                />
                <span className="text-[10px] text-[#4c444f] uppercase tracking-tighter">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Real-time Feed */}
        <GlassCard className="p-8 border-white/5 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-[#A855F7]/10 text-[#A855F7]">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">Live Feed</h2>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start group">
                <div className="w-2 h-2 rounded-full bg-[#00D1FF] mt-1.5 shadow-[0_0_8px_#00D1FF] group-hover:scale-125 transition-transform" />
                <div>
                  <p className="text-sm text-white font-medium">{log.action_type}</p>
                  <p className="text-xs text-[#978d9a] mt-0.5">{log.reason || "Administrative action recorded."}</p>
                  <span className="text-[10px] text-[#4c444f] mt-1 block uppercase">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-xs text-[#4c444f] text-center py-10 italic">No recent system activity.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
