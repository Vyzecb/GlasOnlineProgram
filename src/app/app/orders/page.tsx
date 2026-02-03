import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, number, status, customer:customers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Overzicht van alle orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Nummer</th>
                    <th className="px-4 py-2 text-left">Klant</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-border">
                      <td className="px-4 py-2">
                        <a href={`/app/orders/${order.id}`} className="text-primary hover:underline">
                          {order.number}
                        </a>
                      </td>
                      <td className="px-4 py-2">{order.customer?.name ?? "-"}</td>
                      <td className="px-4 py-2">{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen orders. Converteer een offerte om een order te starten.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
