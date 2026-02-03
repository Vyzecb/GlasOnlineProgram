import { redirect } from "next/navigation";

import InvoicesPageClient from "@/app/app/invoices/InvoicesPageClient";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function InvoicesPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, number, status, total")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return <InvoicesPageClient invoices={invoices ?? []} />;
}
