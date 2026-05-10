"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/GlassCard"
import { Shield, Lock, Mail, ArrowRight, Loader2 } from "lucide-react"

export default function AdminLoginClient() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      // Check if the user is an admin in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profileError || !['admin', 'super_admin', 'moderator'].includes(profile?.role)) {
        await supabase.auth.signOut()
        throw new Error("Access Denied: Administrative credentials required.")
      }

      router.push("/admin")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#A855F7]/10 blur-[120px] rounded-full pointer-events-none" />
      
      <GlassCard className="max-w-md w-full p-10 border-white/5 space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#A855F7]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#A855F7]/20">
            <Shield className="w-8 h-8 text-[#A855F7]" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-[#978d9a] text-sm">Secure access to Incogni Command Center.</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex gap-3 animate-shake">
            <Lock className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#4c444f] ml-1">Admin Identity</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@campussoul.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#4c444f] focus:border-[#A855F7]/50 focus:ring-0 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#4c444f] ml-1">Access Protocol</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#4c444f] focus:border-[#A855F7]/50 focus:ring-0 transition-all outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#A855F7] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Initiate Access <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#4c444f] uppercase tracking-widest leading-relaxed">
          Authorized personnel only. All access attempts are monitored and logged via secure audit protocols.
        </p>
      </GlassCard>
    </div>
  )
}
