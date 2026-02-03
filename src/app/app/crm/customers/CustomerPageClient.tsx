"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase/client";

const customerSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["business", "consumer"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  billing_address: z.string().min(2)
});

type CustomerForm = z.infer<typeof customerSchema>;

export type Customer = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  created_at: string;
};

export default function CustomerPageClient({ orgId, initialCustomers }: { orgId: string; initialCustomers: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      type: "business",
      email: "",
      phone: "",
      billing_address: ""
    }
  });

  const filtered = useMemo(() => {
    return customers.filter((customer: Customer) => customer.name.toLowerCase().includes(search.toLowerCase()));
  }, [customers, search]);

  const onSubmit = async (values: CustomerForm) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        org_id: orgId,
        name: values.name,
        type: values.type,
        email: values.email || null,
        phone: values.phone || null,
        billing_address: values.billing_address
      })
      .select("id, name, type, email, phone, billing_address, created_at")
      .single();

    if (error || !data) {
      toast({ title: "Klant opslaan mislukt", description: error?.message ?? "Onbekende fout" });
      return;
    }

    setCustomers((current: Customer[]) => [data, ...current]);
    form.reset();
    toast({ title: "Klant opgeslagen", description: data.name });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Klanten</CardTitle>
          <CardDescription>Beheer je klantbestand en voeg nieuwe klanten toe.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
              placeholder="Zoek klant..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:max-w-sm"
            />
            <span className="text-xs text-muted-foreground">{filtered.length} resultaten</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nieuwe klant</CardTitle>
          <CardDescription>Maak een klant aan voor offerte- en orderbeheer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Naam</label>
              <input {...form.register("name")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Type</label>
              <select
                {...form.register("type")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="business">Zakelijk</option>
                <option value="consumer">Particulier</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">E-mail</label>
              <input
                {...form.register("email")}
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Telefoon</label>
              <input
                {...form.register("phone")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Factuuradres</label>
              <input
                {...form.register("billing_address")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {form.formState.errors.billing_address ? (
                <p className="text-xs text-destructive">{form.formState.errors.billing_address.message}</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <button type="submit" className={buttonVariants()}>
                Klant opslaan
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultaten</CardTitle>
          <CardDescription>Open een klant om contacten en sites te beheren.</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Geen klanten gevonden. Voeg je eerste klant toe.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Naam</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">E-mail</th>
                    <th className="px-4 py-2 text-left">Telefoon</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr key={customer.id} className="border-t border-border">
                      <td className="px-4 py-2">
                        <a href={`/app/crm/customers/${customer.id}`} className="text-primary hover:underline">
                          {customer.name}
                        </a>
                      </td>
                      <td className="px-4 py-2">{customer.type === "business" ? "Zakelijk" : "Particulier"}</td>
                      <td className="px-4 py-2">{customer.email ?? "-"}</td>
                      <td className="px-4 py-2">{customer.phone ?? "-"}</td>
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
