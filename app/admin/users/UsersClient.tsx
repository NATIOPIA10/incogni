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
  Eye
} from "lucide-react"
import { updateUserStatus, toggleUserSuspension } from "@/app/actions/admin"

interface UsersClientProps {
  initialUsers: any[]
  totalCount: number
}

export default function UsersClient({ initialUsers, totalCount }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase()
    return (
      u.id.toLowerCase().includes(search) || 
      (u.email || "").toLowerCase().includes(search) ||
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

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
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
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-[#00D1FF]/50 transition-all w-full sm:w-64"
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
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4c444f]">Identity (ID)</th>
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
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="text-[10px]">✨</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.email || 'No Email Record'}</p>
                        <p className="text-[10px] text-[#4c444f] font-mono tracking-tighter uppercase">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${user.role === 'admin' ? 'text-[#A855F7]' : 'text-[#978d9a]'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(user.verification_status)}`}>
                      {user.verification_status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                      {user.verification_status === 'pending_verification' && <Clock className="w-3 h-3" />}
                      {user.verification_status || 'pending'}
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
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => window.open(`https://xjszrqfcnehfkkerwxak.supabase.co/storage/v1/object/authenticated/university_ids/${user.id}`, '_blank')}
                        className="p-2 rounded-lg bg-white/5 hover:text-[#00D1FF] transition-colors" 
                        title="View ID Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => updateUserStatus(user.id, 'verified')}
                        className="p-2 rounded-lg bg-white/5 hover:text-[#10B981] transition-colors" 
                        title="Verify User"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleUserSuspension(user.id, !user.is_suspended)}
                        className={`p-2 rounded-lg bg-white/5 hover:text-[#F43F5E] transition-colors ${user.is_suspended ? 'text-[#F43F5E]' : ''}`}
                        title={user.is_suspended ? "Unsuspend User" : "Suspend User"}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/5 text-[#4c444f]">
                        <MoreVertical className="w-4 h-4" />
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white truncate max-w-[150px]">{user.email || 'No Email'}</p>
                  <p className="text-[10px] text-[#4c444f] font-mono tracking-tighter uppercase">{user.id.slice(0, 12)}...</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${getStatusColor(user.verification_status)}`}>
                {user.verification_status || 'pending'}
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

            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={() => window.open(`https://xjszrqfcnehfkkerwxak.supabase.co/storage/v1/object/authenticated/university_ids/${user.id}`, '_blank')}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" /> ID
              </button>
              <button 
                onClick={() => updateUserStatus(user.id, 'verified')}
                className="flex-1 py-2.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Verify
              </button>
              <button 
                onClick={() => toggleUserSuspension(user.id, !user.is_suspended)}
                className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${user.is_suspended ? 'bg-[#F43F5E] text-white border-[#F43F5E]' : 'bg-white/5 border-white/10 text-[#F43F5E]'}`}
              >
                <UserMinus className="w-3.5 h-3.5" /> {user.is_suspended ? 'Unban' : 'Ban'}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
