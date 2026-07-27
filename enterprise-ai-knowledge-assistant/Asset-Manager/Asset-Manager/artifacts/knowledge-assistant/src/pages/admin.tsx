import { useState } from "react";
import { useGetMe, useUpdateAdminUser, useDeleteAdminUser, useListAdminUsers, useListAdminDocuments, useDeleteAdminDocument } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, Users, FileText, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const { data: user, isLoading: isUserLoading } = useGetMe();

  if (isUserLoading) return <div className="flex-1 flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (user?.role !== "admin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="px-8 py-6 border-b border-border bg-card/50">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center"><ShieldAlert className="w-6 h-6 mr-3 text-primary" /> Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users and global organization documents.</p>
      </div>

      <div className="flex-1 overflow-hidden p-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <Tabs defaultValue="users" className="flex-1 flex flex-col h-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="users" className="flex items-center"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center"><FileText className="w-4 h-4 mr-2" /> All Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="flex-1 overflow-y-auto outline-none">
              <UsersTab />
            </TabsContent>
            
            <TabsContent value="documents" className="flex-1 overflow-y-auto outline-none">
              <DocumentsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useListAdminUsers();
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({ id, data: { is_active: !currentStatus } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
      onError: (err) => toast({ title: "Update failed", description: err.message, variant: "destructive" })
    });
  };

  const handleToggleRole = (id: number, currentRole: string) => {
    updateMutation.mutate({ id, data: { role: currentRole === "admin" ? "user" : "admin" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
      onError: (err) => toast({ title: "Update failed", description: err.message, variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        toast({ title: "User deleted" });
      },
      onError: (err) => toast({ title: "Delete failed", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Activity</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-muted/20">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{u.full_name}</div>
                  <div className="text-muted-foreground">{u.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">Joined {format(new Date(u.created_at), 'MMM yyyy')}</div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => handleToggleRole(u.id, u.role)}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={u.is_active} 
                      onCheckedChange={() => handleToggleActive(u.id, u.is_active)}
                      disabled={updateMutation.isPending}
                    />
                    {u.is_active ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs space-y-1">
                    <div><span className="font-medium">{u.document_count}</span> docs</div>
                    <div><span className="font-medium">{u.conversation_count}</span> chats</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the user {u.email} and all their data. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsTab() {
  const { data: docs, isLoading } = useListAdminDocuments();
  const deleteMutation = useDeleteAdminDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
        toast({ title: "Document deleted from system" });
      },
      onError: (err) => toast({ title: "Delete failed", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Document</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Owner</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {docs?.map(doc => (
              <tr key={doc.id} className="hover:bg-muted/20">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{doc.filename}</div>
                  <div className="text-xs text-muted-foreground mt-1">{(doc.size_bytes / 1024 / 1024).toFixed(2)} MB • {doc.category || 'Uncategorized'}</div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={doc.status === 'ready' ? 'default' : doc.status === 'error' ? 'destructive' : 'secondary'} className="capitalize">
                    {doc.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {doc.uploaded_by_email}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {format(new Date(doc.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Organization Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the document "{doc.filename}" from the entire system.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
            {docs?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No documents in the system.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
