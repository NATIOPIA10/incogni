"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("Incogni App Error Boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#0B0E14] text-white selection:bg-[#00D1FF]/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F43F5E]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00D1FF]/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-md w-full bg-[#12151c]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-center justify-center text-[#F43F5E] mb-6 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="font-display text-2xl font-bold tracking-wide mb-2">Signal Interrupted</h1>
        <p className="text-sm text-[#978d9a] mb-8 leading-relaxed">
          We encountered a temporary synchronization glitch. Please reload or return to the safe zone.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-6 rounded-xl bg-[#00D1FF] hover:brightness-110 text-black font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,209,255,0.3)]"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" /> Try Reloading
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  )
}
