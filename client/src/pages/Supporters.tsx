import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useSupporters, useUpdateSupporterStatus } from "@/hooks/use-supporters";
import { InviteSupporterDialog } from "@/components/invite-supporter-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, User, Loader2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Supporters() {
  const { data: supporters, isLoading } = useSupporters();
  const updateStatusMutation = useUpdateSupporterStatus();
  const { user } = useAuth();

  // "My Supporters" = people who support ME (where I am the member)
  const mySupporters = supporters?.filter((s) => s.memberId === user?.id) || [];

  // "People I Support" = people I support (where I am supporter)
  const iSupport = supporters?.filter((s) => s.supporterId === user?.id) || [];

  const pendingInvites = mySupporters.filter((s) => s.status === "pending");
  const activeSupporters = mySupporters.filter((s) => s.status === "accepted");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary">Community Circle</h1>
          <InviteSupporterDialog />
        </div>

        <Tabs defaultValue="my-circle" className="w-full">
          <TabsList className="mb-8 w-full justify-start bg-transparent border-b rounded-none p-0 h-auto">
            <TabsTrigger
              value="my-circle"
              className="px-6 py-3 rounded-t-lg data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent border-b-2 border-transparent"
            >
              My Supporters
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="px-6 py-3 rounded-t-lg data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent border-b-2 border-transparent"
            >
              People I Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-circle" className="space-y-8">
            {pendingInvites.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Pending Invites
                </h3>
                <div className="grid gap-4">
                  {pendingInvites.map((s) => (
                    <Card key={s.id} className="bg-orange-50/50 border-orange-100">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">
                              {s.supporterEmail || "Unknown User"}
                            </p>
                            <p className="text-xs text-stone-500">Invitation sent</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-white text-orange-600 border-orange-200"
                        >
                          Pending
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Active Supporters
              </h3>
              <div className="grid gap-4">
                {activeSupporters.length > 0 ? (
                  activeSupporters.map((s) => (
                    <Card key={s.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">
                              {s.supporterName || s.supporterEmail}
                            </p>
                            <p className="text-xs text-stone-500">
                              Member since {new Date(s.createdAt).getFullYear()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                    You haven't added any supporters yet. Invite friends and family to get started.
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="following">
            <div className="grid gap-4">
              {iSupport.length > 0 ? (
                iSupport.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{s.memberName}</p>
                          <p className="text-xs text-stone-500">Supporting</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-secondary/50">
                        Following
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                  You aren't following anyone yet.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
