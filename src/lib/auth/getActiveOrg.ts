import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getActiveOrgId() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    return null;
  }

  const cookieStore = cookies();
  const cookieOrgId = cookieStore.get("org_id")?.value;
  return memberships.find((membership) => membership.org_id === cookieOrgId)?.org_id ?? memberships[0].org_id;
}
