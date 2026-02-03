import { redirect } from "next/navigation";

import QuotePageClient from "@/app/app/quotes/QuotePageClient";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function QuotesPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const [{ data: customers }, { data: sites }, { data: quotes }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("org_id", orgId).order("name", { ascending: true }),
    supabase
      .from("sites")
      .select("id, name, customer_id")
      .eq("org_id", orgId)
      .order("name", { ascending: true }),
    supabase
      .from("quotes")
      .select("id, number, status, total, created_at, customer:customers(name)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
  ]);

  return (
    <QuotePageClient
      orgId={orgId}
      customers={customers ?? []}
      sites={sites ?? []}
      initialQuotes={quotes ?? []}
    />
  );
}
