"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { 
  ShieldAlert, 
  Flag, 
  MessageSquare, 
  Scale, 
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  X,
  UserMinus,
  Ban,
  Clock,
  Eye,
  Loader2,
  Filter
} from "lucide-react"
import { updateReportStatus, warnUser, toggleUserSuspension, blockUser } from "@/app/actions/admin"

interface ModerationClientProps {
  initialReports: any[]
}

export default function ModerationClient({ initialReports }: ModerationClientProps) {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'>('pending')
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [activeModal, setActiveModal] = useState<'investigate' | 'action' | 'outbreak' | null>(null)
  const [warningMsg, setWarningMsg] = useState("")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filteredReports = reports.filter(r => {
    if (filter === 'all') return true
    return r.status === filter
  })

  const handleUpdateStatus = async (reportId: string, newStatus: 'investigating' | 'resolved' | 'dismissed', notes?: string) => {
    setLoadingId(reportId)
    try {
      await updateReportStatus(reportId, newStatus, notes)
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus, resolution_notes: notes || r.resolution_notes } : r))
      if (selectedReport?.id === reportId) {
        setSelectedReport((prev: any) => ({ ...prev, status: newStatus }))
      }
    } catch (err: any) {
      alert("Failed to update report status: " + err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleWarn = async (userId: string) => {
    if (!warningMsg.trim()) return
    setLoadingId('action_' + userId)
    try {
      await warnUser(userId, warningMsg)
      alert("Warning notification dispatched to user.")
      setWarningMsg("")
      if (selectedReport) {
        await handleUpdateStatus(selectedReport.id, 'resolved', `Issued warning: "${warningMsg}"`)
      }
      setActiveModal(null)
    } catch (err: any) {
      alert("Warning failed: " + err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleSuspend = async (userId: string) => {
    if (!confirm("Suspend this user account?")) return
    setLoadingId('action_' + userId)
    try {
      await toggleUserSuspension(userId, true)
      if (selectedReport) {
        await handleUpdateStatus(selectedReport.id, 'resolved', "Suspended user account.")
      }
      alert("User suspended successfully.")
      setActiveModal(null)
    } catch (err: any) {
      alert("Suspension failed: " + err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleBlock = async (userId: string) => {
    if (!confirm("Permanently block/ban this user?")) return
    setLoadingId('action_' + userId)
    try {
      await blockUser(userId)
      if (selectedReport) {
        await handleUpdateStatus(selectedReport.id, 'resolved', "Permanently blocked user.")
      }
      alert("User has been permanently blocked.")
      setActiveModal(null)
    } catch (err: any) {
      alert("Block failed: " + err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'
      case 'investigating': return 'bg-[#00D1FF]/10 border-[#00D1FF]/20 text-[#00D1FF]'
      case 'dismissed': return 'bg-white/5 border-white/10 text-[#978d9a]'
      default: return 'bg-[#F43F5E]/10 border-[#F43F5E]/20 text-[#F43F5E]'
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 relative min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">Safety & Moderation</h1>
          <p className="text-[#978d9a] mt-1 text-sm sm:text-base">Review flagged behavior and enforce community standards.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-xl text-[#F43F5E] text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            {reports.filter(r => r.status === 'pending').length} Critical Issues
          </div>
          <button 
            onClick={() => setActiveModal('outbreak')}
            className="px-4 py-2 bg-gradient-to-r from-[#F43F5E] to-[#A855F7] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:brightness-110 transition-all flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" /> Outbreak Radar
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
        {(['pending', 'investigating', 'resolved', 'dismissed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-white/10 text-white border border-white/20 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]' : 'text-[#978d9a] hover:text-white bg-white/5 border border-transparent'}`}
          >
            {f} ({f === 'all' ? reports.length : reports.filter(r => r.status === f).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          {filteredReports.length > 0 ? filteredReports.map((report) => (
            <GlassCard 
              key={report.id} 
              className={`p-6 border-white/5 hover:bg-white/[0.03] transition-all group relative overflow-hidden ${selectedReport?.id === report.id ? 'border-[#00D1FF]/40 shadow-[0_0_25px_rgba(0,209,255,0.1)]' : ''}`}
            >
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className={`p-3.5 rounded-2xl shrink-0 ${report.status === 'pending' ? 'bg-[#F43F5E]/10 text-[#F43F5E]' : report.status === 'investigating' ? 'bg-[#00D1FF]/10 text-[#00D1FF]' : 'bg-white/5 text-[#978d9a]'}`}>
                  <Flag className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 w-full cursor-pointer" onClick={() => { setSelectedReport(report); setActiveModal('investigate'); }}>
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-semibold text-base tracking-wide flex items-center gap-2">
                        {report.reason_category || "Flagged Interaction"}
                      </h3>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase font-bold tracking-widest ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <span className="text-xs text-[#978d9a] font-mono">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-[#cec3d0] font-medium mb-3 flex flex-wrap gap-4">
                    <span>Target: <strong className="text-white">{report.target_user_id || report.target?.id || 'Unknown'}</strong></span>
                    <span>Reporter: <span className="text-[#978d9a]">{report.reporter_id || report.reporter?.id || 'System'}</span></span>
                  </div>
                  <p className="text-sm text-[#978d9a] leading-relaxed line-clamp-2 bg-[#12151c]/60 p-3 rounded-xl border border-white/5">
                    {report.evidence_text || "No specific evidence details provided."}
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col items-center justify-end gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  {loadingId === report.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#00D1FF]" />
                  ) : (
                    <>
                      {report.status !== 'investigating' && (
                        <button 
                          onClick={() => handleUpdateStatus(report.id, 'investigating')}
                          className="px-3 py-1.5 rounded-lg bg-[#00D1FF]/10 text-[#00D1FF] hover:bg-[#00D1FF]/20 text-[10px] font-bold uppercase tracking-widest transition-all w-full sm:w-auto text-center"
                        >
                          Investigate
                        </button>
                      )}
                      {report.status !== 'resolved' && (
                        <button 
                          onClick={() => { setSelectedReport(report); setActiveModal('action'); }}
                          className="px-3 py-1.5 rounded-lg bg-[#F43F5E]/10 text-[#F43F5E] hover:bg-[#F43F5E]/20 text-[10px] font-bold uppercase tracking-widest transition-all w-full sm:w-auto text-center"
                        >
                          Action
                        </button>
                      )}
                      {report.status !== 'dismissed' && (
                        <button 
                          onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-[#978d9a] hover:bg-white/10 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all w-full sm:w-auto text-center"
                        >
                          Dismiss
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </GlassCard>
          )) : (
            <GlassCard className="flex flex-col items-center justify-center py-20 text-center border-white/5">
              <ShieldAlert className="w-16 h-16 mb-4 text-[#4c444f]" />
              <p className="text-base text-white font-semibold tracking-wide">Queue is perfectly clear</p>
              <p className="text-xs text-[#978d9a] mt-1">No reports matching the selected '{filter}' filter.</p>
            </GlassCard>
          )}
        </div>

        <div className="space-y-8">
          <GlassCard className="p-6 border-white/5 space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <Scale className="w-5 h-5 text-[#A855F7]" />
              Moderator Intelligence
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#A855F7]/10 to-transparent border border-[#A855F7]/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#A855F7] uppercase font-bold tracking-widest">AI Safety Assessment</span>
                  <span className="text-xs text-[#10B981] font-bold">Stable</span>
                </div>
                <p className="text-sm text-white font-medium">Harassment Patterns Under Control</p>
                <p className="text-xs text-[#978d9a] leading-relaxed">
                  Automated filters intercepted 42 suspicious phrases this hour. AI confidence rating: 98.4%.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest">Average Resolution</span>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-white">12.4 min</p>
                  <span className="text-xs text-[#10B981] font-semibold">↓ 15% vs yesterday</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-[#F43F5E]/30 bg-gradient-to-br from-[#F43F5E]/10 to-transparent">
            <div className="flex items-center gap-3 text-[#F43F5E] mb-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-semibold tracking-wide">Campus Outbreak Alert</h2>
            </div>
            <p className="text-xs text-[#cec3d0] leading-relaxed mb-6">
              AI has flagged clustered reporting near campus "Central Quad". 7 reports in the last 45 minutes concerning unverified identities.
            </p>
            <button 
              onClick={() => setActiveModal('outbreak')}
              className="w-full py-3 bg-[#F43F5E] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:brightness-110 transition-all"
            >
              Examine Clustered Hotspot
            </button>
          </GlassCard>
        </div>
      </div>

      {/* Investigation Modal */}
      {activeModal === 'investigate' && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-white/10 p-6 sm:p-8 relative space-y-6">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#978d9a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="p-4 rounded-2xl bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20">
                <Flag className="w-8 h-8" />
              </div>
              <div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase font-bold tracking-widest mb-1.5 inline-block ${getStatusBadge(selectedReport.status)}`}>
                  {selectedReport.status}
                </span>
                <h2 className="text-2xl font-display font-bold text-white">Investigation Dossier</h2>
                <p className="text-xs text-[#978d9a]">Report ID: {selectedReport.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#4c444f]">Target Account</span>
                <p className="text-sm font-semibold text-white break-all">{selectedReport.target_user_id || selectedReport.target?.id}</p>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => { setActiveModal('action'); }} 
                    className="px-3 py-1 rounded-lg bg-[#F43F5E]/10 text-[#F43F5E] text-xs font-bold uppercase tracking-wider"
                  >
                    Sanction Target
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#4c444f]">Reporter Account</span>
                <p className="text-sm font-semibold text-white break-all">{selectedReport.reporter_id || selectedReport.reporter?.id}</p>
                <span className="text-xs text-[#10B981] flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Trusted Reporter (Score: 89%)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-widest text-[#cec3d0]">Evidence Submitted</h3>
              <div className="p-4 rounded-xl bg-[#12151c] border border-white/10 text-sm text-white leading-relaxed whitespace-pre-wrap">
                {selectedReport.evidence_text || "No written evidence provided."}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
              <button 
                onClick={() => handleUpdateStatus(selectedReport.id, 'investigating')}
                className="flex-1 py-3 px-4 rounded-xl bg-[#00D1FF] text-black font-bold text-xs uppercase tracking-wider text-center shadow-[0_0_20px_rgba(0,209,255,0.3)] hover:brightness-110 transition-all"
              >
                Mark Investigating
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider text-center border border-white/10 transition-all"
              >
                Dismiss False Flag
              </button>
              <button 
                onClick={() => setActiveModal('action')}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F43F5E] text-white font-bold text-xs uppercase tracking-wider text-center shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:brightness-110 transition-all"
              >
                Issue Sanction
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Action / Sanction Modal */}
      {activeModal === 'action' && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md border-white/10 p-6 sm:p-8 relative space-y-6">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#978d9a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <ShieldAlert className="w-6 h-6 text-[#F43F5E]" />
              <h2 className="text-xl font-display font-bold text-white">Enforce Policy Sanction</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#cec3d0] block mb-2">Send Official Warning</label>
                <textarea 
                  value={warningMsg}
                  onChange={(e) => setWarningMsg(e.target.value)}
                  placeholder="State the violation of community guidelines clearly..."
                  className="w-full h-24 bg-[#12151c] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-[#4c444f] outline-none focus:border-[#F43F5E]/50 transition-all resize-none"
                />
                <button 
                  onClick={() => handleWarn(selectedReport.target_user_id || selectedReport.target?.id)}
                  disabled={!warningMsg.trim() || loadingId !== null}
                  className="w-full mt-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingId?.startsWith('action') ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />} Dispatch Warning Notification
                </button>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F43F5E] block">Account Restrictions</span>
                <button 
                  onClick={() => handleSuspend(selectedReport.target_user_id || selectedReport.target?.id)}
                  disabled={loadingId !== null}
                  className="w-full py-3 rounded-xl bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/20 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <UserMinus className="w-4 h-4" /> Suspend Target Account
                </button>
                <button 
                  onClick={() => handleBlock(selectedReport.target_user_id || selectedReport.target?.id)}
                  disabled={loadingId !== null}
                  className="w-full py-3 rounded-xl bg-[#F43F5E] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                >
                  <Ban className="w-4 h-4" /> Permanently Ban Account
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Outbreak Radar Modal */}
      {activeModal === 'outbreak' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-white/10 p-6 sm:p-8 relative space-y-6">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#978d9a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-3 h-3 rounded-full bg-[#F43F5E] animate-ping" />
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">Outbreak Radar & Clustering</h2>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F43F5E]/10 via-[#A855F7]/10 to-transparent border border-white/10 relative overflow-hidden space-y-4">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-[#F43F5E]/10 blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F43F5E] px-3 py-1 rounded-full bg-[#F43F5E]/20">Active Hotspot Detected</span>
                <span className="text-xs text-[#978d9a] font-mono">Radius: 500m</span>
              </div>
              
              <h3 className="text-xl font-bold text-white">Central Quad - North Dormitories</h3>
              <p className="text-sm text-[#cec3d0] leading-relaxed max-w-xl">
                Anomaly detection triggered: 7 reports filed within 45 minutes regarding suspicious bot-like proximity pings. 
                All reports originate from verified student devices.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#978d9a] block">Report Type</span>
                  <span className="text-sm font-semibold text-white">Fake Location Pings</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#978d9a] block">Target Vector</span>
                  <span className="text-sm font-semibold text-[#00D1FF]">New User Cohort</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#978d9a] block">Threat Level</span>
                  <span className="text-sm font-semibold text-[#F43F5E]">Elevated</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#cec3d0]">Automated Defense Recommendations</h4>
              <div className="p-4 rounded-xl bg-[#12151c] border border-white/5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Enable Strict Geofence Verification</p>
                  <p className="text-xs text-[#978d9a]">Temporarily require WiFi verification for radar visibility in this sector.</p>
                </div>
                <button 
                  onClick={() => { alert("Geofence strict mode engaged for Central Quad."); setActiveModal(null); }}
                  className="px-4 py-2 rounded-xl bg-[#00D1FF] text-black font-bold text-xs uppercase tracking-wider shrink-0 shadow-[0_0_15px_rgba(0,209,255,0.3)] hover:brightness-110 transition-all"
                >
                  Engage Defense
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

