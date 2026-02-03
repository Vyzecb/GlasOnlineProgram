"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase/client";

const lineSchema = z.object({
  description: z.string().min(2),
  quantity: z.number().min(1),
  unit_price: z.number().min(0)
});

type LineForm = z.infer<typeof lineSchema>;

type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
};

type Invoice = {
  id: string;
  number: string;
  status: string;
  total: number;
};

export default function InvoiceDetailClient({
  orgId,
  invoice,
  initialLines
}: {
  orgId: string;
  invoice: Invoice;
  initialLines: InvoiceLine[];
}) {
  const [lines, setLines] = useState<InvoiceLine[]>(initialLines);
  const [total, setTotal] = useState(() =>
    initialLines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0)
  );
  const { toast } = useToast();

  const form = useForm<LineForm>({
    resolver: zodResolver(lineSchema),
    defaultValues: { description: "", quantity: 1, unit_price: 0 }
  });

  const addLine = async (values: LineForm) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("invoice_lines")
      .insert({
        org_id: orgId,
        invoice_id: invoice.id,
        description: values.description,
        quantity: values.quantity,
        unit_price: values.unit_price
      })
      .select("id, description, quantity, unit_price")
      .single();

    if (error || !data) {
      toast({ title: "Regel opslaan mislukt", description: error?.message ?? "Onbekende fout" });
      return;
    }

    const updatedLines = [...lines, data];
    setLines(updatedLines);
    const newTotal = updatedLines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
    setTotal(newTotal);
    await supabase.from("invoices").update({ total: newTotal }).eq("id", invoice.id);
    form.reset({ description: "", quantity: 1, unit_price: 0 });
    toast({ title: "Regel toegevoegd" });
  };

  const updateStatus = async (status: string) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("invoices").update({ status }).eq("id", invoice.id);
    if (error) {
      toast({ title: "Status update mislukt", description: error.message });
      return;
    }
    toast({ title: "Status bijgewerkt", description: status });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Factuur {invoice.number}</CardTitle>
          <CardDescription>Status: {invoice.status}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <span className="text-sm font-medium">Totaal: € {total.toFixed(2)}</span>
          <button className={buttonVariants({ variant: "outline" })} onClick={() => void updateStatus("sent")}>
            Markeer verstuurd
          </button>
          <button className={buttonVariants({ variant: "outline" })} onClick={() => void updateStatus("paid")}>
            Markeer betaald
          </button>
          <a href={`/app/api/pdf/invoice/${invoice.id}`} className={buttonVariants()}>
            Genereer PDF
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nieuwe regel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(addLine)} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1 md:col-span-3">
              <label className="text-sm font-medium">Omschrijving</label>
              <input
                {...form.register("description")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {form.formState.errors.description ? (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Aantal</label>
              <input
                type="number"
                {...form.register("quantity", { valueAsNumber: true })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Prijs</label>
              <input
                type="number"
                {...form.register("unit_price", { valueAsNumber: true })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <button type="submit" className={buttonVariants()}>
                Regel toevoegen
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regels</CardTitle>
        </CardHeader>
        <CardContent>
          {lines.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen regels toegevoegd.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center justify-between rounded-md border border-border p-2">
                  <span>
                    {line.description} · {line.quantity} x € {line.unit_price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    € {(line.quantity * line.unit_price).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
