import { redirect } from "next/navigation";

import SitesPageClient from "@/app/app/sites/SitesPageClient";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SitesPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const [{ data: sites }, { data: customers }] = await Promise.all([
    supabase
      .from("sites")
      .select("id, name, address, customer_id")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase.from("customers")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name", { ascending: true })
  ]);

  return <SitesPageClient sites={sites ?? []} customers={customers ?? []} />;
}
