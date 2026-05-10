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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Citizen Database</h1>
          <p className="text-[#978d9a] mt-1">Manage network participants and their trust levels.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
            <input 
              type="text" 
              placeholder="Search by ID or Vibe..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-[#00D1FF]/50 transition-all w-64"
            />
          </div>
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#978d9a] hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <GlassCard className="border-white/5 overflow-hidden">
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
    </div>
  )
}
