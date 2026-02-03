"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Site = {
  id: string;
  name: string;
  address: string;
  customer_id: string;
};

type Customer = {
  id: string;
  name: string;
};

export default function SitesPageClient({
  sites,
  customers
}: {
  sites: Site[];
  customers: Customer[];
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");

  const filtered = useMemo(() => {
    if (selectedCustomer === "all") {
      return sites;
    }
    return sites.filter((site) => site.customer_id === selectedCustomer);
  }, [sites, selectedCustomer]);

  const customerMap = useMemo(() => {
    return Object.fromEntries(customers.map((customer) => [customer.id, customer.name]));
  }, [customers]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
          <CardDescription>Filter op klant om projectlocaties te bekijken.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCustomer}
            onChange={(event) => setSelectedCustomer(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Alle klanten</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length} locaties</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultaten</CardTitle>
          <CardDescription>Klik een site om gekoppelde offertes/orders te bekijken.</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Geen sites gevonden. Voeg een site toe via een klantdetail.
            </div>
          ) : (
            <ul className="space-y-3 text-sm">
              {filtered.map((site) => (
                <li key={site.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{site.name}</span>
                    <span className="text-xs text-muted-foreground">{customerMap[site.customer_id] ?? ""}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{site.address}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
