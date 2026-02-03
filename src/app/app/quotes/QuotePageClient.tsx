"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase/client";

const quoteSchema = z.object({
  customer_id: z.string().uuid(),
  site_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal(""))
});

const lineSchema = z.object({
  description: z.string().min(2),
  line_type: z.string().min(2),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  cost_price: z.number().min(0)
});

type QuoteForm = z.infer<typeof quoteSchema>;

type LineForm = z.infer<typeof lineSchema>;

export type Quote = {
  id: string;
  number: string;
  status: string;
  total: number;
  created_at: string;
  customer: { name: string } | null;
};

export default function QuotePageClient({
  orgId,
  customers,
  sites,
  initialQuotes
}: {
  orgId: string;
  customers: { id: string; name: string }[];
  sites: { id: string; name: string; customer_id: string }[];
  initialQuotes: Quote[];
}) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [lines, setLines] = useState<LineForm[]>([]);
  const { toast } = useToast();

  const quoteForm = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customer_id: customers[0]?.id ?? "",
      site_id: "",
      notes: ""
    }
  });

  const lineForm = useForm<LineForm>({
    resolver: zodResolver(lineSchema),
    defaultValues: {
      description: "",
      line_type: "glas",
      quantity: 1,
      unit_price: 0,
      cost_price: 0
    }
  });

  const filteredSites = useMemo(() => {
    return sites.filter((site) => site.customer_id === quoteForm.watch("customer_id"));
  }, [sites, quoteForm]);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  }, [lines]);

  const addLine = (values: LineForm) => {
    setLines((current) => [...current, values]);
    lineForm.reset({
      description: "",
      line_type: values.line_type,
      quantity: 1,
      unit_price: 0,
      cost_price: 0
    });
  };

  const createQuote = async (values: QuoteForm) => {
    if (lines.length === 0) {
      toast({ title: "Voeg minimaal één regel toe" });
      return;
    }
    const supabase = createSupabaseClient();
    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        org_id: orgId,
        customer_id: values.customer_id,
        site_id: values.site_id || null,
        notes: values.notes || null,
        total
      })
      .select("id, number, status, total, created_at, customer:customers(name)")
      .single();

    if (error || !quote) {
      toast({ title: "Offerte opslaan mislukt", description: error?.message ?? "Onbekende fout" });
      return;
    }

    const { error: lineError } = await supabase.from("quote_lines").insert(
      lines.map((line) => ({
        org_id: orgId,
        quote_id: quote.id,
        line_type: line.line_type,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        cost_price: line.cost_price,
        spec: {}
      }))
    );

    if (lineError) {
      toast({ title: "Regels opslaan mislukt", description: lineError.message });
      return;
    }

    setQuotes((current) => [quote, ...current]);
    setLines([]);
    quoteForm.reset({
      customer_id: customers[0]?.id ?? "",
      site_id: "",
      notes: ""
    });
    toast({ title: "Offerte aangemaakt", description: quote.number });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nieuwe offerte</CardTitle>
          <CardDescription>Maak een offerte met regels en berekende totalen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={quoteForm.handleSubmit(createQuote)} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Klant</label>
              <select
                {...quoteForm.register("customer_id")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Site</label>
              <select
                {...quoteForm.register("site_id")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Geen site</option>
                {filteredSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Opmerkingen</label>
              <input
                {...quoteForm.register("notes")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between rounded-md border border-border bg-muted px-4 py-2 text-sm">
              <span>Totaal</span>
              <span className="font-semibold">€ {total.toFixed(2)}</span>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className={buttonVariants()}>
                Offerte opslaan
              </button>
            </div>
          </form>

          <div className="rounded-md border border-border p-4">
            <h3 className="text-sm font-semibold">Regel toevoegen</h3>
            <form onSubmit={lineForm.handleSubmit(addLine)} className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="space-y-1 md:col-span-3">
                <label className="text-xs font-medium">Omschrijving</label>
                <input
                  {...lineForm.register("description")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {lineForm.formState.errors.description ? (
                  <p className="text-xs text-destructive">{lineForm.formState.errors.description.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Type</label>
                <input
                  {...lineForm.register("line_type")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Aantal</label>
                <input
                  type="number"
                  {...lineForm.register("quantity", { valueAsNumber: true })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Prijs</label>
                <input
                  type="number"
                  {...lineForm.register("unit_price", { valueAsNumber: true })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Inkoop</label>
                <input
                  type="number"
                  {...lineForm.register("cost_price", { valueAsNumber: true })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className={buttonVariants({ variant: "outline" })}>
                  Regel toevoegen
                </button>
              </div>
            </form>
            {lines.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Nog geen regels toegevoegd.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {lines.map((line, index) => (
                  <li key={`${line.description}-${index}`} className="flex items-center justify-between">
                    <span>
                      {line.description} · {line.quantity} x € {line.unit_price}
                    </span>
                    <span className="text-xs text-muted-foreground">€ {(line.quantity * line.unit_price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offertes</CardTitle>
          <CardDescription>Overzicht van recente offertes.</CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen offertes. Maak een offerte aan via het formulier hierboven.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Nummer</th>
                    <th className="px-4 py-2 text-left">Klant</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-t border-border">
                      <td className="px-4 py-2">
                        <a href={`/app/quotes/${quote.id}`} className="text-primary hover:underline">
                          {quote.number}
                        </a>
                      </td>
                      <td className="px-4 py-2">{quote.customer?.name ?? "-"}</td>
                      <td className="px-4 py-2">{quote.status}</td>
                      <td className="px-4 py-2 text-right">€ {quote.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
