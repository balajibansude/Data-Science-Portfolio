import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLoginUser } from "@workspace/api-client-react";
import { BrainCircuit, Loader2, ArrowRight } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLoginUser();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("auth_token", res.access_token);
        toast({ title: "Welcome back", description: "Successfully logged in." });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Login failed",
          description: err.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-[350px]">
          <div className="flex items-center gap-2 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-foreground">Nexus</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Command center for your organizational knowledge.
          </p>

          <div className="mt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <div className="mt-2">
                  <Input 
                    id="email" 
                    type="email" 
                    autoComplete="email" 
                    className="h-11"
                    {...register("email")} 
                  />
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="mt-2">
                  <Input 
                    id="password" 
                    type="password" 
                    autoComplete="current-password" 
                    className="h-11"
                    {...register("password")} 
                  />
                  {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium shadow-lg hover:shadow-primary/25 transition-all" 
                disabled={isSubmitting || loginMutation.isPending}
              >
                {(isSubmitting || loginMutation.isPending) ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block relative w-0 flex-1 bg-muted">
        <div className="absolute inset-0 h-full w-full object-cover bg-gradient-to-br from-background via-muted to-primary/10" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-2xl bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-10 shadow-2xl">
            <h3 className="text-2xl font-bold text-foreground mb-4">Every document, instantly answerable.</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nexus acts as your senior colleague who has read every organizational document. 
              Upload PDFs, docs, and datasets. Ask complex questions. Get cited, accurate answers in seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
