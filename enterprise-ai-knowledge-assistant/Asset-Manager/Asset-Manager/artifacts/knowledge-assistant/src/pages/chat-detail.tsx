import { useState, useRef, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetConversation, useSendMessage, useDeleteConversation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, ArrowLeft, Bot, User, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import type { Citation } from "@workspace/api-client-react";

export default function ChatDetail() {
  const [, params] = useRoute("/chat/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading } = useGetConversation(id);
  const sendMessageMutation = useSendMessage();
  const deleteMutation = useDeleteConversation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, sendMessageMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessageMutation.isPending) return;

    const messageText = input;
    setInput("");

    sendMessageMutation.mutate({ id, data: { content: messageText } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${id}`] });
      },
      onError: (err) => {
        toast({ title: "Failed to send", description: err.message, variant: "destructive" });
        setInput(messageText); // Restore input on error
      }
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        setLocation("/chat");
      }
    });
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!conversation) {
    return <div className="p-8 text-center text-muted-foreground">Conversation not found</div>;
  }

  // Optimistic UI for the pending user message
  const pendingMessage = sendMessageMutation.isPending ? {
    id: 999999,
    role: "user",
    content: sendMessageMutation.variables?.data.content,
    citations: [],
    created_at: new Date().toISOString()
  } : null;

  const displayMessages = pendingMessage ? [...conversation.messages, pendingMessage] : conversation.messages;

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      <div className="h-16 px-6 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/chat" className="text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-semibold text-foreground leading-tight">{conversation.title}</h2>
            <p className="text-xs text-muted-foreground">{conversation.messages.length} messages</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this conversation. Are you sure?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
        <div className="max-w-3xl mx-auto space-y-6">
          {displayMessages.length === 0 ? (
            <div className="text-center py-20">
              <Bot className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground mt-2">Ask a question and I'll search your knowledge base for answers.</p>
            </div>
          ) : (
            displayMessages.map((msg, idx) => (
              <MessageBubble key={msg.id || idx} message={msg} />
            ))
          )}
          {sendMessageMutation.isPending && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 text-sm text-foreground shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-muted-foreground">Searching knowledge base...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-background border-t border-border shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your documents..."
              className="pr-12 h-14 rounded-full bg-card border-border shadow-sm focus-visible:ring-primary text-base"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1.5 h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
              disabled={!input.trim() || sendMessageMutation.isPending}
            >
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isUser ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'}`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser 
            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
            : 'bg-card border border-border text-card-foreground rounded-tl-sm'
        }`}>
          <div className="whitespace-pre-wrap font-sans">{message.content}</div>
        </div>
        
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 w-full space-y-2">
            {message.citations.map((cite: Citation, idx: number) => (
              <CitationCard key={idx} citation={cite} index={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CitationCard({ citation, index }: { citation: Citation, index: number }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-muted/30 border border-border rounded-lg overflow-hidden w-full max-w-md">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm font-mono shrink-0 bg-primary/10 text-primary border-primary/20">[{index}]</Badge>
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{citation.filename}</span>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">p.{citation.page_number}</span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      
      {expanded && (
        <div className="p-3 pt-0 border-t border-border/50 bg-muted/10">
          <p className="text-xs text-muted-foreground font-mono leading-relaxed mt-2 whitespace-pre-wrap pl-1 border-l-2 border-primary/30">
            {citation.chunk_text}
          </p>
        </div>
      )}
    </div>
  );
}
