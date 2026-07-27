import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListConversations, useCreateConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, MessageSquare, Clock, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export default function ChatList() {
  const [, setLocation] = useLocation();
  const { data: conversations, isLoading } = useListConversations();
  const createMutation = useCreateConversation();
  const queryClient = useQueryClient();

  const handleNewChat = () => {
    createMutation.mutate({ data: { title: "New Conversation" } }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setLocation(`/chat/${res.id}`);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-card/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Conversations</h1>
          <p className="text-sm text-muted-foreground mt-1">Ask questions about your knowledge base.</p>
        </div>
        <Button onClick={handleNewChat} disabled={createMutation.isPending} className="shadow-sm">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquarePlus className="w-4 h-4 mr-2" />}
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="text-center py-24 bg-card border border-border border-dashed rounded-xl shadow-sm">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No conversations yet</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
                Start a new chat to interact with your organization's documents.
              </p>
              <Button onClick={handleNewChat} disabled={createMutation.isPending}>
                <MessageSquarePlus className="w-4 h-4 mr-2" /> Start Chat
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {conversations.map(conv => (
                <Link key={conv.id} href={`/chat/${conv.id}`}>
                  <div className="group bg-card border border-border hover:border-primary/50 rounded-xl p-5 flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover-elevate">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <MessageSquare className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground text-base group-hover:text-primary transition-colors">{conv.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {formatDistanceToNow(new Date(conv.updated_at || conv.created_at), { addSuffix: true })}</span>
                          <span>•</span>
                          <span>{conv.message_count} messages</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
