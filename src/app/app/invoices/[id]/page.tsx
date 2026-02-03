import { redirect } from "next/navigation";

import InvoiceDetailClient from "@/app/app/invoices/[id]/InvoiceDetailClient";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, number, status, total")
    .eq("org_id", orgId)
    .eq("id", params.id)
    .single();

  if (!invoice) {
    redirect("/app/invoices");
  }

  const { data: lines } = await supabase
    .from("invoice_lines")
    .select("id, description, quantity, unit_price")
    .eq("org_id", orgId)
    .eq("invoice_id", invoice.id)
    .order("created_at", { ascending: true });

  return <InvoiceDetailClient orgId={orgId} invoice={invoice} initialLines={lines ?? []} />;
}
