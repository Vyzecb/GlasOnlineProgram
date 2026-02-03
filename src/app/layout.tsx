import "@/styles/globals.css";
import type { Metadata } from "next";
import Link from "next/link";

import Providers from "@/app/providers";

export const metadata: Metadata = {
  title: "GlasOnlineProgram",
  description: "Glas-ERP SaaS"
};

const navLinks = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/crm/customers", label: "CRM" },
  { href: "/app/quotes", label: "Offertes" },
  { href: "/app/orders", label: "Orders" },
  { href: "/app/planning", label: "Planning" },
  { href: "/app/work-orders", label: "Werkbonnen" },
  { href: "/app/invoices", label: "Facturen" },
  { href: "/app/reports", label: "Rapportages" },
  { href: "/app/settings", label: "Instellingen" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="main-shell">
        <Providers>
          <header className="border-b border-slate-200 bg-white">
            <div className="section flex flex-wrap items-center justify-between gap-4 py-4">
              <Link href="/" className="text-lg font-semibold text-slate-900">
                GlasOnlineProgram
              </Link>
              <nav className="flex flex-wrap gap-3 text-sm text-slate-600">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="hover:text-slate-900">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
