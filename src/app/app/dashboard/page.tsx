import Link from "next/link";
import { cookies } from "next/headers";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getActiveOrgId() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const cookieStore = cookies();
  const cookieOrgId = cookieStore.get("org_id")?.value;

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    return null;
  }

  return memberships.find((membership) => membership.org_id === cookieOrgId)?.org_id ?? memberships[0].org_id;
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const orgId = await getActiveOrgId();

  if (!orgId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Je hebt nog geen organisatie gekoppeld.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding" className={buttonVariants()}>
              Organisatie koppelen
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ count: openQuotes }, { count: openOrders }, { count: tasksToday }, { count: unpaidInvoices }] =
    await Promise.all([
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("org_id", orgId),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("org_id", orgId),
      supabase
        .from("work_tasks")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("scheduled_date", new Date().toISOString().slice(0, 10))
        .lte("scheduled_date", new Date().toISOString().slice(0, 10)),
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("org_id", orgId).neq("status", "paid")
    ]);

  const { data: activity } = await supabase
    .from("audit_log")
    .select("id, entity_type, action, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Open offertes</CardDescription>
            <CardTitle>{openQuotes ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open orders</CardDescription>
            <CardTitle>{openOrders ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Taken vandaag</CardDescription>
            <CardTitle>{tasksToday ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Onbetaalde facturen</CardDescription>
            <CardTitle>{unpaidInvoices ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recente activiteit</CardTitle>
          <CardDescription>Laatste wijzigingen binnen je organisatie.</CardDescription>
        </CardHeader>
        <CardContent>
          {activity && activity.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {activity.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>
                    {item.entity_type} · {item.action}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("nl-NL")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen activiteit. Maak je eerste offerte of klant aan.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Snelle acties</CardTitle>
          <CardDescription>Start direct een nieuw proces.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/app/quotes/new" className={buttonVariants()}>
            Nieuwe offerte
          </Link>
          <Link href="/app/crm/customers" className={buttonVariants({ variant: "outline" })}>
            Nieuwe klant
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
