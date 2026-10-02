import "server-only"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
export interface XPAwardResult { newXP: number; newLevel: number; streakDays: number; leveledUp: boolean; xpEarned: number }
/** Only trusted server code may choose an award. The ledger prevents duplicate rewards. */
export async function awardXP(userId: string, xpAmount: number, source: string, sourceId: string): Promise<XPAwardResult | null> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (user?.id !== userId || xpAmount <= 0) return null
  const { data,error } = await supabaseAdmin().rpc("award_activity_xp", { p_user_id: userId,p_amount: xpAmount,p_source: source,p_source_id: sourceId })
  if (error) return null
  return data as XPAwardResult
}
