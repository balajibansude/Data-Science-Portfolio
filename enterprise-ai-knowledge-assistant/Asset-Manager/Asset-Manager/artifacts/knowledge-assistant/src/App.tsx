import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import Documents from '@/pages/documents';
import DocumentDetail from '@/pages/document-detail';
import ChatList from '@/pages/chat-list';
import ChatDetail from '@/pages/chat-detail';
import Search from '@/pages/search';
import Admin from '@/pages/admin';
import Settings from '@/pages/settings';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

setAuthTokenGetter(() => localStorage.getItem('auth_token'));

function ProtectedRoute({ component: Component }: { component: any }) {
  const [location, setLocation] = useLocation();
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    if (!token) {
      setLocation('/login');
    }
  }, [token, location, setLocation]);

  if (!token) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/documents">
        <ProtectedRoute component={Documents} />
      </Route>
      <Route path="/documents/:id">
        <ProtectedRoute component={DocumentDetail} />
      </Route>
      <Route path="/chat">
        <ProtectedRoute component={ChatList} />
      </Route>
      <Route path="/chat/:id">
        <ProtectedRoute component={ChatDetail} />
      </Route>
      <Route path="/search">
        <ProtectedRoute component={Search} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ThemeInit() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else if (savedTheme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      }
    } else {
      // Default to dark mode
      document.documentElement.classList.add("dark");
    }
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeInit />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
