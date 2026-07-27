import { useState, useRef } from "react";
import { useListDocuments, useUploadDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Loader2, Upload, FileText, File, FileCode, CheckCircle2, AlertCircle, Search, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: documents, isLoading } = useListDocuments();

  const filteredDocs = documents?.filter(doc => 
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="px-8 py-6 border-b border-border bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage organizational documents and metadata.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search files..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <UploadDialog />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border border-dashed rounded-xl">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No documents found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {searchTerm ? "No documents matched your search." : "Upload your first document to start building your organization's knowledge base."}
            </p>
            {!searchTerm && <UploadDialog className="mt-6" />}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredDocs.map(doc => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ doc }: { doc: any }) {
  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-400" />;
    if (type.includes("csv") || type.includes("excel")) return <FileCode className="h-8 w-8 text-green-400" />;
    return <File className="h-8 w-8 text-blue-400" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Ready</Badge>;
      case 'processing': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> Processing</Badge>;
      case 'error': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"><AlertCircle className="w-3 h-3 mr-1"/> Error</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Link href={`/documents/${doc.id}`}>
      <div className="group bg-card border border-border hover:border-primary/50 rounded-xl p-5 transition-all hover:shadow-md cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
            {getFileIcon(doc.file_type)}
          </div>
          {getStatusBadge(doc.status)}
        </div>
        
        <h3 className="font-semibold text-base mb-1 truncate text-foreground" title={doc.filename}>{doc.filename}</h3>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span>{(doc.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
          <span>•</span>
          <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
        </div>

        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs">
          <div className="flex gap-1 flex-wrap">
            {doc.category ? (
              <Badge variant="outline" className="font-normal text-muted-foreground border-border">{doc.category}</Badge>
            ) : (
              <span className="text-muted-foreground italic">No category</span>
            )}
          </div>
          <span className="text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">{doc.chunk_count} chunks</span>
        </div>
      </div>
    </Link>
  );
}

function UploadDialog({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const uploadMutation = useUploadDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate({ data: { file } }, {
      onSuccess: () => {
        toast({ title: "Document uploaded", description: "The document is now processing." });
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        setOpen(false);
        setFile(null);
      },
      onError: (err) => {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}><Upload className="w-4 h-4 mr-2" /> Upload Document</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, DOCX, TXT, or CSV to add it to the knowledge base.
          </DialogDescription>
        </DialogHeader>
        
        <div 
          className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'} ${file ? 'border-primary/50 bg-primary/5' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              setFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt,.csv" />
          
          {file ? (
            <div className="flex flex-col items-center">
              <FileText className="h-10 w-10 text-primary mb-3" />
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <Button variant="ghost" size="sm" className="mt-4 h-8" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                Remove file
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center cursor-pointer">
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Click or drag file to this area</p>
              <p className="text-xs text-muted-foreground mt-1">Support for a single PDF, DOCX, TXT, or CSV.</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" className="mr-2" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Upload File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
