"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  ShieldAlert, 
  UserMinus,
  CheckCircle2,
  Clock,
  Eye,
  Key,
  Ban,
  ShieldX,
  X,
  ExternalLink,
  User as UserIcon,
  Mail,
  Calendar,
  Ruler,
  Weight as WeightIcon,
  Palette,
  Heart,
  Sliders,
  Check,
  ChevronDown
} from "lucide-react"
import { updateUserStatus, toggleUserSuspension, resetUserPassword, blockUser, warnUser, updateUserTrustScore } from "@/app/actions/admin"

interface UsersClientProps {
  initialUsers: any[]
  totalCount: number
}

export default function UsersClient({ initialUsers, totalCount }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [customTrustScore, setCustomTrustScore] = useState<number>(100)
  const [isAdjustingTrust, setIsAdjustingTrust] = useState(false)

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = (
      u.id.toLowerCase().includes(search) || 
      (u.email || "").toLowerCase().includes(search) ||
      (u.display_name || "").toLowerCase().includes(search) ||
      (u.role || "").toLowerCase().includes(search) ||
      (u.verification_status || "pending").toLowerCase().includes(search)
    )

    if (!matchesSearch) return false

    if (statusFilter === "all") return true
    if (statusFilter === "verified") return u.verification_status === "verified"
    if (statusFilter === "pending") return u.verification_status === "pending_verification" || !u.verification_status
    if (statusFilter === "suspended") return u.is_suspended === true
    if (statusFilter === "admin") return u.role === "admin" || u.role === "super_admin" || u.role === "moderator"
    
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
      case 'pending_verification': return 'text-[#00D1FF] bg-[#00D1FF]/10 border-[#00D1FF]/20'
      case 'rejected': return 'text-[#F43F5E] bg-[#F43F5E]/10 border-[#F43F5E]/20'
      default: return 'text-[#978d9a] bg-white/5 border-white/10'
    }
  }

  const handleResetPassword = async (email: string) => {
    if (!email) return alert("User has no email on file.")
    if (!confirm(`Send password reset email to ${email}?`)) return
    try {
      setIsProcessing(true)
      await resetUserPassword(email)
      alert("Password reset email link dispatched successfully!")
    } catch (error: any) {
      alert("Failed to send reset email: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBlockUser = async (userId: string) => {
    if (!confirm("Are you sure you want to block this user? This will suspend them and reject their verification.")) return
    try {
      setIsProcessing(true)
      await blockUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: true, verification_status: 'rejected', trust_score: 10 } : u))
      if (selectedUser?.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, is_suspended: true, verification_status: 'rejected', trust_score: 10 }))
      }
      alert("User account blocked successfully.")
    } catch (error: any) {
      alert("Failed to block user: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStatusToggle = async (user: any) => {
    const newStatus = user.verification_status === 'verified' ? 'rejected' : 'verified'
    const newScore = newStatus === 'verified' ? 100 : 50
    try {
      setIsProcessing(true)
      await updateUserStatus(user.id, newStatus)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, verification_status: newStatus, trust_score: newScore } : u))
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev: any) => ({ ...prev, verification_status: newStatus, trust_score: newScore }))
      }
    } catch (err: any) {
      alert("Failed to toggle verification: " + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuspensionToggle = async (user: any) => {
    const newSuspended = !user.is_suspended
    try {
      setIsProcessing(true)
      await toggleUserSuspension(user.id, newSuspended)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_suspended: newSuspended } : u))
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev: any) => ({ ...prev, is_suspended: newSuspended }))
      }
    } catch (err: any) {
      alert("Failed to toggle suspension: " + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveTrustScore = async (userId: string) => {
    try {
      setIsProcessing(true)
      await updateUserTrustScore(userId, customTrustScore)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, trust_score: customTrustScore } : u))
      if (selectedUser?.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, trust_score: customTrustScore }))
      }
      setIsAdjustingTrust(false)
      alert(`Trust score successfully updated to ${customTrustScore}%.`)
    } catch (err: any) {
      alert("Failed to update trust score: " + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const openUserDetails = (user: any) => {
    setSelectedUser(user)
    setCustomTrustScore(user.trust_score ?? 100)
    setIsAdjustingTrust(false)
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 relative min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">Citizen Database</h1>
          <p className="text-[#978d9a] mt-1 text-sm sm:text-base">Manage network participants, trust levels, and identities.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
            <input 
              type="text" 
              placeholder="Search by ID, Name, Email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#00D1FF]/50 transition-all w-full sm:w-72 text-white shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]"
            />
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${statusFilter !== 'all' ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-[#00D1FF]/30 shadow-[0_0_15px_rgba(0,209,255,0.2)]' : 'bg-white/5 border-white/10 text-[#978d9a] hover:text-white hover:bg-white/10'}`}
            >
              <Filter className="w-4 h-4" /> 
              <span>{statusFilter}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#12151c] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-40 py-1 overflow-hidden backdrop-blur-xl">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'verified', label: 'Verified Only' },
                  { id: 'pending', label: 'Pending Verification' },
                  { id: 'suspended', label: 'Suspended Accounts' },
                  { id: 'admin', label: 'Administrators' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setStatusFilter(opt.id); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${statusFilter === opt.id ? 'bg-[#00D1FF]/15 text-[#00D1FF] font-bold' : 'text-[#cec3d0] hover:bg-white/5 hover:text-white'}`}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <GlassCard className="hidden lg:block border-white/5 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Trust Score</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f] text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => openUserDetails(user)}>
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-md">
                        <span className="text-sm">{user.verification_status === 'verified' ? '✨' : '👤'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white tracking-wide group-hover:text-[#00D1FF] transition-colors">{user.display_name || user.email || 'Anonymous'}</p>
                        <p className="text-[10px] text-[#4c444f] font-mono tracking-tighter uppercase">{user.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border ${user.role === 'admin' || user.role === 'super_admin' ? 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'text-[#978d9a] bg-white/5 border-white/10'}`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(user.verification_status)}`}>
                      {user.verification_status === 'verified' && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                      {user.verification_status === 'pending_verification' && <Clock className="w-3.5 h-3.5 text-[#00D1FF]" />}
                      {user.is_suspended ? 'Suspended' : (user.verification_status || 'pending')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden max-w-[80px] border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all ${user.trust_score >= 70 ? 'bg-gradient-to-r from-[#10B981]/50 to-[#10B981]' : user.trust_score >= 40 ? 'bg-gradient-to-r from-[#00D1FF]/50 to-[#00D1FF]' : 'bg-gradient-to-r from-[#F43F5E]/50 to-[#F43F5E]'}`} 
                          style={{ width: `${user.trust_score ?? 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white font-mono">{user.trust_score ?? 100}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#978d9a] font-mono">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right pr-6">
                    <div className="inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openUserDetails(user)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#00D1FF]/50 hover:text-[#00D1FF] transition-all text-[#978d9a]" 
                        title="View Full Profile Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleResetPassword(user.email)}
                        disabled={isProcessing}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#A855F7]/50 hover:text-[#A855F7] transition-all text-[#978d9a] disabled:opacity-50" 
                        title="Reset User Password Link"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleStatusToggle(user)}
                        disabled={isProcessing}
                        className={`p-2 rounded-xl border transition-all disabled:opacity-50 ${user.verification_status === 'verified' ? 'bg-[#F43F5E]/10 border-[#F43F5E]/30 text-[#F43F5E] hover:bg-[#F43F5E]/20' : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'}`} 
                        title={user.verification_status === 'verified' ? "Revoke Verification" : "Verify Account"}
                      >
                        {user.verification_status === 'verified' ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleSuspensionToggle(user)}
                        disabled={isProcessing}
                        className={`p-2 rounded-xl border transition-all disabled:opacity-50 ${user.is_suspended ? 'bg-[#F43F5E] text-white border-[#F43F5E] shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-white/5 border-white/10 text-[#F43F5E] hover:bg-[#F43F5E]/10 hover:border-[#F43F5E]/30'}`}
                        title={user.is_suspended ? "Unsuspend User Account" : "Suspend User Account"}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleBlockUser(user.id)}
                        disabled={isProcessing}
                        className="p-2 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 hover:bg-[#F43F5E] hover:text-white transition-all text-[#F43F5E] disabled:opacity-50" 
                        title="Permanently Block / Ban User"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.map((user) => (
          <GlassCard key={user.id} className="p-5 border-white/5 space-y-4 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => openUserDetails(user)}>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
                  <span className="text-lg">{user.verification_status === 'verified' ? '✨' : '👤'}</span>
                </div>
                <div>
                  <p className="text-base font-semibold text-white truncate max-w-[180px]">{user.display_name || user.email || 'Anonymous'}</p>
                  <p className="text-[10px] text-[#4c444f] font-mono tracking-tighter uppercase">{user.id.slice(0, 12)}...</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusColor(user.verification_status)}`}>
                {user.is_suspended ? 'Suspended' : (user.verification_status || 'pending')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-[#4c444f] mb-1 font-bold">Role</p>
                <p className={`text-xs uppercase font-bold tracking-widest ${user.role === 'admin' ? 'text-[#A855F7]' : 'text-white'}`}>
                  {user.role || 'user'}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-[#4c444f] mb-1 font-bold">Trust Score</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <p className="text-xs font-mono font-bold text-white">{user.trust_score ?? 100}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
              <button 
                onClick={() => openUserDetails(user)}
                className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#978d9a] hover:text-white text-[10px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all"
              >
                <Eye className="w-4 h-4" /> View
              </button>
              <button 
                onClick={() => handleResetPassword(user.email)}
                disabled={isProcessing}
                className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#978d9a] hover:text-[#00D1FF] text-[10px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <Key className="w-4 h-4" /> Pass
              </button>
              <button 
                onClick={() => handleStatusToggle(user)}
                disabled={isProcessing}
                className={`py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 ${user.verification_status === 'verified' ? 'bg-[#F43F5E]/10 border-[#F43F5E]/20 text-[#F43F5E]' : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'}`}
              >
                {user.verification_status === 'verified' ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />} 
                {user.verification_status === 'verified' ? 'Revoke' : 'Verify'}
              </button>
              <button 
                onClick={() => handleSuspensionToggle(user)}
                disabled={isProcessing}
                className={`py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 ${user.is_suspended ? 'bg-[#F43F5E] text-white border-[#F43F5E]' : 'bg-white/5 border-white/10 text-[#F43F5E]'}`}
              >
                <UserMinus className="w-4 h-4" /> {user.is_suspended ? 'Unsus' : 'Susp'}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* User Details Dossier Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-white/10 p-6 sm:p-8 relative space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#978d9a] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-white/5 pb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#00D1FF]/20 to-[#A855F7]/20 border border-white/10 flex items-center justify-center shadow-xl shadow-black/50 shrink-0 relative overflow-hidden">
                <span className="text-5xl">✨</span>
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mb-2 truncate">
                  {selectedUser.display_name || 'Anonymous Voyager'}
                </h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusColor(selectedUser.verification_status)}`}>
                    {selectedUser.verification_status || 'Pending'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border bg-white/5 border-white/10 text-[#cec3d0]">
                    {selectedUser.role || 'User'}
                  </span>
                  {selectedUser.is_suspended && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30 animate-pulse">
                      Suspended Account
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4c444f] font-mono tracking-wider uppercase">ID: {selectedUser.id}</p>
              </div>
            </div>

            {/* Trust Meter Adjustment Section */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#00D1FF]" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">Trust Score Calibration</h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#00D1FF] bg-[#00D1FF]/10 px-3 py-1 rounded-full border border-[#00D1FF]/20">
                  {isAdjustingTrust ? customTrustScore : (selectedUser.trust_score ?? 100)}%
                </span>
              </div>

              {isAdjustingTrust ? (
                <div className="space-y-4 pt-2">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={customTrustScore}
                    onChange={(e) => setCustomTrustScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00D1FF]"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsAdjustingTrust(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSaveTrustScore(selectedUser.id)}
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-lg bg-[#00D1FF] text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,209,255,0.3)] hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? "Saving..." : "Apply Trust Calibration"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-1">
                  <p className="text-xs text-[#978d9a] leading-relaxed max-w-lg">
                    Trust scores govern access to proximity broadcasting and encrypted chat channels. Adjust manually for flagged or exceptional citizens.
                  </p>
                  <button 
                    onClick={() => setIsAdjustingTrust(true)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#00D1FF]/40 text-[#00D1FF] text-xs font-bold uppercase tracking-wider transition-all shrink-0"
                  >
                    Adjust Score
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4 p-5 rounded-2xl bg-white/[0.01] border border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#00D1FF] flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Personal Records
                </h3>
                <div className="space-y-3 font-medium">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white break-all">{selectedUser.email || 'No email record'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white">{selectedUser.age || '22'} Years Old</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <UserIcon className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white capitalize">{selectedUser.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Heart className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white capitalize">Seeking: {selectedUser.preferred_gender || 'Everyone'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 rounded-2xl bg-white/[0.01] border border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#A855F7] flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Physical Attributes
                </h3>
                <div className="space-y-3 font-medium">
                  <div className="flex items-center gap-3 text-sm">
                    <Ruler className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white">{selectedUser.height || '178'} cm</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <WeightIcon className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white">{selectedUser.weight || '70'} kg</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Palette className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white capitalize">{selectedUser.skin_color || 'Standard'} Tone</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#cec3d0] mb-3">Vibe Resonance Profile</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedUser.personality_vibes || ["Night Owl", "Creative", "Vintage Film"]).map((vibe: string) => (
                  <span key={vibe} className="px-3.5 py-1.5 rounded-xl bg-[#00D1FF]/10 border border-[#00D1FF]/20 text-[#00D1FF] text-xs font-bold uppercase tracking-wide">
                    {vibe}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
              <button 
                onClick={() => window.open(`https://xjszrqfcnehfkkerwxak.supabase.co/storage/v1/object/authenticated/university_ids/${selectedUser.id}`, '_blank')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00D1FF]/50 hover:bg-white/10 transition-all gap-2 group"
              >
                <ExternalLink className="w-5 h-5 text-[#978d9a] group-hover:text-[#00D1FF] transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Inspect ID Card</span>
              </button>
              <button 
                onClick={() => handleResetPassword(selectedUser.email)}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#A855F7]/50 hover:bg-white/10 transition-all gap-2 group disabled:opacity-50"
              >
                <Key className="w-5 h-5 text-[#978d9a] group-hover:text-[#A855F7] transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Reset Password</span>
              </button>
              <button 
                onClick={() => handleStatusToggle(selectedUser)}
                disabled={isProcessing}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 transition-all gap-2 group disabled:opacity-50 ${selectedUser.verification_status === 'verified' ? 'hover:border-[#F43F5E]/50' : 'hover:border-[#10B981]/50'}`}
              >
                {selectedUser.verification_status === 'verified' ? <ShieldX className="w-5 h-5 text-[#F43F5E]" /> : <ShieldCheck className="w-5 h-5 text-[#10B981]" />}
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">{selectedUser.verification_status === 'verified' ? 'Revoke Verify' : 'Verify Account'}</span>
              </button>
              <button 
                onClick={() => handleBlockUser(selectedUser.id)}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 hover:bg-[#F43F5E] hover:text-white transition-all gap-2 group text-[#F43F5E] disabled:opacity-50"
              >
                <Ban className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Ban Account</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

