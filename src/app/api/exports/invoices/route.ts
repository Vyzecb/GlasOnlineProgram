import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";

function toCsv(rows: Record<string, string | number | null>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => JSON.stringify(row[header] ?? "")).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const orgId = await getActiveOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "exact";

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, number, status, total, issued_on, due_on")
    .eq("org_id", orgId)
    .order("issued_on", { ascending: false });

  if (type === "json") {
    await supabase.from("exports").insert({
      org_id: orgId,
      export_type: "ubl-json",
      payload: { count: invoices?.length ?? 0 }
    });
    return NextResponse.json({ invoices: invoices ?? [] });
  }

  const rows = (invoices ?? []).map((invoice) => ({
    number: invoice.number,
    status: invoice.status,
    issued_on: invoice.issued_on,
    due_on: invoice.due_on,
    total: invoice.total
  }));

  const csv = toCsv(rows);
  await supabase.from("exports").insert({
    org_id: orgId,
    export_type: type,
    payload: { count: rows.length }
  });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${type}-invoices.csv`
    }
  });
}
