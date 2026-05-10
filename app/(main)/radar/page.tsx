import { redirect } from "next/navigation"
import { MapPin } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import RadarClient, { type RadarProfile } from "./RadarClient"

/** Calculate compatibility: % of the other person's vibes that match what the current
 *  user is seeking, blended with how many of their own vibes the other user seeks. */
function calcCompatibility(
  myVibes: string[],
  mySeeking: string[],
  theirVibes: string[],
  theirSeeking: string[]
): number {
  if (!myVibes.length && !mySeeking.length) return 0

  const theyMatchWhatISeek =
    mySeeking.length > 0
      ? theirVibes.filter(v => mySeeking.includes(v)).length / mySeeking.length
      : 0

  const iMatchWhatTheySeek =
    theirSeeking.length > 0
      ? myVibes.filter(v => theirSeeking.includes(v)).length / theirSeeking.length
      : 0

  const avg = (theyMatchWhatISeek + iMatchWhatTheySeek) / 2
  return Math.round(avg * 100)
}

export default async function RadarPage() {
  const supabase = await createClient()

  // 1. Auth guard — unauthenticated → landing
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/")

  let myProfile: any = null;
  let others: = [];
  let fetchError: any = null;

  try {
    // 2. Fetch current user's profile
    const { data, error } = await supabase
      .from("profiles")
      .select("personality_vibes, seeking_vibes, verification_status")
      .eq("id", user.id)
      .single()
    
    if (error) {
      console.error("Error fetching own profile:", error);
      fetchError = error;
    } else {
      myProfile = data;
    }

    // 3. Fetch other users
    const { data: othersData, error: othersError } = await supabase
      .from("profiles")
      .select("id, personality_vibes, seeking_vibes, verification_status")
      .neq("id", user.id)
      .neq("verification_status", "pending")
    
    if (othersError) {
      console.error("Error fetching other profiles:", othersError);
    } else {
      others = othersData || [];
    }
  } catch (err: any) {
    console.error("Unexpected fetch error:", err);
    fetchError = err;
  }

  // Handle missing profiles table or connection error
  if (fetchError && fetchError.code === 'PGRST116') {
    // Profile not found for this user, but table exists
    // This shouldn't happen if trigger is working, but we can handle it
  } else if (fetchError) {
    return (
      <main className="flex flex-col items-center justify-center p-6 min-h-screen text-center">
        <h1 className="text-xl font-semibold text-red-400 mb-4">Connection Error</h1>
        <p className="text-[#cec3d0] mb-8">
          We couldn't connect to the database. Please ensure you've run the SQL setup script in your Supabase dashboard.
        </p>
        <p className="text-xs text-[#4c444f]">Error: {fetchError.message || "Failed to fetch"}</p>
      </main>
    )
  }

  // 3. Onboarding guards
  const status = myProfile?.verification_status ?? "pending"

  // Step 1: Must have submitted ID (status != "pending")
  if (!myProfile || status === "pending") {
    redirect("/onboarding/verification")
  }

  // Step 2: Must have completed personality sync (non-empty vibes)
  const myVibes: string[] = myProfile.personality_vibes ?? []
  const mySeeking: string[] = myProfile.seeking_vibes ?? []

  if (myVibes.length === 0 && mySeeking.length === 0) {
    redirect("/onboarding/personality")
  }

  const radarProfiles: RadarProfile[] = (others ?? [])
    // Only include users who have completed personality sync
    .filter(p => (p.personality_vibes?.length ?? 0) > 0 || (p.seeking_vibes?.length ?? 0) > 0)
    .map(p => ({
      id: p.id,
      personality_vibes: p.personality_vibes ?? [],
      seeking_vibes: p.seeking_vibes ?? [],
      compatibility: calcCompatibility(
        myVibes,
        mySeeking,
        p.personality_vibes ?? [],
        p.seeking_vibes ?? []
      ),
    }))

  // Sort by compatibility descending
  radarProfiles.sort((a, b) => b.compatibility - a.compatibility)

  return (
    <main className="flex flex-col items-center p-6 min-h-[calc(100vh-80px)] overflow-hidden relative">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-8 mt-4 z-10">
        <h1 className="font-display text-2xl font-semibold text-[#e1e2eb]">The Radar</h1>
        <div className="flex items-center gap-1.5 bg-[#2E004B]/50 px-3 py-1.5 rounded-full border border-white/10">
          <MapPin className="w-4 h-4 text-[#00D1FF]" />
          <span className="text-xs font-medium tracking-wide">Campus</span>
        </div>
      </header>

      {/* Radar */}
      <RadarClient profiles={radarProfiles} myVibes={myVibes} />
    </main>
  )
}
