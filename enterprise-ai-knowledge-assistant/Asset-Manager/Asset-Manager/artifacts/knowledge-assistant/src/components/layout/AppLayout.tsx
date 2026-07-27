import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe();

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("auth_token");
      setLocation("/login");
    }
  }, [isError, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

import { Link } from "wouter";
import { LayoutDashboard, FileText, MessageSquare, Search, Settings, ShieldAlert, LogOut, BrainCircuit } from "lucide-react";
import type { User } from "@workspace/api-client-react";

function Sidebar({ user }: { user: User }) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setLocation("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/documents", label: "Knowledge Base", icon: FileText },
    { href: "/chat", label: "Conversations", icon: MessageSquare },
    { href: "/search", label: "Semantic Search", icon: Search },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Admin Panel", icon: ShieldAlert }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <BrainCircuit className="h-6 w-6 text-primary mr-3" />
        <span className="font-bold text-lg tracking-tight text-sidebar-foreground">Nexus AI</span>
      </div>
      <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate">{user.full_name}</span>
            <span className="text-xs text-sidebar-foreground/50 truncate">{user.email}</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
