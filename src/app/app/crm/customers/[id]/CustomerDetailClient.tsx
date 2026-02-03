"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase/client";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  role: z.string().optional().or(z.literal(""))
});

const siteSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(2),
  notes: z.string().optional().or(z.literal(""))
});

type ContactForm = z.infer<typeof contactSchema>;

type SiteForm = z.infer<typeof siteSchema>;

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
};

export type Site = {
  id: string;
  name: string;
  address: string;
  notes: string | null;
};

export type Attachment = {
  id: string;
  storage_path: string;
  description: string | null;
};

export default function CustomerDetailClient({
  orgId,
  customerId,
  contacts: initialContacts,
  sites: initialSites,
  attachments: initialAttachments
}: {
  orgId: string;
  customerId: string;
  contacts: Contact[];
  sites: Site[];
  attachments: Attachment[];
}) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", role: "" }
  });

  const siteForm = useForm<SiteForm>({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: "", address: "", notes: "" }
  });

  const createContact = async (values: ContactForm) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("customer_contacts")
      .insert({
        org_id: orgId,
        customer_id: customerId,
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        role: values.role || null
      })
      .select("id, name, email, phone, role")
      .single();

    if (error || !data) {
      toast({ title: "Contact opslaan mislukt", description: error?.message ?? "Onbekende fout" });
      return;
    }

    setContacts((current) => [...current, data]);
    contactForm.reset();
    toast({ title: "Contact toegevoegd", description: data.name });
  };

  const createSite = async (values: SiteForm) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("sites")
      .insert({
        org_id: orgId,
        customer_id: customerId,
        name: values.name,
        address: values.address,
        notes: values.notes || null
      })
      .select("id, name, address, notes")
      .single();

    if (error || !data) {
      toast({ title: "Site opslaan mislukt", description: error?.message ?? "Onbekende fout" });
      return;
    }

    setSites((current) => [...current, data]);
    siteForm.reset();
    toast({ title: "Site toegevoegd", description: data.name });
  };

  const handleAttachment = async (file: File) => {
    const supabase = createSupabaseClient();
    setUploading(true);
    const path = `${orgId}/customers/${customerId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("org-files").upload(path, file, {
      upsert: true
    });

    if (uploadError) {
      setUploading(false);
      toast({ title: "Upload mislukt", description: uploadError.message });
      return;
    }

    const { data, error } = await supabase
      .from("attachments")
      .insert({
        org_id: orgId,
        entity_type: "customer",
        entity_id: customerId,
        storage_path: path,
        description: file.name
      })
      .select("id, storage_path, description")
      .single();

    if (error || !data) {
      setUploading(false);
      toast({ title: "Attachment opslaan mislukt", description: error?.message ?? "Onbekende fout" });
      return;
    }

    setAttachments((current) => [...current, data]);
    setUploading(false);
    toast({ title: "Bestand toegevoegd", description: file.name });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contactpersonen</CardTitle>
          <CardDescription>Beheer contactpersonen voor deze klant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={contactForm.handleSubmit(createContact)} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Naam</label>
              <input
                {...contactForm.register("name")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {contactForm.formState.errors.name ? (
                <p className="text-xs text-destructive">{contactForm.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rol</label>
              <input
                {...contactForm.register("role")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">E-mail</label>
              <input
                {...contactForm.register("email")}
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Telefoon</label>
              <input
                {...contactForm.register("phone")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className={buttonVariants()}>
                Contact toevoegen
              </button>
            </div>
          </form>
          {contacts.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen contactpersonen. Voeg de eerste contactpersoon toe.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {contacts.map((contact) => (
                <li key={contact.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-xs text-muted-foreground">{contact.role ?? ""}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{contact.email ?? "-"}</div>
                  <div className="text-xs text-muted-foreground">{contact.phone ?? "-"}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
          <CardDescription>Projectlocaties gekoppeld aan deze klant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={siteForm.handleSubmit(createSite)} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Naam</label>
              <input
                {...siteForm.register("name")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {siteForm.formState.errors.name ? (
                <p className="text-xs text-destructive">{siteForm.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Adres</label>
              <input
                {...siteForm.register("address")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {siteForm.formState.errors.address ? (
                <p className="text-xs text-destructive">{siteForm.formState.errors.address.message}</p>
              ) : null}
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Notities</label>
              <input
                {...siteForm.register("notes")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className={buttonVariants()}>
                Site toevoegen
              </button>
            </div>
          </form>
          {sites.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen sites toegevoegd. Voeg een projectlocatie toe.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {sites.map((site) => (
                <li key={site.id} className="rounded-md border border-border p-3">
                  <div className="font-medium">{site.name}</div>
                  <div className="text-xs text-muted-foreground">{site.address}</div>
                  {site.notes ? <div className="text-xs text-muted-foreground">{site.notes}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bestanden</CardTitle>
          <CardDescription>Upload relevante documenten of foto’s.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleAttachment(file);
              }
            }}
          />
          {attachments.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nog geen bestanden geupload. Voeg het eerste bestand toe.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {attachments.map((attachment) => (
                <li key={attachment.id} className="rounded-md border border-border p-3">
                  <div className="font-medium">{attachment.description ?? attachment.storage_path}</div>
                  <div className="text-xs text-muted-foreground">{attachment.storage_path}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
