import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const [{ data: revenue }, { data: openInvoices }, { data: hitRate }] = await Promise.all([
    supabase.from("report_revenue_monthly").select("month, total").eq("org_id", orgId),
    supabase.from("report_open_invoices").select("count").eq("org_id", orgId).single(),
    supabase.from("report_hit_rate").select("quote_count, order_count, hit_rate").eq("org_id", orgId).single()
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Omzet per maand</CardTitle>
          <CardDescription>Overzicht op basis van facturen.</CardDescription>
        </CardHeader>
        <CardContent>
          {revenue && revenue.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {revenue.map((row) => (
                <li key={row.month} className="flex items-center justify-between">
                  <span>{row.month}</span>
                  <span>€ {Number(row.total).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Geen omzetdata beschikbaar.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Openstaande facturen</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {openInvoices?.count ?? 0} openstaande facturen.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offerte hit rate</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {hitRate ? (
            <div>
              {hitRate.order_count} orders op {hitRate.quote_count} offertes · {Math.round(hitRate.hit_rate * 100)}%
            </div>
          ) : (
            "Nog geen data."
          )}
        </CardContent>
      </Card>
    </div>
  );
}
