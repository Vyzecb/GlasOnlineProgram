import { redirect } from "next/navigation";

import CustomerDetailClient from "@/app/app/crm/customers/[id]/CustomerDetailClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("org_id", orgId)
    .eq("id", params.id)
    .single();

  if (!customer) {
    redirect("/app/crm/customers");
  }

  const [contacts, sites, attachments] = await Promise.all([
    supabase
      .from("customer_contacts")
      .select("id, name, email, phone, role")
      .eq("org_id", orgId)
      .eq("customer_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sites")
      .select("id, name, address, notes")
      .eq("org_id", orgId)
      .eq("customer_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("attachments")
      .select("id, storage_path, description")
      .eq("org_id", orgId)
      .eq("entity_type", "customer")
      .eq("entity_id", params.id)
      .order("created_at", { ascending: false })
  ]);

  return (
    <CustomerDetailClient
      orgId={orgId}
      customerId={params.id}
      contacts={contacts.data ?? []}
      sites={sites.data ?? []}
      attachments={attachments.data ?? []}
    />
  );
}
