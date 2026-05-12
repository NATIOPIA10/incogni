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
  Heart
} from "lucide-react"
import { updateUserStatus, toggleUserSuspension, resetUserPassword, blockUser } from "@/app/actions/admin"

interface UsersClientProps {
  initialUsers: any[]
  totalCount: number
}

export default function UsersClient({ initialUsers, totalCount }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase()
    return (
      u.id.toLowerCase().includes(search) || 
      (u.email || "").toLowerCase().includes(search) ||
      (u.display_name || "").toLowerCase().includes(search) ||
      (u.verification_status || "pending").toLowerCase().includes(search)
    )
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-[#10B981] bg-[#10B981]/10'
      case 'pending_verification': return 'text-[#00D1FF] bg-[#00D1FF]/10'
      case 'rejected': return 'text-[#F43F5E] bg-[#F43F5E]/10'
      default: return 'text-[#978d9a] bg-white/5'
    }
  }

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Send password reset email to ${email}?`)) return
    try {
      setIsProcessing(true)
      await resetUserPassword(email)
      alert("Reset email sent!")
    } catch (error) {
      alert("Failed to send reset email")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBlockUser = async (userId: string) => {
    if (!confirm("Are you sure you want to block this user? This will suspend them and reject their verification.")) return
    try {
      setIsProcessing(true)
      await blockUser(userId)
    } catch (error) {
      alert("Failed to block user")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 relative min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">Citizen Database</h1>
          <p className="text-[#978d9a] mt-1 text-sm sm:text-base">Manage network participants and their trust levels.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-[#00D1FF]/50 transition-all w-full sm:w-64 text-white"
            />
          </div>
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#978d9a] hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <GlassCard className="hidden lg:block border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Trust Score</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(user)}>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="text-[10px]">✨</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.display_name || user.email || 'Anonymous'}</p>
                        <p className="text-[10px] text-[#4c444f] font-mono tracking-tighter uppercase">{user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${user.role === 'admin' ? 'text-[#A855F7] bg-[#A855F7]/10' : 'text-[#978d9a] bg-white/5'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(user.verification_status)}`}>
                      {user.verification_status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                      {user.verification_status === 'pending_verification' && <Clock className="w-3 h-3" />}
                      {user.is_suspended ? 'Suspended' : (user.verification_status || 'pending')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                        <div 
                          className={`h-full rounded-full ${user.trust_score >= 70 ? 'bg-[#10B981]' : user.trust_score >= 40 ? 'bg-[#00D1FF]' : 'bg-[#F43F5E]'}`} 
                          style={{ width: `${user.trust_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#cec3d0]">{user.trust_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#978d9a]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="p-2 rounded-lg bg-white/5 hover:text-[#00D1FF] transition-colors" 
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleResetPassword(user.email)}
                        className="p-2 rounded-lg bg-white/5 hover:text-[#A855F7] transition-colors" 
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => updateUserStatus(user.id, user.verification_status === 'verified' ? 'rejected' : 'verified')}
                        className={`p-2 rounded-lg bg-white/5 hover:text-[#10B981] transition-colors ${user.verification_status === 'verified' ? 'text-[#10B981]' : ''}`} 
                        title={user.verification_status === 'verified' ? "Unverify" : "Verify"}
                      >
                        {user.verification_status === 'verified' ? <ShieldX className="w-4 h-4 text-[#F43F5E]" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => toggleUserSuspension(user.id, !user.is_suspended)}
                        className={`p-2 rounded-lg bg-white/5 hover:text-[#F43F5E] transition-colors ${user.is_suspended ? 'text-[#F43F5E]' : ''}`}
                        title={user.is_suspended ? "Unsuspend" : "Suspend"}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleBlockUser(user.id)}
                        className="p-2 rounded-lg bg-white/5 hover:text-[#F43F5E] transition-colors" 
                        title="Block/Ban"
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
          <GlassCard key={user.id} className="p-5 border-white/5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3" onClick={() => setSelectedUser(user)}>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white truncate max-w-[150px]">{user.display_name || user.email || 'Anonymous'}</p>
                  <p className="text-[10px] text-[#4c444f] font-mono tracking-tighter uppercase">{user.id.slice(0, 12)}...</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${getStatusColor(user.verification_status)}`}>
                {user.is_suspended ? 'Suspended' : (user.verification_status || 'pending')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-[#4c444f] mb-1 font-bold">Role</p>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${user.role === 'admin' ? 'text-[#A855F7]' : 'text-[#978d9a]'}`}>
                  {user.role}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-[#4c444f] mb-1 font-bold">Trust</p>
                <p className="text-[10px] font-bold text-white">{user.trust_score}%</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button 
                onClick={() => setSelectedUser(user)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <Eye className="w-3 h-3" /> View
              </button>
              <button 
                onClick={() => handleResetPassword(user.email)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <Key className="w-3 h-3" /> Pass
              </button>
              <button 
                onClick={() => updateUserStatus(user.id, user.verification_status === 'verified' ? 'rejected' : 'verified')}
                className={`flex-1 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${user.verification_status === 'verified' ? 'bg-[#F43F5E]/10 border-[#F43F5E]/20 text-[#F43F5E]' : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'}`}
              >
                {user.verification_status === 'verified' ? <ShieldX className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />} {user.verification_status === 'verified' ? 'Unver' : 'Verify'}
              </button>
              <button 
                onClick={() => toggleUserSuspension(user.id, !user.is_suspended)}
                className={`flex-1 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${user.is_suspended ? 'bg-[#F43F5E] text-white border-[#F43F5E]' : 'bg-white/5 border-white/10 text-[#F43F5E]'}`}
              >
                <UserMinus className="w-3 h-3" /> {user.is_suspended ? 'Live' : 'Susp'}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-white/10 p-6 sm:p-8 relative">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#978d9a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00D1FF]/20 to-[#A855F7]/20 border border-white/10 flex items-center justify-center shadow-xl shadow-black/50">
                <span className="text-4xl">✨</span>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mb-1">
                  {selectedUser.display_name || 'Anonymous Voyager'}
                </h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusColor(selectedUser.verification_status)}`}>
                    {selectedUser.verification_status || 'Pending'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 text-[#978d9a]">
                    {selectedUser.role}
                  </span>
                  {selectedUser.is_suspended && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4c444f] font-mono uppercase tracking-tighter">ID: {selectedUser.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c444f] border-b border-white/5 pb-2">Personal Records</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white">{selectedUser.email || 'No email record'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white">{selectedUser.age || '20'} Years Old</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <UserIcon className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white capitalize">{selectedUser.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Heart className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white capitalize">Interested in: {selectedUser.preferred_gender || 'Everyone'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c444f] border-b border-white/5 pb-2">Physical Attributes</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Ruler className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white">{selectedUser.height || '--'} cm</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <WeightIcon className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white">{selectedUser.weight || '--'} kg</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Palette className="w-4 h-4 text-[#978d9a]" />
                    <span className="text-white capitalize">{selectedUser.skin_color || 'Not recorded'} Tone</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c444f] border-b border-white/5 pb-2 mb-4">Vibe Signatures</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedUser.personality_vibes || []).map((vibe: string) => (
                  <span key={vibe} className="px-3 py-1 rounded-lg bg-[#00D1FF]/10 border border-[#00D1FF]/20 text-[#00D1FF] text-[10px] font-bold uppercase">
                    {vibe}
                  </span>
                ))}
                {(selectedUser.personality_vibes || []).length === 0 && (
                  <p className="text-xs text-[#4c444f] italic">No vibes initialized.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button 
                onClick={() => window.open(`https://xjszrqfcnehfkkerwxak.supabase.co/storage/v1/object/authenticated/university_ids/${selectedUser.id}`, '_blank')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00D1FF]/50 transition-all gap-2 group"
              >
                <Eye className="w-5 h-5 text-[#978d9a] group-hover:text-[#00D1FF]" />
                <span className="text-[9px] font-bold uppercase text-[#4c444f]">View ID</span>
              </button>
              <button 
                onClick={() => handleResetPassword(selectedUser.email)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#A855F7]/50 transition-all gap-2 group"
              >
                <Key className="w-5 h-5 text-[#978d9a] group-hover:text-[#A855F7]" />
                <span className="text-[9px] font-bold uppercase text-[#4c444f]">Reset Pass</span>
              </button>
              <button 
                onClick={() => updateUserStatus(selectedUser.id, selectedUser.verification_status === 'verified' ? 'rejected' : 'verified')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#10B981]/50 transition-all gap-2 group ${selectedUser.verification_status === 'verified' ? 'border-[#10B981]/30' : ''}`}
              >
                {selectedUser.verification_status === 'verified' ? <ShieldX className="w-5 h-5 text-[#F43F5E]" /> : <ShieldCheck className="w-5 h-5 text-[#10B981]" />}
                <span className="text-[9px] font-bold uppercase text-[#4c444f]">{selectedUser.verification_status === 'verified' ? 'Unverify' : 'Verify'}</span>
              </button>
              <button 
                onClick={() => handleBlockUser(selectedUser.id)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#F43F5E]/50 transition-all gap-2 group"
              >
                <Ban className="w-5 h-5 text-[#F43F5E]" />
                <span className="text-[9px] font-bold uppercase text-[#4c444f]">Block</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
