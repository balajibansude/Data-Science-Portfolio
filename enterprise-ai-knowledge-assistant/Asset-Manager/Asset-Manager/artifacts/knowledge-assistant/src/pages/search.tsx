import { useState } from "react";
import { useSearchDocuments } from "@workspace/api-client-react";
import { Search as SearchIcon, Loader2, FileText, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Search() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: results, isLoading, isError } = useSearchDocuments(
    { q: submittedQuery, limit: 10 },
    { query: { enabled: !!submittedQuery } as any }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSubmittedQuery(query.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="px-8 py-10 border-b border-border bg-card/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <SearchIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Semantic Search</h1>
          <p className="text-muted-foreground text-lg">Find exactly what you're looking for across all indexed documents.</p>
          
          <form onSubmit={handleSearch} className="relative flex items-center mt-8">
            <SearchIcon className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by concept, phrase, or question..."
              className="pl-12 pr-24 h-14 text-base rounded-2xl bg-card border-border shadow-sm focus-visible:ring-primary"
            />
            <Button 
              type="submit" 
              className="absolute right-2 h-10 px-6 rounded-xl"
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-muted/5">
        <div className="max-w-4xl mx-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Searching knowledge base...</p>
            </div>
          )}

          {!isLoading && submittedQuery && results?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg font-medium text-foreground">No results found for "{submittedQuery}"</p>
              <p className="text-muted-foreground mt-2">Try adjusting your search terms or using broader concepts.</p>
            </div>
          )}

          {!isLoading && results && results.length > 0 && (
            <div className="space-y-6">
              <p className="text-sm font-medium text-muted-foreground">
                Found {results.length} relevant excerpts
              </p>
              <div className="grid gap-4">
                {results.map((result, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <Link href={`/documents/${result.document_id}`} className="flex items-center gap-2 hover:text-primary transition-colors group">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground group-hover:underline">{result.filename}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">Page {result.page_number}</Badge>
                        <Badge variant="secondary" className={`text-xs ${result.score > 0.8 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {(result.score * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <p className="text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                        ...{result.chunk_text}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
