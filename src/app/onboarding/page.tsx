import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function createOrgAction(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const admin = createSupabaseAdminClient();
  const { data: org, error } = await admin.from("orgs").insert({ name }).select("id").single();
  if (error || !org) {
    return;
  }

  await admin.from("org_members").insert({ org_id: org.id, user_id: user.id, role: "owner" });
  redirect("/app/dashboard");
}

export default function OnboardingPage() {
  return (
    <section className="section">
      <div className="max-w-xl rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Organisatie aanmaken</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Geef je organisatie een naam en nodig daarna je team uit.
        </p>
        <form action={createOrgAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              Organisatienaam
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className={buttonVariants()}>
            Organisatie opslaan
          </button>
        </form>
      </div>
    </section>
  );
}
