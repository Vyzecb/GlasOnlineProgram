import { NextResponse } from "next/server";

import { buildSimplePdf } from "@/lib/pdf/simplePdf";
import { buildQuotePdfLines, normalizeQuoteRow, type QuoteRow } from "@/lib/pdf/quotePdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const orgId = await getActiveOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isValidQuoteId(params.id)) {
    return NextResponse.json({ error: "Invalid quote id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("id, number, total, customer:customers(id, name)")
    .eq("org_id", orgId)
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load quote" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const quote = normalizeQuoteRow(data as QuoteRow);
  const pdfBytes = buildSimplePdf(buildQuotePdfLines(quote));

  const path = `${orgId}/quotes/${quote.id}/quote-${quote.number}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("org-files")
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "Failed to upload PDF" }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("attachments").insert({
    org_id: orgId,
    entity_type: "quote",
    entity_id: quote.id,
    storage_path: path,
    description: `Offerte ${quote.number}`
  });

  if (insertError) {
    return NextResponse.json({ error: "Failed to save attachment" }, { status: 500 });
  }

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=quote-${quote.number}.pdf`
    }
  });
}

function isValidQuoteId(id: string) {
  const trimmed = id.trim();
  if (!trimmed) {
    return false;
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const numericPattern = /^\d+$/;

  return uuidPattern.test(trimmed) || numericPattern.test(trimmed);
}
