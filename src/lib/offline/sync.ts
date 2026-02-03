import { createSupabaseClient } from "@/lib/supabase/client";
import { dequeueAll, removeItem, type QueueItem } from "@/lib/offline/queue";

export async function processQueue() {
  const supabase = createSupabaseClient();
  const items = await dequeueAll();

  for (const item of items) {
    try {
      if (item.type === "upload") {
        const { path, fileData, contentType } = item.payload as {
          path: string;
          fileData: string;
          contentType: string;
        };
        const blob = await (await fetch(fileData)).blob();
        const { error } = await supabase.storage.from("org-files").upload(path, blob, {
          upsert: true,
          contentType
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from(item.table).upsert(item.payload, { onConflict: "id" });
        if (error) throw error;
      }
      await removeItem(item.id);
    } catch (error) {
      console.error("Queue item failed", error);
    }
  }
}

export function createQueueItem(input: Omit<QueueItem, "id" | "created_at">): QueueItem {
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...input
  };
}
