import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { BrainCircuit, Loader2, ArrowRight } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegisterUser();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "" }
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("auth_token", res.access_token);
        toast({ title: "Account created", description: "Welcome to Nexus!" });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Registration failed",
          description: err.message || "Could not create account",
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

          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join your organization's AI knowledge base.
          </p>

          <div className="mt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <div className="mt-2">
                  <Input 
                    id="full_name" 
                    type="text" 
                    autoComplete="name" 
                    className="h-11"
                    {...register("full_name")} 
                  />
                  {errors.full_name && <p className="mt-1 text-sm text-destructive">{errors.full_name.message}</p>}
                </div>
              </div>

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
                    autoComplete="new-password" 
                    className="h-11"
                    {...register("password")} 
                  />
                  {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium shadow-lg hover:shadow-primary/25 transition-all" 
                disabled={isSubmitting || registerMutation.isPending}
              >
                {(isSubmitting || registerMutation.isPending) ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block relative w-0 flex-1 bg-muted">
        <div className="absolute inset-0 h-full w-full object-cover bg-gradient-to-bl from-primary/10 via-muted to-background" />
      </div>
    </div>
  );
}
