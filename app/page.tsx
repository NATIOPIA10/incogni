"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Sparkles, HeartPulse } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { GlassCard } from "@/components/ui/GlassCard"

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const steps = [
    {
      icon: Sparkles,
      title: "Ethereal Connectivity",
      description: "A safe space for university dating. No swiping. No aggressive algorithms. Just organic connection.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your identity emerges slowly. We use frosted glass and trust meters to keep you secure until you're ready.",
    },
    {
      icon: HeartPulse,
      title: "Sync Your Vibe",
      description: "Let's align your frequency. We focus on psychological comfort and deep compatibility.",
    }
  ]

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      router.push("/signup")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#2E004B] rounded-full blur-[100px] opacity-50" />
      
      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center text-center"
          >
            <GlassCard className="w-24 h-24 rounded-full flex items-center justify-center mb-8 border-[#00D1FF]/20 shadow-[0_0_30px_rgba(0,209,255,0.1)]">
              {(() => {
                const Icon = steps[step].icon
                return <Icon className="w-10 h-10 text-[#00D1FF]" />
              })()}
            </GlassCard>
            
            <h1 className="font-display text-3xl font-semibold mb-4 text-[#e3b5ff]">
              {steps[step].title}
            </h1>
            
            <p className="text-[#cec3d0] text-base leading-relaxed max-w-[280px]">
              {steps[step].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-[#00D1FF] shadow-[0_0_8px_rgba(0,209,255,0.6)]" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="mt-12 w-full">
          <Button onClick={nextStep} className="w-full h-14 text-lg">
            {step === steps.length - 1 ? "Enter The Radar" : "Continue"}
          </Button>
        </div>
      </div>
    </main>
  )
}
