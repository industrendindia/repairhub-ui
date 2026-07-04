import { Navigate, Route, Routes, useNavigate } from "react-router";
import { ClipboardList } from "lucide-react";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { RepairIntakePage } from "@/features/intake/pages/RepairIntakePage";
import { Button } from "@/shared/components/ui/Button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPage } from "@/features/auth/pages/LoginPage";

function DashboardPage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const company = session?.user.company;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              {company?.logoUrl ? <img src={company.logoUrl} alt={`${company.name} logo`} className="h-11 w-11 rounded-md object-contain" /> : null}
              <div>
                <p className="text-sm font-medium text-muted-foreground">{company?.name ?? "RepairHub"}</p>
                <h1 className="text-xl font-semibold">Operations dashboard</h1>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-lg border bg-card p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="mt-1 text-lg font-medium">{session?.user.name}</p>
            </div>
            <Button onClick={() => navigate("/intake", { replace: true })} leftIcon={<ClipboardList className="h-4 w-4" />}>
              New repair intake
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Frontend foundation is ready. We can now add modules for customers,
            devices, tickets, estimates, jobs, invoices, and users one by one.
          </p>
        </div>
      </section>
    </main>
  );
}

export function AppRouter() {
  return (
    <Routes>
      {import.meta.env.DEV ? <Route path="/dev/intake-preview" element={<RepairIntakePage />} /> : null}
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RepairIntakePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/intake" element={<RepairIntakePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/intake" replace />} />
    </Routes>
  );
}
