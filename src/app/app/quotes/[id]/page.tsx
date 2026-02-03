import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function convertToOrderAction(formData: FormData) {
  "use server";
  const quoteId = String(formData.get("quoteId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  if (!quoteId || !orgId) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, customer_id, site_id")
    .eq("id", quoteId)
    .eq("org_id", orgId)
    .single();

  if (!quote) {
    return;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      org_id: orgId,
      quote_id: quote.id,
      customer_id: quote.customer_id,
      site_id: quote.site_id
    })
    .select("id")
    .single();

  if (error || !order) {
    return;
  }

  const { data: lines } = await supabase
    .from("quote_lines")
    .select("line_type, description, quantity, unit_price, cost_price, spec")
    .eq("org_id", orgId)
    .eq("quote_id", quote.id);

  if (lines && lines.length > 0) {
    await supabase.from("order_lines").insert(
      lines.map((line) => ({
        org_id: orgId,
        order_id: order.id,
        line_type: line.line_type,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        cost_price: line.cost_price,
        spec: line.spec
      }))
    );
  }

  redirect(`/app/orders/${order.id}`);
}

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, number, status, total, notes, customer:customers(name), site:sites(name)")
    .eq("org_id", orgId)
    .eq("id", params.id)
    .single();

  if (!quote) {
    redirect("/app/quotes");
  }

  const { data: lines } = await supabase
    .from("quote_lines")
    .select("id, description, line_type, quantity, unit_price")
    .eq("org_id", orgId)
    .eq("quote_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Offerte {quote.number}</CardTitle>
          <CardDescription>{quote.customer?.name ?? ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Site: {quote.site?.name ?? "Geen"}</div>
          <div>Status: {quote.status}</div>
          <div>Totaal: € {quote.total.toFixed(2)}</div>
          {quote.notes ? <div>Opmerkingen: {quote.notes}</div> : null}
          <a href={`/app/api/pdf/quote/${quote.id}`} className={buttonVariants({ variant: "outline" })}>
            Genereer PDF
          </a>
          <form action={convertToOrderAction} className="mt-4">
            <input type="hidden" name="quoteId" value={quote.id} />
            <input type="hidden" name="orgId" value={orgId} />
            <button type="submit" className={buttonVariants()}>
              Converteer naar order
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offerte regels</CardTitle>
        </CardHeader>
        <CardContent>
          {lines && lines.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center justify-between">
                  <span>
                    {line.description} · {line.quantity} x € {line.unit_price}
                  </span>
                  <span className="text-xs text-muted-foreground">{line.line_type}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen regels toegevoegd.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
