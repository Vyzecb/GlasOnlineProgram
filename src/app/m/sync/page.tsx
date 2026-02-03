"use client";

import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dequeueAll } from "@/lib/offline/queue";
import { useOffline } from "@/app/m/OfflineProvider";

export default function SyncPage() {
  const { syncNow } = useOffline();
  const [items, setItems] = useState<{ id: string; type: string; table: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await dequeueAll();
      setItems(data.map((item) => ({ id: item.id, type: item.type, table: item.table })));
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Offline queue</CardTitle>
        </CardHeader>
        <CardContent>
          <button className={buttonVariants()} onClick={() => void syncNow()}>
            Sync now
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen pending items.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {items.map((item) => (
                <li key={item.id} className="rounded-md border border-border p-2">
                  {item.type} · {item.table}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
