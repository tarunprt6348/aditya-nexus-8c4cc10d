import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Link } from "@tanstack/react-router";
import { fetchPrimaryRole, homeForRole } from "@/lib/roles";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Aditya Constructions" },
      { name: "description", content: "Sign in to the Owner, Staff or Customer portal." },
    ],
  }),
  component: Auth,
});

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});
const signUpSchema = signInSchema.extend({
  full_name: z.string().trim().min(2).max(100),
});

async function routeByRole(navigate: ReturnType<typeof useNavigate>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const role = await fetchPrimaryRole(u.user.id);
  navigate({ to: homeForRole(role) });
}

function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeByRole(navigate);
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = signInSchema.safeParse(fd);
    if (!parsed.success) return toast.error("Enter a valid email and password.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back.");
    await routeByRole(navigate);
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = signUpSchema.safeParse(fd);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Please complete the form.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin + "/portal",
        data: { full_name: parsed.data.full_name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Please check your email to confirm, then sign in.");
  }

  async function handleGoogle() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/portal" });
    if (res.error) toast.error("Google sign-in failed.");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden bg-navy text-navy-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="flex items-center gap-3">
          <Logo className="h-12 w-auto" />
          <span className="font-display text-lg">Aditya Constructions</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl leading-tight">One sign-in. Three portals.</h1>
          <p className="mt-4 max-w-md text-navy-foreground/75">
            Owner, Staff and Customer accounts all sign in here — you're routed to the right
            console automatically based on your role.
          </p>
        </div>
        <p className="text-xs text-navy-foreground/50">© Aditya Constructions</p>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block text-sm text-muted-foreground lg:hidden">← Back home</Link>
          <h2 className="font-display text-3xl">Welcome</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your Owner, Staff or Customer account, or create a new customer account.
          </p>
          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="si-pwd">Password</Label>
                  <Input id="si-pwd" name="password" type="password" required />
                </div>
                <Button disabled={loading} className="w-full bg-navy text-navy-foreground hover:bg-navy/90">
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" name="full_name" required />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="su-pwd">Password</Label>
                  <Input id="su-pwd" name="password" type="password" required minLength={6} />
                </div>
                <Button disabled={loading} className="w-full bg-navy text-navy-foreground hover:bg-navy/90">
                  {loading ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>
          <Toaster richColors position="top-center" />
        </div>
      </div>
    </div>
  );
}
