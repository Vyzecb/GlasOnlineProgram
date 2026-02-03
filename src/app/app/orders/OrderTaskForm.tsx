"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase/client";

const taskSchema = z.object({
  title: z.string().min(2),
  scheduled_date: z.string().min(4),
  assigned_to: z.string().optional().or(z.literal(""))
});

type TaskForm = z.infer<typeof taskSchema>;

export default function OrderTaskForm({
  orgId,
  orderId,
  technicians
}: {
  orgId: string;
  orderId: string;
  technicians: { user_id: string }[];
}) {
  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      scheduled_date: "",
      assigned_to: ""
    }
  });
  const { toast } = useToast();

  const onSubmit = async (values: TaskForm) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("work_tasks").insert({
      org_id: orgId,
      order_id: orderId,
      title: values.title,
      scheduled_date: values.scheduled_date,
      assigned_to: values.assigned_to || null
    });

    if (error) {
      toast({ title: "Taak opslaan mislukt", description: error.message });
      return;
    }

    form.reset();
    toast({ title: "Taak gepland" });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-3">
      <div className="space-y-1 md:col-span-3">
        <label className="text-sm font-medium">Titel</label>
        <input
          {...form.register("title")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {form.formState.errors.title ? (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Datum</label>
        <input
          type="date"
          {...form.register("scheduled_date")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {form.formState.errors.scheduled_date ? (
          <p className="text-xs text-destructive">{form.formState.errors.scheduled_date.message}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Monteur</label>
        <select {...form.register("assigned_to")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">Niet toegewezen</option>
          {technicians.map((tech) => (
            <option key={tech.user_id} value={tech.user_id}>
              {tech.user_id.slice(0, 6)}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-3">
        <button type="submit" className={buttonVariants()}>
          Taak plannen
        </button>
      </div>
    </form>
  );
}
