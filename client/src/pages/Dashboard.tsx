import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useConversations } from "@/hooks/use-conversations";
import { CreateUpdateDialog } from "@/components/create-update-dialog";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Conversation } from "@shared/schema";
import { format } from "date-fns";
import { MessageCircle, Calendar, ArrowRight, Activity, Users } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();

  // Simple split: If I created it, it's my update. Else it's someone I follow.
  const myUpdates = conversations?.filter((c) => c.memberId === user?.id) || [];
  const followingUpdates = conversations?.filter((c) => c.memberId !== user?.id) || [];

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2">
              Welcome home, {user?.firstName}.
            </h1>
            <p className="text-muted-foreground">Here is what is happening in your circle.</p>
          </div>
          <CreateUpdateDialog />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" /> My Journey
              </h2>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : myUpdates.length > 0 ? (
                <div className="space-y-4">
                  {myUpdates.map((update) => (
                    <UpdateCard key={update.id} conversation={update} isMine />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No updates yet"
                  description="Start documenting your journey to keep your supporters in the loop."
                />
              )}
            </section>

            <section className="pt-8 border-t">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Following
              </h2>

              {followingUpdates.length > 0 ? (
                <div className="space-y-4">
                  {followingUpdates.map((update) => (
                    <UpdateCard key={update.id} conversation={update} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Not following anyone yet"
                  description="When you support others, their updates will appear here."
                />
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">My Community</CardTitle>
                <CardDescription>People supporting you</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Invite friends and family to your private circle.
                </p>
                <Link href="/supporters">
                  <span className="text-sm font-medium text-primary hover:underline cursor-pointer flex items-center gap-1">
                    Manage Supporters <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </CardContent>
            </Card>

            <div className="p-6 rounded-xl bg-white border shadow-sm">
              <h3 className="font-serif font-bold mb-4">Daily Reflection</h3>
              <p className="text-sm text-stone-600 italic leading-relaxed">
                &quot;We rise by lifting others, and in turn, we are lifted by those who care.&quot;
              </p>
              <span className="block mt-2 text-xs text-stone-400">— Robert Ingersoll</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function UpdateCard({ conversation, isMine }: { conversation: Conversation; isMine?: boolean }) {
  const latestMessage = conversation.data.messages[0]; // Assuming newest first or just taking first
  const date = new Date(conversation.createdAt);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link href={`/conversation/${conversation.id}`}>
        <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-primary tracking-wide uppercase mb-1 block">
                  {isMine ? "My Update" : `From ${conversation.memberName || "Member"}`}
                </span>
                <CardTitle className="group-hover:text-primary transition-colors text-xl">
                  {conversation.title}
                </CardTitle>
              </div>
              <div className="text-xs text-muted-foreground bg-stone-100 px-2 py-1 rounded-full flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(date, "MMM d, yyyy")}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground line-clamp-2 text-sm leading-relaxed prose prose-sm prose-stone max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <span>{children} </span>,
                  strong: ({ children }) => <strong>{children}</strong>,
                  em: ({ children }) => <em>{children}</em>,
                  a: ({ children }) => <span className="text-primary">{children}</span>,
                  img: () => null,
                }}
              >
                {latestMessage?.content ||
                  conversation.data.messages[0]?.content ||
                  "No preview available..."}
              </ReactMarkdown>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-stone-400 font-medium">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {conversation.data.messages.length} messages
              </span>
              <span className="text-primary group-hover:underline">Read full update →</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function SkeletonCard() {
  return <div className="h-32 rounded-xl bg-stone-200 animate-pulse" />;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/50">
      <h3 className="text-lg font-medium text-stone-900 mb-1">{title}</h3>
      <p className="text-stone-500 text-sm">{description}</p>
    </div>
  );
}
