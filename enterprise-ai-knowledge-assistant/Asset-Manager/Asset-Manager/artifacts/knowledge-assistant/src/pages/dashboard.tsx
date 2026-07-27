import { useGetDashboard } from "@workspace/api-client-react";
import { Loader2, FileText, MessageSquare, Database, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from "recharts";

export default function Dashboard() {
  const { data, isLoading } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const categoryData = Object.entries(data.documents_by_category).map(([name, value]) => ({ name, value }));
  const typeData = Object.entries(data.documents_by_type).map(([name, value]) => ({ name, value }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your knowledge base and interactions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Documents" value={data.total_documents} icon={FileText} />
          <StatCard title="Total Conversations" value={data.total_conversations} icon={MessageSquare} />
          <StatCard title="Total Messages" value={data.total_messages} icon={Database} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-card-foreground">Documents by Category</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-card-foreground">Document Types</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 flex-wrap mt-4">
              {typeData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">Recent Documents</h3>
              <Link href="/documents" className="text-sm text-primary flex items-center hover:underline">
                View all <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {data.recent_documents.map(doc => (
                <Link key={doc.id} href={`/documents/${doc.id}`} className="block p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{doc.filename}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                      {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </Link>
              ))}
              {data.recent_documents.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">No documents uploaded yet.</div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">Recent Conversations</h3>
              <Link href="/chat" className="text-sm text-primary flex items-center hover:underline">
                View all <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {data.recent_conversations.map(conv => (
                <Link key={conv.id} href={`/chat/${conv.id}`} className="block p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{conv.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                      {format(new Date(conv.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </Link>
              ))}
              {data.recent_conversations.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">No conversations yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string, value: number, icon: any }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5 shadow-sm hover-elevate">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold mt-1 text-card-foreground">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
