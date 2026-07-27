import { useRoute } from "wouter";
import { useGetDocument, useGetDocumentChunks, useDeleteDocument } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Trash2, Calendar, FileType, HardDrive, Tag, Layers, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function DocumentDetail() {
  const [, params] = useRoute("/documents/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: doc, isLoading: isDocLoading } = useGetDocument(id);
  const { data: chunks, isLoading: isChunksLoading } = useGetDocumentChunks(id);
  const deleteMutation = useDeleteDocument();

  if (isDocLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!doc) {
    return <div className="p-8 text-center text-muted-foreground">Document not found</div>;
  }

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Document deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        setLocation("/documents");
      },
      onError: (err) => {
        toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="border-b border-border bg-card/50">
        <div className="px-8 py-4">
          <Link href="/documents" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to documents
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{doc.filename}</h1>
                <Badge variant={doc.status === 'ready' ? 'default' : doc.status === 'error' ? 'destructive' : 'secondary'} className="capitalize">
                  {doc.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                <span className="flex items-center uppercase"><FileType className="w-4 h-4 mr-1.5" /> {doc.file_type.replace('application/', '')}</span>
                <span className="flex items-center"><HardDrive className="w-4 h-4 mr-1.5" /> {(doc.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the document and all its indexed chunks. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 text-card-foreground flex items-center"><Tag className="w-4 h-4 mr-2 text-primary" /> Metadata</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Category</p>
                <p className="text-sm font-medium">{doc.category || 'Uncategorized'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {doc.topics && doc.topics.length > 0 ? (
                    doc.topics.map((topic, i) => <Badge key={i} variant="secondary" className="bg-muted">{topic}</Badge>)
                  ) : (
                    <span className="text-sm italic text-muted-foreground">No topics extracted</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Pages</p>
                  <p className="text-sm font-mono">{doc.page_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Chunks</p>
                  <p className="text-sm font-mono">{doc.chunk_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-5 border-b border-border bg-muted/20 flex justify-between items-center">
              <h3 className="font-semibold text-card-foreground flex items-center"><Layers className="w-4 h-4 mr-2 text-primary" /> Document Chunks</h3>
              <Badge variant="outline" className="font-mono text-xs">{chunks?.length || 0} loaded</Badge>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-muted/5">
              {doc.status !== 'ready' ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  {doc.status === 'processing' ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                      <p>Document is being processed and indexed...</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-8 h-8 text-destructive mb-4" />
                      <p>Document processing failed.</p>
                    </>
                  )}
                </div>
              ) : isChunksLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : chunks && chunks.length > 0 ? (
                <div className="space-y-4">
                  {chunks.map((chunk) => (
                    <div key={chunk.id} className="bg-background border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs font-mono bg-muted/50 border-border">Chunk {chunk.chunk_index}</Badge>
                        <span className="text-xs text-muted-foreground">Page {chunk.page_number}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-mono break-words">{chunk.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No chunks extracted.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
