"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { 
  ShieldAlert, 
  Flag, 
  MessageSquare, 
  Scale, 
  ChevronRight,
  AlertTriangle
} from "lucide-react"

interface ModerationClientProps {
  initialReports: any[]
}

export default function ModerationClient({ initialReports }: ModerationClientProps) {
  const [reports, setReports] = useState(initialReports)

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Safety & Moderation</h1>
          <p className="text-[#978d9a] mt-1">Review flagged behavior and enforce community standards.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-xl text-[#F43F5E] text-xs font-bold uppercase tracking-widest">
            <AlertTriangle className="w-4 h-4" />
            {reports.filter(r => r.status === 'pending').length} Critical Issues
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {reports.length > 0 ? reports.map((report) => (
            <GlassCard key={report.id} className="p-6 border-white/5 hover:bg-white/[0.02] transition-all cursor-pointer group">
              <div className="flex gap-6">
                <div className="p-3 rounded-2xl bg-[#F43F5E]/10 text-[#F43F5E]">
                  <Flag className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        {report.reason_category}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#978d9a] uppercase tracking-widest">
                          {report.status}
                        </span>
                      </h3>
                      <p className="text-xs text-[#4c444f] mt-1">
                        Reported by: <span className="text-[#978d9a]">{report.reporter_id}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-[#4c444f] uppercase font-medium">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-[#cec3d0] leading-relaxed line-clamp-2">
                    {report.evidence_text || "No additional evidence provided."}
                  </p>
                  <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[10px] font-bold uppercase tracking-widest text-[#00D1FF] hover:underline">Investigate</button>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] hover:underline">Dismiss</button>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-[#F43F5E] hover:underline">Take Action</button>
                  </div>
                </div>
                <div className="flex items-center">
                  <ChevronRight className="w-5 h-5 text-[#4c444f] group-hover:text-white transition-colors" />
                </div>
              </div>
            </GlassCard>
          )) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <ShieldAlert className="w-16 h-16 mb-4 text-[#4c444f]" />
              <p className="text-sm">Safety queue is clear.</p>
              <p className="text-xs mt-2">All reports have been processed.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6 border-white/5">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <Scale className="w-5 h-5 text-[#A855F7]" />
              Moderator Insights
            </h2>
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest mb-1">Top Offense</p>
                <p className="text-white font-medium">Harassment Patterns</p>
                <p className="text-xs text-[#978d9a] mt-2">AI suggests increasing sensitivity for 'Toxic Interaction' threshold by 15%.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest mb-1">Response Time</p>
                <p className="text-white font-medium">14 mins (Average)</p>
                <p className="text-xs text-[#10B981] mt-2">↑ 5% faster than last week.</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-[#F43F5E]/20 bg-[#F43F5E]/5">
            <h2 className="text-lg font-semibold text-[#F43F5E] mb-4 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5" />
              Critical Alerts
            </h2>
            <p className="text-xs text-[#978d9a] leading-relaxed">
              Detection of mass-report activity on campus "Central Tech". AI flag: Potential targeted harassment.
            </p>
            <button className="w-full mt-4 py-2 bg-[#F43F5E] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              View Outbreak
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
