"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/Button"
import { Lock, Mail } from "lucide-react"
import { login, signup } from "@/app/auth/actions"

export default function Signup() {
  const [isLogin, setIsLogin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      let result
      if (isLogin) {
        result = await login(formData)
      } else {
        result = await signup(formData)
      }

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch (err: any) {
      if (err.message === "NEXT_REDIRECT") {
        throw err;
      }
      setError(err.message || "An unexpected error occurred. Did you restart the server after adding .env.local?")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#2E004B] rounded-full blur-[100px] opacity-50 z-0" />
      
      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <h1 className="font-display text-3xl font-semibold mb-2 text-[#e3b5ff]">
          {isLogin ? "Welcome Back" : "Join the Network"}
        </h1>
        <p className="text-[#cec3d0] text-sm text-center mb-8">
          {isLogin ? "Enter your credentials to connect." : "A safe, anonymous space for university students."}
        </p>

        <GlassCard className="w-full p-6 border-[#00D1FF]/20 shadow-[0_0_30px_rgba(0,209,255,0.05)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#978d9a] uppercase tracking-wider font-semibold pl-1">University Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="student@university.edu"
                  className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl h-12 pl-10 pr-4 focus:outline-none focus:border-[#00D1FF]/50 focus:shadow-[0_0_10px_rgba(0,209,255,0.2)] transition-all"
                  suppressHydrationWarning
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#978d9a]" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#978d9a] uppercase tracking-wider font-semibold pl-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl h-12 pl-10 pr-4 focus:outline-none focus:border-[#00D1FF]/50 focus:shadow-[0_0_10px_rgba(0,209,255,0.2)] transition-all"
                  suppressHydrationWarning
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#978d9a]" />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mt-2">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 mt-4 text-base">
              {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#00D1FF] hover:underline"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </GlassCard>
      </div>
    </main>
  )
}
