import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const { data: workOrder } = await supabase
    .from("work_orders")
    .select("id, status, notes, work_task:work_tasks(title)")
    .eq("org_id", orgId)
    .eq("id", params.id)
    .single();

  if (!workOrder) {
    redirect("/app/work-orders");
  }

  const [measurements, checklist, photos, signatures] = await Promise.all([
    supabase
      .from("work_measurements")
      .select("id, label, width_mm, height_mm")
      .eq("org_id", orgId)
      .eq("work_order_id", params.id),
    supabase
      .from("work_checklist_items")
      .select("id, label, is_checked")
      .eq("org_id", orgId)
      .eq("work_order_id", params.id),
    supabase
      .from("work_photos")
      .select("id, storage_path, description")
      .eq("org_id", orgId)
      .eq("work_order_id", params.id),
    supabase
      .from("work_signatures")
      .select("id, signer_name, signed_at")
      .eq("org_id", orgId)
      .eq("work_order_id", params.id)
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{workOrder.work_task?.title ?? "Werkbon"}</CardTitle>
          <CardDescription>Status: {workOrder.status}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {workOrder.notes ?? "Geen notities toegevoegd."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metingen</CardTitle>
        </CardHeader>
        <CardContent>
          {measurements.data && measurements.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {measurements.data.map((measurement) => (
                <li key={measurement.id} className="rounded-md border border-border p-3">
                  <div className="font-medium">{measurement.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {measurement.width_mm}mm x {measurement.height_mm}mm
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Geen metingen beschikbaar. Vul metingen in via de mobiele werkbon.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {checklist.data && checklist.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {checklist.data.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <span>{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.is_checked ? "Gereed" : "Open"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Geen checklist items ingevuld.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foto’s</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.data && photos.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {photos.data.map((photo) => (
                <li key={photo.id} className="rounded-md border border-border p-3">
                  <div className="font-medium">{photo.description ?? "Foto"}</div>
                  <div className="text-xs text-muted-foreground">{photo.storage_path}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen foto’s toegevoegd.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Handtekening</CardTitle>
        </CardHeader>
        <CardContent>
          {signatures.data && signatures.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {signatures.data.map((signature) => (
                <li key={signature.id} className="rounded-md border border-border p-3">
                  <div className="font-medium">{signature.signer_name}</div>
                  <div className="text-xs text-muted-foreground">{signature.signed_at}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Geen handtekening opgeslagen.
            </div>
          )}
          <Link href="/m/today" className={`${buttonVariants({ variant: "outline" })} mt-4 inline-flex`}>
            Werkbon afronden via mobiel
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
