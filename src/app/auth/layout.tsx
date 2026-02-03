export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="section flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">{children}</div>
    </div>
  );
}
