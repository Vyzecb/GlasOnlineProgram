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

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, number, total, customer:customers(name)")
    .eq("org_id", orgId)
    .eq("id", params.id)
    .single();

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBytes = buildSimplePdf([
    `Offerte ${quote.number}`,
    `Klant: ${quote.customer?.name ?? ""}`,
    `Totaal: € ${quote.total.toFixed(2)}`
  ]);

  const path = `${orgId}/quotes/${quote.id}/quote-${quote.number}.pdf`;
  await supabase.storage.from("org-files").upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

  await supabase.from("attachments").insert({
    org_id: orgId,
    entity_type: "quote",
    entity_id: quote.id,
    storage_path: path,
    description: `Offerte ${quote.number}`
  });

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=quote-${quote.number}.pdf`
    }
  });
}
