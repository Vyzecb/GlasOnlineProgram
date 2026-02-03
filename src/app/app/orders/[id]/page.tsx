import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OrderTaskForm from "@/app/app/orders/OrderTaskForm";
import { buttonVariants } from "@/components/ui/button";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function createInvoiceAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  if (!orderId || !orgId) return;

  const supabase = createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("org_id", orgId)
    .eq("id", orderId)
    .single();

  if (!order) return;

  const { data: invoice } = await supabase
    .from("invoices")
    .insert({ org_id: orgId, order_id: order.id, issued_on: new Date().toISOString().slice(0, 10) })
    .select("id")
    .single();

  if (!invoice) return;

  const { data: lines } = await supabase
    .from("order_lines")
    .select("description, quantity, unit_price")
    .eq("org_id", orgId)
    .eq("order_id", order.id);

  if (lines && lines.length > 0) {
    await supabase.from("invoice_lines").insert(
      lines.map((line) => ({
        org_id: orgId,
        invoice_id: invoice.id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price
      }))
    );
  }
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, number, status, customer:customers(name)")
    .eq("org_id", orgId)
    .eq("id", params.id)
    .single();

  if (!order) {
    redirect("/app/orders");
  }

  const [{ data: lines }, { data: tasks }, { data: technicians }] = await Promise.all([
    supabase
      .from("order_lines")
      .select("id, description, quantity, unit_price")
      .eq("org_id", orgId)
      .eq("order_id", order.id),
    supabase
      .from("work_tasks")
      .select("id, title, scheduled_date, status")
      .eq("org_id", orgId)
      .eq("order_id", order.id)
      .order("scheduled_date", { ascending: true }),
    supabase
      .from("org_members")
      .select("user_id, role")
      .eq("org_id", orgId)
      .eq("role", "technician")
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order {order.number}</CardTitle>
          <CardDescription>{order.customer?.name ?? ""}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <span>Status: {order.status}</span>
          <form action={createInvoiceAction}>
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              Factuur aanmaken
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orderregels</CardTitle>
        </CardHeader>
        <CardContent>
          {lines && lines.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center justify-between">
                  <span>
                    {line.description} · {line.quantity} x € {line.unit_price}
                  </span>
                  <span className="text-xs text-muted-foreground">€ {(line.quantity * line.unit_price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Geen orderregels beschikbaar.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planningstaak toevoegen</CardTitle>
          <CardDescription>Plan uitvoering en wijs een monteur toe.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderTaskForm orgId={orgId} orderId={order.id} technicians={technicians ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planningstaken</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground">{task.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{task.scheduled_date}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen planningstaken. Voeg een taak toe via het formulier hierboven.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
