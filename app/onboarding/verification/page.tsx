"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/Button"
import { Upload, ShieldCheck, FileImage } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function Verification() {
  const router = useRouter()
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // Safety net: If already uploaded, move forward
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('verification_status')
            .eq('id', userData.user.id)
            .single()
          
          if (profile && profile.verification_status !== 'pending') {
            router.replace('/onboarding/personality')
          }
        }
      } catch (e) {
        console.error("Status check failed:", e)
      } finally {
        setChecking(false)
      }
    }
    checkStatus()
  }, [supabase, router])

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error("Not authenticated. Please sign in again.")

      const userId = userData.user.id
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-id.${fileExt}`
      const filePath = `${fileName}`

      console.log("Attempting upload to university_ids bucket...", filePath)

      // Upload to storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('university_ids')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        })

      if (uploadError) {
        console.error("Supabase Storage Error:", uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log("Upload successful:", uploadData)

      console.log("Updating profile status for user:", userId)

      // Update profile status (using upsert to be safe if trigger failed)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          verification_status: 'pending_verification' 
        })

      if (profileError) {
        console.error("Profile Upsert Error Detail:", {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        })
        throw new Error(`Failed to update profile: ${profileError.message || "Permission denied (check SQL policies)"}`)
      }

      console.log("Profile updated successfully. Redirecting...")

      // Success, move to personality sync
      router.push('/onboarding/personality')

    } catch (err: any) {
      console.error("Verification Process Error:", err)
      setError(err.message || "Failed to connect to verification service. Please check your internet connection.")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="z-10 w-full max-w-sm flex flex-col items-center text-center">
        <GlassCard className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border-[#10B981]/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <ShieldCheck className="w-10 h-10 text-[#10B981]" />
        </GlassCard>
        
        <h1 className="font-display text-2xl font-semibold mb-2 text-[#e3b5ff]">
          Verify Your Status
        </h1>
        <p className="text-[#cec3d0] text-sm mb-8 px-4">
          To maintain a safe environment, we require a photo of your valid University ID. This is kept strictly confidential.
        </p>

        <GlassCard className="w-full p-6 border-white/10 flex flex-col items-center">
          <input 
            type="file" 
            id="id-upload"
            accept="image/*"
            className="hidden"
            suppressHydrationWarning
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0])
              }
            }}
          />
          
          <label 
            htmlFor="id-upload"
            className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-[#00D1FF] bg-[#00D1FF]/5' : 'border-[#4c444f] hover:border-white/30 hover:bg-white/5'}`}
          >
            {file ? (
              <>
                <FileImage className="w-8 h-8 text-[#00D1FF] mb-2" />
                <span className="text-sm text-[#00D1FF] font-medium">{file.name}</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#978d9a] mb-2" />
                <span className="text-sm text-[#cec3d0]">Tap to upload or take a photo</span>
              </>
            )}
          </label>

          {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

          <Button 
            disabled={!file || loading} 
            onClick={handleUpload}
            className="w-full mt-6"
          >
            {loading ? "Uploading securely..." : "Submit for Verification"}
          </Button>
        </GlassCard>
      </div>
    </main>
  )
}
