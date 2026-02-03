"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { resetPasswordAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={buttonVariants()} type="submit" disabled={pending}>
      {pending ? "Bezig..." : "Reset-link versturen"}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(resetPasswordAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === "error") {
      toast({ title: "Reset mislukt", description: state.message });
    }
    if (state.status === "success") {
      toast({ title: "E-mail verstuurd", description: state.message });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <CardHeader className="space-y-2 p-0">
        <CardTitle>Wachtwoord reset</CardTitle>
        <CardDescription>We sturen een reset-link naar je e-mailadres.</CardDescription>
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
        <SubmitButton />
      </form>
      <Link href="/auth/login" className="text-sm text-primary hover:underline">
        Terug naar inloggen
      </Link>
    </div>
  );
}
