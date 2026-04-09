import createAdminClient from "@/utils/supabase/admin";
import { isAdminEmail } from "@/lib/accessControl";

export const FREE_CREDIT_LIMIT = 1000;
export const CREDIT_COST_PER_LOGIN = 50;
export const CREDIT_COST_PER_AI_ACTION = 50;
export const CREDIT_COST_PER_UPLOAD = 50;

export type UserPlan = "free" | "pro" | "enterprise";

export interface UserCreditsRecord {
  user_id: string;
  email: string | null;
  plan: UserPlan;
  credits_used: number;
  credits_limit: number | null;
  last_counted_sign_in_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  updated_at?: string;
  created_at?: string;
}

export interface CreditSummary {
  plan: UserPlan;
  creditsUsed: number;
  creditsLimit: number | null;
  creditsRemaining: number | null;
  exceeded: boolean;
}

function toSummary(record: UserCreditsRecord): CreditSummary {
  const limit = record.credits_limit;
  const remaining = limit === null ? null : Math.max(0, limit - record.credits_used);
  const exceeded = limit !== null && record.credits_used >= limit;
  return {
    plan: record.plan,
    creditsUsed: record.credits_used,
    creditsLimit: limit,
    creditsRemaining: remaining,
    exceeded,
  };
}

export async function ensureUserCredits(
  userId: string,
  email?: string | null
): Promise<UserCreditsRecord> {
  const admin = await createAdminClient();
  const { data: existing, error: readError } = await admin
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Failed to read credits: ${readError.message}`);
  }

  if (existing) {
    return existing as UserCreditsRecord;
  }

  // Only initialize when no record exists yet.
  const initPayload = {
    user_id: userId,
    email: email ?? null,
    plan: "free" as UserPlan,
    credits_used: 0,
    credits_limit: FREE_CREDIT_LIMIT,
  };

  const { data: upserted, error: upsertError } = await admin
    .from("user_credits")
    .upsert(initPayload, { onConflict: "user_id", ignoreDuplicates: true })
    .select("*")
    .maybeSingle();

  if (upsertError) {
    throw new Error(`Failed to initialize credits: ${upsertError.message}`);
  }

  if (upserted) {
    return upserted as UserCreditsRecord;
  }

  // If another request created the row concurrently, read and return it.
  const { data: concurrent, error: concurrentReadError } = await admin
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (concurrentReadError || !concurrent) {
    throw new Error(
      `Failed to load initialized credits: ${concurrentReadError?.message || "unknown error"}`
    );
  }

  return concurrent as UserCreditsRecord;
}

export async function grantInitialFreeCredits(
  userId: string,
  email?: string | null
): Promise<CreditSummary> {
  const existing = await ensureUserCredits(userId, email);

  // Never downgrade paid users when they click free-tier CTA.
  if (existing.plan !== "free") {
    return toSummary(existing);
  }

  // Keep usage history for free users; only make sure a valid limit exists.
  if (existing.credits_limit === null || existing.credits_limit <= 0) {
    const admin = await createAdminClient();
    const { data, error } = await admin
      .from("user_credits")
      .update({
        credits_limit: FREE_CREDIT_LIMIT,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to grant free credits: ${error?.message || "unknown error"}`);
    }

    return toSummary(data as UserCreditsRecord);
  }

  return toSummary(existing);
}

export async function getUserCreditSummary(
  userId: string,
  email?: string | null
): Promise<CreditSummary> {
  const record = await ensureUserCredits(userId, email);
  return toSummary(record);
}

export async function consumeAiCredit(
  userId: string,
  email?: string | null,
  amount: number = CREDIT_COST_PER_AI_ACTION
): Promise<{ allowed: boolean; summary: CreditSummary }> {
  const record = await ensureUserCredits(userId, email);
  if (isAdminEmail(email)) {
    return {
      allowed: true,
      summary: toSummary(record),
    };
  }
  const safeAmount = Math.max(CREDIT_COST_PER_AI_ACTION, amount);

  if (record.plan !== "free" || record.credits_limit === null) {
    return {
      allowed: true,
      summary: toSummary(record),
    };
  }

  const wouldBeUsed = record.credits_used + safeAmount;
  if (wouldBeUsed > record.credits_limit) {
    return {
      allowed: false,
      summary: toSummary(record),
    };
  }

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("user_credits")
    .update({
      credits_used: wouldBeUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to consume AI credit: ${error?.message || "unknown error"}`);
  }

  return {
    allowed: true,
    summary: toSummary(data as UserCreditsRecord),
  };
}

export async function consumeUploadCredit(
  userId: string,
  email?: string | null,
  amount: number = CREDIT_COST_PER_UPLOAD
): Promise<{ allowed: boolean; summary: CreditSummary }> {
  const record = await ensureUserCredits(userId, email);
  if (isAdminEmail(email)) {
    return {
      allowed: true,
      summary: toSummary(record),
    };
  }
  const safeAmount = Math.max(CREDIT_COST_PER_UPLOAD, amount);

  if (record.plan !== "free" || record.credits_limit === null) {
    return {
      allowed: true,
      summary: toSummary(record),
    };
  }

  const wouldBeUsed = record.credits_used + safeAmount;
  if (wouldBeUsed > record.credits_limit) {
    return {
      allowed: false,
      summary: toSummary(record),
    };
  }

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("user_credits")
    .update({
      credits_used: wouldBeUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to consume upload credit: ${error?.message || "unknown error"}`);
  }

  return {
    allowed: true,
    summary: toSummary(data as UserCreditsRecord),
  };
}

export async function consumeLoginCreditIfNeeded(
  userId: string,
  email?: string | null,
  lastSignInAt?: string | null
): Promise<{ allowed: boolean; summary: CreditSummary }> {
  const record = await ensureUserCredits(userId, email);
  if (isAdminEmail(email)) {
    return { allowed: true, summary: toSummary(record) };
  }

  if (!lastSignInAt) {
    return { allowed: true, summary: toSummary(record) };
  }

  const normalizedSignInAt = new Date(lastSignInAt).toISOString();
  const alreadyCounted =
    record.last_counted_sign_in_at &&
    new Date(record.last_counted_sign_in_at).getTime() >=
      new Date(normalizedSignInAt).getTime();

  if (alreadyCounted) {
    return { allowed: true, summary: toSummary(record) };
  }

  if (record.plan !== "free" || record.credits_limit === null) {
    const admin = await createAdminClient();
    const { data, error } = await admin
      .from("user_credits")
      .update({
        last_counted_sign_in_at: normalizedSignInAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to update login marker: ${error?.message || "unknown error"}`);
    }

    return { allowed: true, summary: toSummary(data as UserCreditsRecord) };
  }

  const wouldBeUsed = record.credits_used + CREDIT_COST_PER_LOGIN;
  if (wouldBeUsed > record.credits_limit) {
    return { allowed: false, summary: toSummary(record) };
  }

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("user_credits")
    .update({
      credits_used: wouldBeUsed,
      last_counted_sign_in_at: normalizedSignInAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to consume login credit: ${error?.message || "unknown error"}`);
  }

  return { allowed: true, summary: toSummary(data as UserCreditsRecord) };
}

export async function applyPaidPlanFromCheckout(params: {
  userId: string;
  email?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<CreditSummary> {
  const { userId, email, customerId, subscriptionId } = params;
  await ensureUserCredits(userId, email);

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("user_credits")
    .update({
      email: email ?? null,
      plan: "pro",
      credits_limit: null, // unlimited
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to apply paid plan: ${error?.message || "unknown error"}`);
  }

  return toSummary(data as UserCreditsRecord);
}

export async function grantManualProUnlimited(params: {
  userId: string;
  email?: string | null;
}): Promise<CreditSummary> {
  const { userId, email } = params;
  await ensureUserCredits(userId, email);

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("user_credits")
    .update({
      email: email ?? null,
      plan: "pro",
      credits_limit: null, // unlimited
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to grant manual pro unlimited: ${error?.message || "unknown error"}`);
  }

  return toSummary(data as UserCreditsRecord);
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = await createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const match = (data?.users || []).find(
    (u) => (u.email || "").toLowerCase() === email.toLowerCase()
  );
  return match?.id || null;
}
