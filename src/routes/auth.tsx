import { createFileRoute, useNavigate, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import logoESP from "@/assets/logoESP.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Ingresa tu nombre").max(100),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/app" />;

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("¡Bienvenido!");
    navigate({ to: "/app" });
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: values.fullName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cuenta creada. Ya puedes ingresar.");
    navigate({ to: "/app" });
  };

  return (
    <div className="flex min-h-screen bg-gradient-hero p-3 sm:p-4 lg:gap-4">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2">
            <img
              src={logoESP}
              alt="Esperanza de San Pablo"
              className="h-10 w-10 rounded-lg object-contain"
            />
            <div className="leading-tight">
              <p className="font-display text-xl font-semibold">Esperanza de San Pablo</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Una Confirmación de Fe
              </p>
            </div>
          </Link>

          <Card className="shadow-elegant motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Acceso al sistema</CardTitle>
              <CardDescription>Ingresa con tu cuenta de catequista o regístrate.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                  <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nombre completo</Label>
                      <Input id="signup-name" {...signupForm.register("fullName")} />
                      {signupForm.formState.errors.fullName && (
                        <p className="text-xs text-destructive">
                          {signupForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        {...signupForm.register("email")}
                      />
                      {signupForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {signupForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        {...signupForm.register("password")}
                      />
                      {signupForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {signupForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      El primer usuario registrado será administrador.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <AuthBrandPanel />
    </div>
  );
}
