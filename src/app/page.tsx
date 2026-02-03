import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <section className="section">
      <Card className="space-y-2">
        <CardHeader>
          <CardTitle>Glas-ERP SaaS</CardTitle>
          <CardDescription>Alle modules in één Supabase-driven platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start in het dashboard en beheer klanten, offertes, orders, planning, werkbonnen en facturatie.
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Link href="/auth/login" className={buttonVariants()}>
            Inloggen
          </Link>
          <Link href="/auth/signup" className={buttonVariants({ variant: "outline" })}>
            Registreren
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
