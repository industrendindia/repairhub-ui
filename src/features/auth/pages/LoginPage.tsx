import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/loginSchema";
import { Button } from "@/shared/components/ui/Button";
import { FormField } from "@/shared/components/ui/FormField";
import { Input } from "@/shared/components/ui/Input";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);

    try {
      await signIn(values);
      const state = location.state as { from?: { pathname?: string } } | null;
      navigate(state?.from?.pathname ?? "/intake", { replace: true });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to sign in. Please check your credentials.";
      setError(message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 text-card-foreground shadow-soft">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">RepairHub</p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Use your RepairHub account credentials to access the workspace.</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Username" htmlFor="username" error={errors.username?.message}>
            <Input id="username" autoComplete="username" error={errors.username?.message} placeholder="Enter username" {...register("username")} />
          </FormField>
          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              placeholder="Enter password"
              {...register("password")}
            />
          </FormField>
          {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
          <Button className="w-full" type="submit" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </section>
    </main>
  );
}
