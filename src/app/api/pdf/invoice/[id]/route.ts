import { NextResponse } from "next/server";

import { buildSimplePdf } from "@/lib/pdf/simplePdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const orgId = await getActiveOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, number, total")
    .eq("org_id", orgId)
    .eq("id", params.id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBytes = buildSimplePdf([
    `Factuur ${invoice.number}`,
    `Totaal: € ${invoice.total.toFixed(2)}`
  ]);

  const path = `${orgId}/invoices/${invoice.id}/invoice-${invoice.number}.pdf`;
  await supabase.storage.from("org-files").upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

  await supabase.from("attachments").insert({
    org_id: orgId,
    entity_type: "invoice",
    entity_id: invoice.id,
    storage_path: path,
    description: `Factuur ${invoice.number}`
  });

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=invoice-${invoice.number}.pdf`
    }
  });
}
