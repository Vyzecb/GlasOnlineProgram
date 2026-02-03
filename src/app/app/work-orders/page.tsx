import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WorkOrdersPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: workOrders } = await supabase
    .from("work_orders")
    .select("id, status, work_task:work_tasks(title)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Werkbonnen</CardTitle>
          <CardDescription>Overzicht van uitgevoerde werkbonnen.</CardDescription>
        </CardHeader>
        <CardContent>
          {workOrders && workOrders.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {workOrders.map((order) => (
                <li key={order.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{order.work_task?.title ?? "Werkbon"}</span>
                    <span className="text-xs text-muted-foreground">{order.status}</span>
                  </div>
                  <Link href={`/app/work-orders/${order.id}`} className="text-xs text-primary hover:underline">
                    Bekijk details
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen werkbonnen. Gebruik de mobiele app om taken te verwerken.
            </div>
          )}
          <Link href="/m/today" className={`${buttonVariants({ variant: "outline" })} mt-4 inline-flex`}>
            Ga naar mobile takenlijst
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
