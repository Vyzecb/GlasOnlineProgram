"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useOffline } from "@/app/m/OfflineProvider";
import { createSupabaseClient } from "@/lib/supabase/client";

type Task = {
  id: string;
  title: string;
  status: string;
  work_order_id: string | null;
  org_id: string;
};

type Measurement = {
  id: string;
  label: string;
  width_mm: number;
  height_mm: number;
};

type ChecklistItem = {
  id: string;
  label: string;
  is_checked: boolean;
};

export default function TaskPage() {
  const params = useParams();
  const taskId = String(params?.id);
  const { isOnline, enqueueItem, syncNow } = useOffline();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [measurementForm, setMeasurementForm] = useState({ label: "", width_mm: "", height_mm: "" });

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseClient();
      const { data: taskData } = await supabase
        .from("work_tasks")
        .select("id, title, status, work_order_id, org_id")
        .eq("id", taskId)
        .single();
      setTask(taskData);
      if (taskData?.work_order_id) {
        const [measurementData, checklistData] = await Promise.all([
          supabase
            .from("work_measurements")
            .select("id, label, width_mm, height_mm")
            .eq("work_order_id", taskData.work_order_id),
          supabase
            .from("work_checklist_items")
            .select("id, label, is_checked")
            .eq("work_order_id", taskData.work_order_id)
        ]);
        setMeasurements(measurementData.data ?? []);
        setChecklist(checklistData.data ?? []);
      }
    };
    void load();
  }, [taskId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    let drawing = false;

    const getPos = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const handleDown = (event: PointerEvent) => {
      drawing = true;
      const { x, y } = getPos(event);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const handleMove = (event: PointerEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const handleUp = () => {
      drawing = false;
    };

    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerup", handleUp);
    canvas.addEventListener("pointerleave", handleUp);

    return () => {
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointerleave", handleUp);
    };
  }, []);

  const updateStatus = async (status: string) => {
    if (!task) return;
    if (!isOnline) {
      await enqueueItem({ type: "mutation", table: "work_tasks", payload: { id: task.id, status } });
      setTask({ ...task, status });
      toast({ title: "Status in wachtrij", description: status });
      return;
    }
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("work_tasks").update({ status }).eq("id", task.id);
    if (error) {
      toast({ title: "Status update mislukt", description: error.message });
      return;
    }
    setTask({ ...task, status });
  };

  const addMeasurement = async () => {
    if (!task?.work_order_id) return;
    const width = Number(measurementForm.width_mm);
    const height = Number(measurementForm.height_mm);
    if (!measurementForm.label || !width || !height) {
      toast({ title: "Vul alle velden in" });
      return;
    }
    const payload = {
      work_order_id: task.work_order_id,
      label: measurementForm.label,
      width_mm: width,
      height_mm: height
    };
    if (!isOnline) {
      await enqueueItem({ type: "mutation", table: "work_measurements", payload });
      setMeasurements((current) => [...current, { id: crypto.randomUUID(), ...payload }]);
      setMeasurementForm({ label: "", width_mm: "", height_mm: "" });
      return;
    }
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("work_measurements")
      .insert(payload)
      .select("id, label, width_mm, height_mm")
      .single();
    if (error || !data) {
      toast({ title: "Meting opslaan mislukt", description: error?.message ?? "Onbekende fout" });
      return;
    }
    setMeasurements((current) => [...current, data]);
    setMeasurementForm({ label: "", width_mm: "", height_mm: "" });
  };

  const toggleChecklist = async (item: ChecklistItem) => {
    const updated = { ...item, is_checked: !item.is_checked };
    setChecklist((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    if (!isOnline) {
      await enqueueItem({ type: "mutation", table: "work_checklist_items", payload: updated });
      return;
    }
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("work_checklist_items").update({ is_checked: updated.is_checked }).eq("id", item.id);
    if (error) {
      toast({ title: "Checklist update mislukt", description: error.message });
    }
  };

  const uploadPhoto = async (file: File, tag: string) => {
    if (!task?.work_order_id) return;
    const supabase = createSupabaseClient();
    const path = `${task.org_id}/work-orders/${task.work_order_id}/${tag}-${file.name}`;
    const fileData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    if (!isOnline) {
      await enqueueItem({ type: "upload", table: "work_photos", payload: { path, fileData, contentType: file.type } });
      await enqueueItem({
        type: "mutation",
        table: "work_photos",
        payload: { work_order_id: task.work_order_id, storage_path: path, description: tag }
      });
      toast({ title: "Foto opgeslagen (offline)" });
      return;
    }

    const { error: uploadError } = await supabase.storage.from("org-files").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload mislukt", description: uploadError.message });
      return;
    }

    const { error } = await supabase.from("work_photos").insert({ work_order_id: task.work_order_id, storage_path: path, description: tag });
    if (error) {
      toast({ title: "Foto opslaan mislukt", description: error.message });
      return;
    }
    toast({ title: "Foto toegevoegd" });
  };

  const saveSignature = async () => {
    if (!task?.work_order_id || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const path = `${task.org_id}/work-orders/${task.work_order_id}/signatures/${Date.now()}.png`;

    if (!isOnline) {
      await enqueueItem({ type: "upload", table: "work_signatures", payload: { path, fileData: dataUrl, contentType: "image/png" } });
      await enqueueItem({
        type: "mutation",
        table: "work_signatures",
        payload: { work_order_id: task.work_order_id, signer_name: "Klant", signature_svg: dataUrl }
      });
      toast({ title: "Handtekening opgeslagen (offline)" });
      return;
    }

    const supabase = createSupabaseClient();
    const blob = await (await fetch(dataUrl)).blob();
    const { error: uploadError } = await supabase.storage.from("org-files").upload(path, blob, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload mislukt", description: uploadError.message });
      return;
    }
    const { error } = await supabase.from("work_signatures").insert({ work_order_id: task.work_order_id, signer_name: "Klant", signature_svg: dataUrl });
    if (error) {
      toast({ title: "Handtekening opslaan mislukt", description: error.message });
      return;
    }
    toast({ title: "Handtekening opgeslagen" });
  };

  if (!task) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Taak wordt geladen...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>Status: {task.status}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <button className={buttonVariants({ variant: "outline" })} onClick={() => void updateStatus("started")}>Start</button>
          <button className={buttonVariants({ variant: "outline" })} onClick={() => void updateStatus("blocked")}>Blokkade</button>
          <button className={buttonVariants({ variant: "outline" })} onClick={() => void updateStatus("done")}>Afronden</button>
          <button className={buttonVariants({ variant: "outline" })} onClick={() => void syncNow()}>Sync nu</button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <input
              placeholder="Label"
              value={measurementForm.label}
              onChange={(event) => setMeasurementForm({ ...measurementForm, label: event.target.value })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder="Breedte (mm)"
              value={measurementForm.width_mm}
              onChange={(event) => setMeasurementForm({ ...measurementForm, width_mm: event.target.value })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder="Hoogte (mm)"
              value={measurementForm.height_mm}
              onChange={(event) => setMeasurementForm({ ...measurementForm, height_mm: event.target.value })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button className={buttonVariants()} onClick={() => void addMeasurement()}>
            Meting toevoegen
          </button>
          {measurements.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nog geen metingen.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {measurements.map((m) => (
                <li key={m.id} className="rounded-md border border-border p-2">
                  {m.label}: {m.width_mm} x {m.height_mm} mm
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex gap-2">
            <input
              value={newChecklistItem}
              onChange={(event) => setNewChecklistItem(event.target.value)}
              placeholder="Nieuw checklist item"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              className={buttonVariants({ variant: "outline" })}
              onClick={async () => {
                if (!task?.work_order_id || !newChecklistItem) return;
                const payload = { work_order_id: task.work_order_id, label: newChecklistItem, is_checked: false };
                if (!isOnline) {
                  await enqueueItem({ type: "mutation", table: "work_checklist_items", payload });
                  setChecklist((current) => [...current, { id: crypto.randomUUID(), ...payload }]);
                } else {
                  const supabase = createSupabaseClient();
                  const { data } = await supabase
                    .from("work_checklist_items")
                    .insert(payload)
                    .select("id, label, is_checked")
                    .single();
                  if (data) {
                    setChecklist((current) => [...current, data]);
                  }
                }
                setNewChecklistItem("");
              }}
            >
              Toevoegen
            </button>
          </div>
          {checklist.length === 0 ? (
            <p className="text-xs text-muted-foreground">Geen checklist items beschikbaar.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-md border border-border p-2">
                  <span>{item.label}</span>
                  <button className={buttonVariants({ variant: "outline", size: "sm" })} onClick={() => void toggleChecklist(item)}>
                    {item.is_checked ? "Gereed" : "Open"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foto upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["voor", "na", "schade"].map((tag) => (
            <div key={tag} className="space-y-1">
              <label className="text-xs font-medium">{tag}</label>
              <input type="file" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadPhoto(file, tag);
              }} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
          />
          <button
            className={buttonVariants({ variant: "outline" })}
            onClick={async () => {
              if (!task?.work_order_id) return;
              const payload = { id: task.work_order_id, notes };
              if (!isOnline) {
                await enqueueItem({ type: "mutation", table: "work_orders", payload });
                toast({ title: "Notitie opgeslagen (offline)" });
                return;
              }
              const supabase = createSupabaseClient();
              const { error } = await supabase.from("work_orders").update({ notes }).eq("id", task.work_order_id);
              if (error) {
                toast({ title: "Notitie opslaan mislukt", description: error.message });
              } else {
                toast({ title: "Notitie opgeslagen" });
              }
            }}
          >
            Notities opslaan
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Handtekening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <canvas ref={canvasRef} width={300} height={120} className="border border-border bg-white" />
          <button
            className={buttonVariants({ variant: "outline" })}
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const ctx = canvas.getContext("2d");
              if (!ctx) return;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }}
          >
            Wissen
          </button>
          <button className={buttonVariants()} onClick={() => void saveSignature()}>
            Handtekening opslaan
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
