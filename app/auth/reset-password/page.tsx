"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/Button"
import { Lock, Sparkles } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match" })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      setMessage({ type: 'success', text: "Password updated successfully! Redirecting..." })
      setTimeout(() => router.push("/login"), 2000)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-[#0B0E14]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#A855F7] rounded-full blur-[120px] opacity-20 z-0" />
      
      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-[#A855F7]/20 rounded-full flex items-center justify-center mb-6 border border-[#A855F7]/30 shadow-lg shadow-[#A855F7]/10">
          <Sparkles className="w-8 h-8 text-[#A855F7]" />
        </div>
        
        <h1 className="font-display text-3xl font-semibold mb-2 text-white">Reset Credentials</h1>
        <p className="text-[#978d9a] text-sm text-center mb-8">Establish a new access key for your identity.</p>

        <GlassCard className="w-full p-6 border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#978d9a] font-bold pl-1">New Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-10 pr-4 text-white focus:border-[#A855F7] transition-all outline-none"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#978d9a] font-bold pl-1">Confirm Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-10 pr-4 text-white focus:border-[#A855F7] transition-all outline-none"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c444f]" />
              </div>
            </div>

            {message && (
              <p className={`text-xs p-3 rounded-xl border ${
                message.type === 'success' 
                  ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' 
                  : 'text-red-400 bg-red-400/10 border-red-400/20'
              }`}>
                {message.text}
              </p>
            )}

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-white text-black hover:bg-[#A855F7] hover:text-white transition-all font-bold"
            >
              {loading ? "Updating..." : "Confirm New Identity"}
            </Button>
          </form>
        </GlassCard>
      </div>
    </main>
  )
}
