import { cookies } from "next/headers";

export type OrgContext = {
  orgId: string;
  role: string;
};

export function requireOrg(): OrgContext {
  const cookieStore = cookies();
  const orgId = cookieStore.get("org_id")?.value;
  const role = cookieStore.get("org_role")?.value;

  if (!orgId || !role) {
    throw new Error("Active organization not set.");
  }

  return { orgId, role };
}
