"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B0E14] text-white font-sans antialiased">
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#0B0E14]">
          <div className="max-w-md w-full bg-[#12151c]/90 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-center justify-center text-[#F43F5E] mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-wide mb-2 text-white font-display">System Glitch</h1>
            <p className="text-sm text-[#978d9a] mb-8 leading-relaxed">
              A fatal client error occurred. Our synchronization protocols have been reset.
            </p>

            <button
              onClick={() => reset()}
              className="w-full py-3 px-6 rounded-xl bg-[#00D1FF] hover:brightness-110 text-black font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Restart Incogni
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
