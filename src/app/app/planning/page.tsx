import { redirect } from "next/navigation";

import PlanningPageClient from "@/app/app/planning/PlanningPageClient";
import { getActiveOrgId } from "@/lib/auth/getActiveOrg";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlanningPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    redirect("/onboarding");
  }

  const supabase = createSupabaseServerClient();
  const [{ data: tasks }, { data: technicians }] = await Promise.all([
    supabase
      .from("work_tasks")
      .select("id, title, scheduled_date, status, assigned_to")
      .eq("org_id", orgId)
      .order("scheduled_date", { ascending: true }),
    supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "technician")
  ]);

  return <PlanningPageClient orgId={orgId} initialTasks={tasks ?? []} technicians={technicians ?? []} />;
}
