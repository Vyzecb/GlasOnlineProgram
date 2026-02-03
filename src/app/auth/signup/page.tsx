"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { signupAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={buttonVariants()} type="submit" disabled={pending}>
      {pending ? "Bezig..." : "Account aanmaken"}
    </button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === "error") {
      toast({ title: "Registratie mislukt", description: state.message });
    }
    if (state.status === "success") {
      toast({ title: "Registratie voltooid", description: state.message });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <CardHeader className="space-y-2 p-0">
        <CardTitle>Registreren</CardTitle>
        <CardDescription>Maak je organisatie aan en nodig je team later uit.</CardDescription>
      </CardHeader>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="orgName">
            Organisatienaam
          </label>
          <input
            id="orgName"
            name="orgName"
            type="text"
            required
            minLength={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
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
      <div className="text-sm text-muted-foreground">
        Al een account?{" "}
        <Link href="/auth/login" className="text-primary hover:underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
