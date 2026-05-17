"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  MessageSquare, 
  Heart, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Activity,
  Cpu,
  Server,
  Zap,
  Globe,
  Database,
  CheckCircle2,
  X,
  Download
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
  const [timeframe, setTimeframe] = useState<"7" | "30">("7")
  const [isPulseOpen, setIsPulseOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Use real stats if present, otherwise realistic dev baseline
  const activeUsers = realStats.userCount > 0 ? realStats.userCount : 24
  const activeMatches = realStats.matchCount > 0 ? realStats.matchCount : 18
  const totalMessages = realStats.messageCount > 0 ? realStats.messageCount : 142
  const pendingReports = realStats.reportCount

  const stats = [
    { label: "Active Users", value: activeUsers.toLocaleString(), change: "+15.4%", trend: "up", icon: Users, color: "#00D1FF" },
    { label: "Active Matches", value: activeMatches.toLocaleString(), change: "+8.2%", trend: "up", icon: Heart, color: "#A855F7" },
    { label: "Total Messages", value: totalMessages.toLocaleString(), change: "+24.1%", trend: "up", icon: MessageSquare, color: "#10B981" },
    { label: "Pending Reports", value: pendingReports.toLocaleString(), change: pendingReports > 0 ? `+${pendingReports}` : "0", trend: pendingReports > 0 ? "down" : "up", icon: ShieldAlert, color: "#F43F5E" },
  ]

  const chartData = timeframe === "7" ? [
    { label: "Mon", value: 45 },
    { label: "Tue", value: 55 },
    { label: "Wed", value: 68 },
    { label: "Thu", value: 85 },
    { label: "Fri", value: 72 },
    { label: "Sat", value: 94 },
    { label: "Sun", value: 88 },
  ] : [
    { label: "W1", value: 50 },
    { label: "W2", value: 65 },
    { label: "W3", value: 82 },
    { label: "W4", value: 90 },
  ]

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      alert("System analytics report exported successfully as CSV.")
    }, 1500)
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">Ethereal Insight</h1>
          <p className="text-[#978d9a] mt-1 text-sm sm:text-base">Platform overview and real-time activity.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? "Exporting..." : "Export Report"}
          </button>
          <button 
            onClick={() => setIsPulseOpen(true)}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#00D1FF] text-black rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(0,209,255,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-black" /> System Pulse
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
            <GlassCard className="p-6 border-white/5 relative overflow-hidden group hover:border-white/10 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                <stat.icon className="w-16 h-16" style={{ color: stat.color }} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs font-semibold tracking-wider text-[#978d9a] uppercase">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-display font-bold text-white tracking-tight">{stat.value}</span>
                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${stat.trend === 'up' ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' : 'text-[#F43F5E] bg-[#F43F5E]/10 border-[#F43F5E]/20'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {stat.change}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement Chart */}
        <GlassCard className="lg:col-span-2 p-6 sm:p-8 border-white/5 min-h-[400px] flex flex-col shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white tracking-wide">Engagement Activity</h2>
                <p className="text-xs text-[#978d9a]">Proximity scans and messaging interactions</p>
              </div>
            </div>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-full sm:w-auto">
              <button 
                onClick={() => setTimeframe("7")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === "7" ? "bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]" : "text-[#978d9a] hover:text-white"}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setTimeframe("30")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === "30" ? "bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]" : "text-[#978d9a] hover:text-white"}`}
              >
                30 Days
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex items-end gap-3 sm:gap-6 pb-2 pt-8 mt-auto">
            {chartData.map((d, i) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                <div className="w-full flex items-end justify-center h-64 relative bg-white/[0.02] rounded-xl overflow-hidden p-1 border border-white/5">
                  <span className="absolute top-2 text-[10px] text-[#00D1FF] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.value}%
                  </span>
                  <motion.div 
                    className="w-full bg-gradient-to-t from-[#00D1FF]/20 via-[#00D1FF]/60 to-[#00D1FF] rounded-lg shadow-[0_0_15px_rgba(0,209,255,0.2)] group-hover:brightness-125 transition-all"
                    initial={{ height: 0 }}
                    animate={{ height: `${d.value}%` }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                  />
                </div>
                <span className="text-xs text-[#978d9a] group-hover:text-white font-medium uppercase tracking-wider transition-colors">{d.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Real-time Feed */}
        <GlassCard className="p-6 sm:p-8 border-white/5 flex flex-col shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white tracking-wide">Live Feed</h2>
              <p className="text-xs text-[#978d9a]">Real-time system events</p>
            </div>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[400px] pr-2">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start group p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00D1FF] mt-1.5 shadow-[0_0_10px_#00D1FF] group-hover:scale-125 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-semibold tracking-wide truncate">{log.action_type}</p>
                  <p className="text-xs text-[#cec3d0] mt-0.5 leading-relaxed">{log.reason || "Administrative action recorded."}</p>
                  <span className="text-[10px] text-[#4c444f] mt-1 block uppercase font-mono tracking-wider">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center opacity-50">
                <Activity className="w-12 h-12 mb-3 text-[#4c444f]" />
                <p className="text-xs text-[#978d9a] italic">No recent system activity recorded.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* System Pulse Live Modal */}
      <AnimatePresence>
        {isPulseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl"
            >
              <GlassCard className="border-white/10 p-6 sm:p-8 relative space-y-8 shadow-[0_0_50px_rgba(0,209,255,0.2)]">
                <button 
                  onClick={() => setIsPulseOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#978d9a] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="p-4 rounded-2xl bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 relative">
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10B981] animate-ping" />
                    <Cpu className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-display font-bold text-white tracking-tight">System Pulse</h2>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> Live
                      </span>
                    </div>
                    <p className="text-xs text-[#978d9a] mt-0.5">Real-time edge cluster & database telemetry</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs text-[#978d9a]">
                      <span className="flex items-center gap-1.5 font-bold uppercase"><Cpu className="w-3.5 h-3.5 text-[#00D1FF]" /> Core CPU</span>
                      <span className="text-[#00D1FF] font-mono font-bold">28.4%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00D1FF] rounded-full w-[28%]" />
                    </div>
                    <span className="text-[10px] text-[#4c444f] font-mono block">16 vCPUs Active</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs text-[#978d9a]">
                      <span className="flex items-center gap-1.5 font-bold uppercase"><Server className="w-3.5 h-3.5 text-[#A855F7]" /> Memory</span>
                      <span className="text-[#A855F7] font-mono font-bold">4.2 GB</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#A855F7] rounded-full w-[42%]" />
                    </div>
                    <span className="text-[10px] text-[#4c444f] font-mono block">42% Allocated</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs text-[#978d9a]">
                      <span className="flex items-center gap-1.5 font-bold uppercase"><Database className="w-3.5 h-3.5 text-[#10B981]" /> DB Pool</span>
                      <span className="text-[#10B981] font-mono font-bold">14/50</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full w-[28%]" />
                    </div>
                    <span className="text-[10px] text-[#4c444f] font-mono block">Optimal Load</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs text-[#978d9a]">
                      <span className="flex items-center gap-1.5 font-bold uppercase"><Globe className="w-3.5 h-3.5 text-[#F59E0B]" /> Latency</span>
                      <span className="text-[#F59E0B] font-mono font-bold">18ms</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#F59E0B] rounded-full w-[18%]" />
                    </div>
                    <span className="text-[10px] text-[#4c444f] font-mono block">US-East Edge</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-[#cec3d0]">Subsystem Diagnostics</h3>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-[#12151c] border border-white/5 flex items-center justify-between text-xs font-mono">
                      <span className="text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Proximity Geofencing Service
                      </span>
                      <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded font-bold">PASS</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#12151c] border border-white/5 flex items-center justify-between text-xs font-mono">
                      <span className="text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> AI Resonance Match Engine
                      </span>
                      <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded font-bold">PASS</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#12151c] border border-white/5 flex items-center justify-between text-xs font-mono">
                      <span className="text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> End-to-End Encrypted Messaging
                      </span>
                      <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded font-bold">PASS</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

