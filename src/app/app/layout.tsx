import type { Route } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/app/dashboard" as Route, label: "Dashboard" },
  { href: "/app/crm/customers" as Route, label: "CRM" },
  { href: "/app/sites" as Route, label: "Sites" },
  { href: "/app/quotes" as Route, label: "Offertes" },
  { href: "/app/orders" as Route, label: "Orders" },
  { href: "/app/planning" as Route, label: "Planning" },
  { href: "/app/work-orders" as Route, label: "Werkbonnen" },
  { href: "/app/invoices" as Route, label: "Facturen" },
  { href: "/app/reports" as Route, label: "Rapportages" },
  { href: "/app/settings" as Route, label: "Instellingen" }
] as const;

type Org = {
  id: string;
  name: string;
};

type OrgMembershipRow = {
  org_id: string;
  role: string;
  // Supabase nested select result: orgs(id, name)
  orgs: Org[] | null;
};

type OrgMembership = OrgMembershipRow & {
  org: Org | null;
};

async function setOrgAction(formData: FormData) {
  "use server";
  const orgId = String(formData.get("orgId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!orgId || !role) return;

  const cookieStore = cookies();
  cookieStore.set("org_id", orgId, { path: "/" });
  cookieStore.set("org_role", role, { path: "/" });
}

async function signOutAction() {
  "use server";
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: orgMemberships } = await supabase
    .from("org_members")
    .select("org_id, role, orgs(id, name)")
    .eq("user_id", user.id)
    .returns<OrgMembershipRow[]>();

  if (!orgMemberships || orgMemberships.length === 0) {
    return (
      <div className="section">
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Geen organisatie gevonden</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Maak eerst een organisatie aan om verder te gaan.
          </p>
          <Link
            href={"/onboarding" as Route}
            className={`${buttonVariants()} mt-4 inline-flex`}
          >
            Organisatie aanmaken
          </Link>
        </div>
      </div>
    );
  }

  const memberships: OrgMembership[] = orgMemberships.map((membership) => ({
    ...membership,
    org: membership.orgs?.[0] ?? null
  }));

  const cookieStore = cookies();
  const activeOrgId = cookieStore.get("org_id")?.value;

  const active =
    orgMemberships.find((m) => m.org_id === activeOrgId) ?? orgMemberships[0];

  const getOrgName = (membership: OrgMembershipRow | OrgMembership) =>
    membership.orgs?.[0]?.name;

  const activeRole = active.role;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="w-full border-b border-border bg-card px-6 py-4 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between lg:flex-col lg:items-start lg:gap-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Actieve org</p>
            <p className="text-sm font-semibold">{getOrgName(active) ?? "Onbekend"}</p>
          </div>

          <form action={setOrgAction} className="flex items-center gap-2">
            <select
              name="orgId"
              defaultValue={active.org_id}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {memberships.map((membership) => (
                <option key={membership.org_id} value={membership.org_id}>
                  {getOrgName(membership) ?? membership.org_id}
                </option>
              ))}
            </select>

            <input type="hidden" name="role" value={activeRole} />

            <button
              type="submit"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Wissel
            </button>
          </form>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2 lg:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <p className="text-xs text-muted-foreground">Ingelogd als</p>
            <p className="text-sm font-semibold">{user.email}</p>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Uitloggen
            </button>
          </form>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
