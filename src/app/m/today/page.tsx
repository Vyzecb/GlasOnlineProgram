"use client";

import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOffline } from "@/app/m/OfflineProvider";
import { createSupabaseClient } from "@/lib/supabase/client";

type Task = {
  id: string;
  title: string;
  status: string;
  scheduled_date: string;
};

export default function TodayPage() {
  const { isOnline, syncNow, pendingCount } = useOffline();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const load = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("work_tasks")
        .select("id, title, status, scheduled_date")
        .eq("assigned_to", user.id)
        .order("scheduled_date", { ascending: true });
      setTasks(data ?? []);
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mijn taken</CardTitle>
          <CardDescription>
            {isOnline ? "Online" : "Offline"} · {pendingCount} pending items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button type="button" className={buttonVariants({ variant: "outline" })} onClick={() => void syncNow()}>
            Sync nu
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vandaag en binnenkort</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Geen taken toegewezen.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-border p-3">
                  <a href={`/m/task/${task.id}`} className="font-medium text-primary hover:underline">
                    {task.title}
                  </a>
                  <div className="text-xs text-muted-foreground">{task.scheduled_date}</div>
                  <div className="text-xs text-muted-foreground">Status: {task.status}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
