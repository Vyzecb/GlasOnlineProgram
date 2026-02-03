"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2)
});

const resetSchema = z.object({
  email: z.string().email()
});

export type AuthState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { status: "error", message: "Controleer je gegevens." };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect("/app/dashboard");
}

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    orgName: formData.get("orgName")
  });

  if (!parsed.success) {
    return { status: "error", message: "Vul alle velden correct in." };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user) {
    return { status: "error", message: error?.message ?? "Registratie mislukt." };
  }

  const admin = createSupabaseAdminClient();
  const { data: org, error: orgError } = await admin
    .from("orgs")
    .insert({ name: parsed.data.orgName })
    .select("id")
    .single();

  if (orgError || !org) {
    return { status: "error", message: orgError?.message ?? "Kon organisatie niet aanmaken." };
  }

  const { error: memberError } = await admin.from("org_members").insert({
    org_id: org.id,
    user_id: data.user.id,
    role: "owner"
  });

  if (memberError) {
    return { status: "error", message: memberError.message };
  }

  return { status: "success", message: "Registratie gelukt. Controleer je email om te bevestigen." };
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    return { status: "error", message: "Vul een geldig e-mailadres in." };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", message: "Reset-link is verstuurd." };
}
