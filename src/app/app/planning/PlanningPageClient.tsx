"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase/client";

export type Task = {
  id: string;
  title: string;
  scheduled_date: string;
  status: string;
  assigned_to: string | null;
};

export default function PlanningPageClient({
  orgId,
  initialTasks,
  technicians
}: {
  orgId: string;
  initialTasks: Task[];
  technicians: { user_id: string }[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("planning")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_tasks", filter: `org_id=eq.${orgId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((current) => [payload.new as Task, ...current]);
          }
          if (payload.eventType === "UPDATE") {
            setTasks((current) =>
              current.map((task) => (task.id === payload.new.id ? (payload.new as Task) : task))
            );
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId]);

  const updateTask = async (taskId: string, field: "assigned_to" | "scheduled_date", value: string) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("work_tasks").update({ [field]: value }).eq("id", taskId);
    if (error) {
      toast({ title: "Update mislukt", description: error.message });
    }
  };

  const grouped = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      acc[task.scheduled_date] = acc[task.scheduled_date] ?? [];
      acc[task.scheduled_date].push(task);
      return acc;
    }, {});
  }, [tasks]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planning</CardTitle>
          <CardDescription>Bekijk taken per dag en wijs monteurs toe.</CardDescription>
        </CardHeader>
      </Card>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nog geen taken gepland. Plan een taak vanuit een order.
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([date, dateTasks]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle>{date}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dateTasks.map((task) => (
                <div key={task.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground">{task.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <select
                      value={task.assigned_to ?? ""}
                      onChange={(event) => updateTask(task.id, "assigned_to", event.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      <option value="">Niet toegewezen</option>
                      {technicians.map((tech) => (
                        <option key={tech.user_id} value={tech.user_id}>
                          {tech.user_id.slice(0, 6)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={task.scheduled_date}
                      onChange={(event) => updateTask(task.id, "scheduled_date", event.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
