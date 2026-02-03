"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { loginAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={buttonVariants()} type="submit" disabled={pending}>
      {pending ? "Bezig..." : "Inloggen"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === "error") {
      toast({ title: "Inloggen mislukt", description: state.message });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <CardHeader className="space-y-2 p-0">
        <CardTitle>Inloggen</CardTitle>
        <CardDescription>Gebruik je accountgegevens om verder te gaan.</CardDescription>
      </CardHeader>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Wachtwoord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <SubmitButton />
      </form>
      <div className="flex items-center justify-between text-sm">
        <Link href="/auth/reset" className="text-primary hover:underline">
          Wachtwoord vergeten?
        </Link>
        <Link href="/auth/signup" className="text-muted-foreground hover:underline">
          Nieuw account
        </Link>
      </div>
    </div>
  );
}
