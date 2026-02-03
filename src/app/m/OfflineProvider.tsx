"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { enqueue, type QueueItem } from "@/lib/offline/queue";
import { createQueueItem, processQueue } from "@/lib/offline/sync";

type OfflineContextValue = {
  isOnline: boolean;
  pendingCount: number;
  syncNow: () => Promise<void>;
  enqueueItem: (item: Omit<QueueItem, "id" | "created_at">) => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePending = useCallback(async () => {
    const response = await indexedDB.databases?.();
    if (response) {
      const dbExists = response.some((db) => db.name === "glas-erp-offline");
      if (!dbExists) {
        setPendingCount(0);
        return;
      }
    }
    const { dequeueAll } = await import("@/lib/offline/queue");
    const items = await dequeueAll();
    setPendingCount(items.length);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline) return;
    await processQueue();
    await updatePending();
  }, [isOnline, updatePending]);

  const enqueueItem = useCallback(
    async (item: Omit<QueueItem, "id" | "created_at">) => {
      await enqueue(createQueueItem(item));
      await updatePending();
    },
    [updatePending]
  );

  const value = useMemo(
    () => ({
      isOnline,
      pendingCount,
      syncNow,
      enqueueItem
    }),
    [isOnline, pendingCount, syncNow, enqueueItem]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return context;
}
