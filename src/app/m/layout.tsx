import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OfflineProvider } from "@/app/m/OfflineProvider";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <OfflineProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold">Technician</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </OfflineProvider>
  );
}
