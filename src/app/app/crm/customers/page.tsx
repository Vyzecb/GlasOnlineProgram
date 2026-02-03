import { redirect } from "next/navigation";

import CustomerPageClient from "@/app/app/crm/customers/CustomerPageClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";

export default async function CustomersPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, type, email, phone, billing_address, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return <CustomerPageClient orgId={orgId} initialCustomers={customers ?? []} />;
}
