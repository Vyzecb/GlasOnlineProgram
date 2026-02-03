"use client";

import { useMemo, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Invoice = {
  id: string;
  number: string;
  status: string;
  total: number;
};

export default function InvoicesPageClient({ invoices }: { invoices: Invoice[] }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return invoices;
    return invoices.filter((invoice) => invoice.status === statusFilter);
  }, [invoices, statusFilter]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facturen</CardTitle>
          <CardDescription>Filter op status en exporteer naar Exact/SnelStart.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Alle</option>
            <option value="draft">Concept</option>
            <option value="sent">Verstuurd</option>
            <option value="paid">Betaald</option>
            <option value="overdue">Verlopen</option>
          </select>
          <a href="/app/api/exports/invoices?type=exact" className={buttonVariants({ variant: "outline" })}>
            Exact CSV
          </a>
          <a href="/app/api/exports/invoices?type=snelstart" className={buttonVariants({ variant: "outline" })}>
            SnelStart CSV
          </a>
          <a href="/app/api/exports/invoices?type=json" className={buttonVariants({ variant: "outline" })}>
            UBL JSON
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultaten</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Geen facturen gevonden.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Nummer</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-border">
                      <td className="px-4 py-2">
                        <a href={`/app/invoices/${invoice.id}`} className="text-primary hover:underline">
                          {invoice.number}
                        </a>
                      </td>
                      <td className="px-4 py-2">{invoice.status}</td>
                      <td className="px-4 py-2 text-right">€ {invoice.total.toFixed(2)}</td>
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
