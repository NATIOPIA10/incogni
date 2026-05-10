import { redirect } from "next/navigation"
import { MapPin } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import RadarClient, { type RadarProfile } from "./RadarClient"

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ADMIN_ID = "81f9ea7d-e9eb-47a6-8668-13d584ed1435"

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
  let others: any[] = [];
  let fetchError: any = null;

  try {
    // 2. Fetch current user's profile
    const { data, error } = await supabase
      .from("profiles")
      .select("personality_vibes, seeking_vibes, verification_status, geo_bucket, privacy_mode, trust_score, gender, preferred_gender, resonance_radius, display_name, age")
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
      .select("id, personality_vibes, seeking_vibes, verification_status, geo_bucket, privacy_mode, trust_score, gender, display_name, age, role")
      .neq("id", user.id)
    
    if (othersError) {
      console.error("Error fetching other profiles:", othersError);
    } else {
      others = othersData || [];
      console.log(`Radar: Fetched ${others.length} profiles from DB (excluding self)`);
      others.forEach(p => {
        console.log(`Profile Scan - ID: ${p.id.slice(0,8)}, Name: ${p.display_name || 'N/A'}, Role: ${p.role}, Status: ${p.verification_status}, Privacy: ${p.privacy_mode}`);
      });
    }
  } catch (err: any) {
    console.error("Unexpected fetch error:", err);
    fetchError = err;
  }

  if (fetchError && fetchError.code === 'PGRST116') {
  } else if (fetchError) {
    return (
      <main className="flex flex-col items-center justify-center p-6 min-h-screen text-center">
        <h1 className="text-xl font-semibold text-red-400 mb-4">Connection Error</h1>
        <p className="text-[#cec3d0] mb-8">
          We couldn't connect to the database. Please ensure you've run the SQL setup script.
        </p>
      </main>
    )
  }

  // 3. Onboarding guards
  if (!myProfile || !myProfile.display_name) redirect("/onboarding/profile")

  const status = myProfile?.verification_status ?? "pending"
  if (status === "pending") redirect("/onboarding/verification")

  const myVibes: string[] = myProfile.personality_vibes ?? []
  const mySeeking: string[] = myProfile.seeking_vibes ?? []

  if (myVibes.length === 0 && mySeeking.length === 0) {
    redirect("/onboarding/personality")
  }

  const myRadius = myProfile?.resonance_radius || 1.0

  const radarProfiles: RadarProfile[] = (others ?? [])
    .filter(p => {
      if (p.id === ADMIN_ID) return false;
      if (!p.display_name) {
        console.log(`Radar Filter: ${p.id} hidden (No nickname)`);
        return false;
      }
      return true;
    })
    // 4. Intelligent Filtering (Distance, Gender & Preference)
    .filter(p => {
      /* Distance filter based on resonance radius (DISABLED FOR DEBUG) */
      
      /* Gender preference filter */
      const myPref = myProfile.preferred_gender
      if (myPref && myPref !== "everyone" && p.gender !== myPref) {
        return false
      }
      
      return true
    })
    .map(p => ({
      id: p.id,
      display_name: p.display_name,
      age: p.age,
      gender: p.gender,
      personality_vibes: p.personality_vibes ?? [],
      seeking_vibes: p.seeking_vibes ?? [],
      geo_bucket: p.geo_bucket,
      trust_score: p.trust_score,
      compatibility: calcCompatibility(
        myVibes,
        mySeeking,
        p.personality_vibes ?? [],
        p.seeking_vibes ?? []
      ),
    }))

  // Sort by compatibility descending
  radarProfiles.sort((a, b) => b.compatibility - a.compatibility)

  console.log(`Radar: ${radarProfiles.length} users remaining after distance/gender/vibe filters`);

  return (
    <main className="flex flex-col items-center p-6 min-h-[calc(100vh-80px)] overflow-hidden relative">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-8 mt-4 z-10">
        <h1 className="font-display text-2xl font-semibold text-[#e1e2eb]">Incogni Radar</h1>
        <div className="flex items-center gap-1.5 bg-[#2E004B]/50 px-3 py-1.5 rounded-full border border-white/10">
          <MapPin className="w-4 h-4 text-[#00D1FF]" />
          <span className="text-xs font-medium tracking-wide">Incogni</span>
        </div>
      </header>

      {/* Radar */}
      <RadarClient 
        profiles={radarProfiles} 
        myVibes={myVibes} 
        myBucket={myProfile.geo_bucket}
      />
    </main>
  )
}
