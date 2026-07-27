import { useEffect, useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { User, Settings as SettingsIcon, Moon, Sun, Monitor, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) setTheme(savedTheme);
    else setTheme("dark"); // Default dark mode
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="px-8 py-6 border-b border-border bg-card/50">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center"><SettingsIcon className="w-6 h-6 mr-3 text-primary" /> Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and application settings.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center"><User className="w-5 h-5 mr-2 text-primary" /> Profile Information</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="mt-1 text-base font-medium text-foreground">{user.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <p className="mt-1 text-base font-medium text-foreground">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Role</label>
                  <div className="mt-1 flex items-center">
                    <Shield className={`w-4 h-4 mr-2 ${user.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-base font-medium capitalize text-foreground">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center"><Monitor className="w-5 h-5 mr-2 text-primary" /> Appearance</h2>
            </div>
            <div className="p-6">
              <label className="text-sm font-medium text-muted-foreground mb-4 block">Theme Preference</label>
              <div className="flex gap-4">
                <Button 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  onClick={() => handleThemeChange('light')}
                  className="flex-1 h-12"
                >
                  <Sun className="w-4 h-4 mr-2" /> Light
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  onClick={() => handleThemeChange('dark')}
                  className="flex-1 h-12"
                >
                  <Moon className="w-4 h-4 mr-2" /> Dark
                </Button>
                <Button 
                  variant={theme === 'system' ? 'default' : 'outline'} 
                  onClick={() => handleThemeChange('system')}
                  className="flex-1 h-12"
                >
                  <Monitor className="w-4 h-4 mr-2" /> System
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
