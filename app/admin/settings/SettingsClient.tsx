"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Lock, 
  Cpu,
  RefreshCw,
  Save
} from "lucide-react"

import { updateSystemSetting } from "@/app/actions/admin"

interface SettingsClientProps {
  initialConfig: any[]
}

export default function SettingsClient({ initialConfig }: SettingsClientProps) {
  const getConfig = (key: string, defaultValue: any) => {
    const item = initialConfig.find(c => c.key === key)
    return item ? item.value : defaultValue
  }

  const [maintenanceMode, setMaintenanceMode] = useState(getConfig('maintenance_mode', false))
  const [allowSignups, setAllowSignups] = useState(getConfig('allow_signups', true))
  const [aiModeration, setAiModeration] = useState(getConfig('ai_moderation_enabled', true))
  const [sessionTimeout, setSessionTimeout] = useState(getConfig('session_timeout', '24h'))
  const [authEnforcement, setAuthEnforcement] = useState(getConfig('auth_enforcement', 'standard'))
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      // Save everything at once
      await Promise.all([
        updateSystemSetting('maintenance_mode', maintenanceMode),
        updateSystemSetting('allow_signups', allowSignups),
        updateSystemSetting('ai_moderation_enabled', aiModeration),
        updateSystemSetting('session_timeout', sessionTimeout),
        updateSystemSetting('auth_enforcement', authEnforcement)
      ])
      alert("All system configuration changes saved successfully.")
    } catch (err) {
      alert("Failed to save changes. Ensure you have Super Admin permissions.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">System Configuration</h1>
          <p className="text-[#978d9a] mt-1 text-sm sm:text-base">Global platform parameters and security protocols.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 bg-[#00D1FF] text-black rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(0,209,255,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 sm:p-8 border-white/5 space-y-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Globe className="w-5 h-5 text-[#00D1FF]" />
              Platform Controls
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Maintenance Mode</h3>
                  <p className="text-xs text-[#978d9a] mt-1">Take the entire network offline for updates.</p>
                </div>
                <button 
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${maintenanceMode ? 'bg-[#F43F5E]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${maintenanceMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
 
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Allow New Signups</h3>
                  <p className="text-xs text-[#978d9a] mt-1">Enable or disable new identity registration.</p>
                </div>
                <button 
                  onClick={() => setAllowSignups(!allowSignups)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${allowSignups ? 'bg-[#10B981]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${allowSignups ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
 
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Content Moderation</h3>
                  <p className="text-xs text-[#978d9a] mt-1">Automatically flag toxic interactions using AI.</p>
                </div>
                <button 
                  onClick={() => setAiModeration(!aiModeration)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${aiModeration ? 'bg-[#A855F7]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${aiModeration ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 border-white/5 space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#F43F5E]" />
              Security Protocol
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <p className="text-xs font-bold text-[#cec3d0] uppercase tracking-widest">Session Timeout</p>
                <select 
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full bg-[#191c22] border border-white/10 rounded-lg p-2 text-sm outline-none text-white"
                >
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                </select>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <p className="text-xs font-bold text-[#cec3d0] uppercase tracking-widest">Auth Enforcement</p>
                <select 
                  value={authEnforcement}
                  onChange={(e) => setAuthEnforcement(e.target.value)}
                  className="w-full bg-[#191c22] border border-white/10 rounded-lg p-2 text-sm outline-none text-white"
                >
                  <option value="strict">Strict (MFA Required)</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6 border-white/5">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-[#00D1FF]" />
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#978d9a]">API Core</span>
                <span className="text-[#10B981] font-bold">Operational</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#978d9a]">Match Engine</span>
                <span className="text-[#10B981] font-bold">Operational</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#978d9a]">DB Cluster</span>
                <span className="text-[#00D1FF] font-bold">99.9% Uptime</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-white/5">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-[#A855F7]" />
              Infrastructure
            </h2>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <p className="text-[10px] text-[#4c444f] uppercase font-bold tracking-widest">Edge Location</p>
              <p className="text-sm text-[#cec3d0]">US-East-1 (Primary)</p>
              <button className="text-[10px] font-bold uppercase tracking-widest text-[#A855F7] hover:underline">Manage Instances</button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
