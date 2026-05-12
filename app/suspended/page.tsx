"use client"

import { GlassCard } from "@/components/ui/GlassCard"
import { ShieldAlert, LogOut, MessageSquare } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function SuspendedPage() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/signup")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-[#0B0E14]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-8 border border-red-500/30 shadow-2xl shadow-red-500/10 animate-pulse">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="font-display text-4xl font-bold mb-4 text-white tracking-tight">Identity Terminated</h1>
        <p className="text-[#978d9a] text-lg mb-10 leading-relaxed">
          Your access to the Incogni resonance network has been revoked due to a violation of security protocols or citizen conduct standards.
        </p>

        <GlassCard className="w-full p-8 border-white/5 bg-white/[0.02]">
          <div className="space-y-6">
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
              <p className="text-xs text-red-400 font-bold uppercase tracking-widest mb-1">Current Status</p>
              <p className="text-sm text-white font-medium">Suspended / Blocked Permanently</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.href = "mailto:support@incogni.app"}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white font-bold hover:bg-white/10 transition-all group"
              >
                <MessageSquare className="w-5 h-5 text-[#00D1FF]" />
                Appeal Termination
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                Exit Network
              </button>
            </div>
          </div>
        </GlassCard>

        <p className="mt-12 text-[10px] text-[#4c444f] uppercase tracking-[0.3em] font-bold">
          System ID: Protocol-72-B-ALPHA
        </p>
      </div>
    </main>
  )
}
